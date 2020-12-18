import { DIDDocument, PublicKey, Resolver, ParsedDID } from 'did-resolver'
import { Signer, createJWT, decodeJWT, verifyJWT } from 'did-jwt'
import { JwtCredentialPayload, createVerifiableCredentialJwt } from 'did-jwt-vc'
import { JwtPresentationPayload, createVerifiablePresentationJwt } from 'did-jwt-vc'
import { verifyCredential, verifyPresentation } from 'did-jwt-vc'
const abi = require('../contracts/abi')

const BLOCKCHAIN = 'blockChainCheck'

interface CredentialStatus {
  id?: string,
  type: string
}

interface DualSigner {
  jwtSigner: Signer,
  ethAccount: {
    address: string,
    signTransaction: (tx: any) => any, 
    sign: (data: any) => any
  }
}

function wrapDidDocument (did: string, issuer: string, serviceEndpoint: string): DIDDocument {
  const publicKey: PublicKey = {
    id: `${did}#controller`,
    controller: did,
    type: 'Secp256k1VerificationKey2018',
    ethereumAddress: issuer
  }
  const service = [{
    id: did,
    type: 'estorm',
    serviceEndpoint: `${serviceEndpoint}/${did}`
  }]

  const doc: DIDDocument = {
    '@context': 'https://w3id.org/did/v1',
    id: did,
    publicKey: [publicKey],
    service
  }
  return doc
}

function getResolver (issuer: string, serviceEndpoint: string) {
  async function resolve (did: string, parsed: ParsedDID): Promise<null | DIDDocument> {
    const fullId = parsed.id.match(/^(.*)?(0x[0-9a-fA-F]{40})$/)
    if (!fullId) throw new Error(`Not a valid estorm DID: ${did}`)
    return wrapDidDocument(did, issuer, serviceEndpoint)
  }
  return { dual: resolve }
}

function getResolverFromJwt (jwt: string, serviceEndpoint: string) {
  const decode: any = decodeJWT(jwt)
  return {
    resolver: new Resolver(getResolver(decode.payload.iss.replace('did:dual:', ''), serviceEndpoint)),
    audience: decode.payload.aud ? decode.payload.aud.toString() : undefined
  }
}

export class DualDID {
  protected resolver: any
  private dualSigner: DualSigner
  private issuerName: any
  private serviceEndpoint: any
  private web3: any
  private contract: any

  protected STATUS = {
    ACTIVATE: 0,
    REVOKE: 1,
    // TODO: add revoked code here
  }

  constructor(dualSigner: DualSigner, issuerName: string, serviceEndpoint: string, web3: any = null, contractAddress: string = '') {
    /*
      const Web3 = require('web3')
      const web3 = new Web3('http://182.162.89.51:8545')

      const privateKey = '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709'
      const ethAccount = web3.eth.accounts.privateKeyToAccount(privateKey)
      const jwtSigner = didJWT.SimpleSigner(privateKey.replace('0x',''))

      ....

      const result = await dualDid.createDid()
      web3.eth.sendSignedTransaction(result.signedTx).on('receipt', console.log)
    */
    this.dualSigner = dualSigner
    this.issuerName = issuerName
    this.serviceEndpoint = serviceEndpoint
    this.resolver = new Resolver(getResolver(this.getDid(), serviceEndpoint))
    this.web3 = web3
    this.contract = web3 ? new web3.eth.Contract(abi, contractAddress) : null
  }

  getDid() {
    return `did:dual:${this.dualSigner.ethAccount.address.toLowerCase()}`
  }

  async createDid () {
    const jwt = await createJWT(
      {
        aud: this.getDid(),
        name: 'estorem did'
      },
      {
        alg: 'ES256K-R',
        issuer: this.getDid(),
        signer: this.dualSigner.jwtSigner
      }
    )

    const hashToken = this.web3.utils.sha3(jwt)

    return { jwt, hashToken }
  }

  async verifyJWT (jwt: string) {
    const result = await verifyJWT(jwt, getResolverFromJwt(jwt, this.serviceEndpoint))
    return result
  }

  async createVC (vcID: string, vcType: string[], holder: string, credentialSubject: object, credentialStatus: CredentialStatus | null, expirationDate: number, issuanceDate: string) {
    const vcPayload: JwtCredentialPayload = {
      sub: holder,
      exp: expirationDate,
      vc: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: vcID,
        type: vcType,
        issuer: {
          id: this.getDid(),
          name: this.issuerName
        },
        issuanceDate: issuanceDate,
        credentialSubject,
        credentialStatus
      }
    }
    const issuer = {
      did: this.getDid(),
      signer: this.dualSigner.jwtSigner
    }

    const jwt = await createVerifiableCredentialJwt(vcPayload, issuer)
    const hashType = this.web3.utils.sha3(vcID)
    const hashToken = this.web3.utils.sha3(jwt)

    return { jwt, hashType, hashToken }
  }

  async verifyVC (vcJwt: string) {
    const { resolver } = getResolverFromJwt(vcJwt, this.serviceEndpoint)
    const result = await verifyCredential(vcJwt, resolver)
    return { result }
  }

  async SetRevokeCodeVC (hashToken: string, credentialStatus: CredentialStatus | null | undefined, revokeCode:number = 1) {
    if (revokeCode === 0) {
      return { receipt: null } 
    }
    if (!credentialStatus || credentialStatus.type !== BLOCKCHAIN ) {
      // TODO: test credentialStatus
      return { receipt: null }
    }
    const rawTx = {
      to: this.contract.options.address,
      gas: 400000, // gas free
      gasPrice: 0,
      data: this.web3 ? this.contract.methods.SetRevokeCodeVC(hashToken, revokeCode).encodeABI() : null
    }
    const signedTx = await this.dualSigner.ethAccount.signTransaction(rawTx)
    const receipt = this.web3 ? await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction) : null
    return { receipt }
  }

  async GetRevokeCodeVC (hashToken: string, credentialStatus: CredentialStatus | null | undefined, issuer: string) {
    try {
      if (!credentialStatus || credentialStatus.type !== BLOCKCHAIN ) {
        // TODO: test credentialStatus
        return { success: true, code: 0 }
      }
      const result = this.web3 ? await this.contract.methods.GetRevokeCodeVC(hashToken, issuer).call() : null
      return { success: true, code: result }
    } catch (error) {
      console.log(new Error(error))
      return { success: false }
    }
  }

  async createVP (vcJwtArray: string[], nonce: string | undefined) {
    const issuer = {
      did: this.getDid(),
      signer: this.dualSigner.jwtSigner
    }
    const vpPayload: JwtPresentationPayload = {
      vp: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        verifiableCredential: vcJwtArray
      },
      nonce,
    }
    const vpJwt = await createVerifiablePresentationJwt(vpPayload, issuer)
    return vpJwt
  }

  async verifyVP (vpJwt: string, nonce: string | undefined) {
    const { resolver } = getResolverFromJwt(vpJwt, this.serviceEndpoint)
    const verifiedVP = await verifyPresentation(vpJwt, resolver)
    if (nonce !== undefined && verifiedVP.verifiablePresentation && verifiedVP.verifiablePresentation.nonce !== nonce) {
      return null
    }
    let verify = true
    for (const item of verifiedVP.verifiablePresentation.verifiableCredential) {
      if (item.credentialSubject && item.credentialSubject.id) {
        verify &&= verifiedVP.verifiablePresentation.holder.toString() === item.credentialSubject.id.toString()
        if (verify) {
          const hashToken = this.web3.utils.sha3(item.proof.jwt)
          const credentialStatus = item.vc.credentialStatus
          const issuer = item.issuer.id.replace('did:dual:', '') 
          const result = await this.GetRevokeCodeVC(hashToken, credentialStatus, issuer)
          verify &&= result.success && result.code === '0'
        }
      }
    }
    return verify ? verifiedVP : null
  }

}