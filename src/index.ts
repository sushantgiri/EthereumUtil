import { DIDDocument, PublicKey, Resolver, ParsedDID } from 'did-resolver'
import { Signer, createJWT, decodeJWT, verifyJWT } from 'did-jwt'
import { JwtCredentialPayload, createVerifiableCredentialJwt } from 'did-jwt-vc'
import { JwtPresentationPayload, createVerifiablePresentationJwt } from 'did-jwt-vc'
import { verifyCredential, verifyPresentation } from 'did-jwt-vc'
import { STATUS } from './status'
import { ERROR } from './error'
const axios = require('axios')

const abi = require('../contracts/abi')

const BLOCKCHAIN = 'blockChainCheck'
const NONE = 'none'
const DEFAULTGAS = 500000
const DEFAULTGASPRICE = 0

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

export { STATUS, ERROR }
export class DualDID {
  protected resolver: any
  private dualSigner: DualSigner
  private issuerName: any
  private serviceEndpoint: any
  private web3: any
  private contract: any
  private api: any

  constructor(dualSigner: DualSigner, issuerName: string, serviceEndpoint: string, web3: any = null, contractAddress: string = '', apiUrl: string = '') {
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
    this.api = axios.create({
      baseURL: apiUrl
    })
  }

  getDid() {
    return `did:dual:${this.dualSigner.ethAccount.address.toLowerCase()}`
  }

  getAddress() {
    return this.dualSigner.ethAccount.address.toLowerCase()
  }

  async verifyJWT (jwt: string) {
    const result = await verifyJWT(jwt, getResolverFromJwt(jwt, this.serviceEndpoint))
    return result
  }

  // DID
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

  async SetRevokeCodeDid (did: string, revokeCode:STATUS = STATUS.REVOKED) {
    if (revokeCode === STATUS.ACTIVATE || revokeCode === STATUS.ERROR) {
      return { receipt: null } 
    }
    const _did = did.replace('did:dual:', '')
    const timestamp = new Date().getTime();
    const rawTx = {
      to: this.contract.options.address,
      gas: DEFAULTGAS, // TODO: estimate gas
      gasPrice: DEFAULTGASPRICE,
      data: this.web3 ? this.contract.methods.SetRevokeCodeDID(_did, revokeCode, timestamp).encodeABI() : null
    }
    const signedTx = await this.dualSigner.ethAccount.signTransaction(rawTx)
    const receipt = this.web3 ? await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction) : null
    return { receipt }
  }

  async SignRevokeCodeDid (did: string, revokeCode:STATUS = STATUS.REVOKED) {
    if (revokeCode === STATUS.ACTIVATE || revokeCode === STATUS.ERROR) {
      return { receipt: null } 
    }
    const _did = did.replace('did:dual:', '')
    const timestamp = new Date().getTime();
    const data = this.contract.methods.SetRevokeCodeDID(_did, revokeCode, timestamp).encodeABI()
    const sign = await this.dualSigner.ethAccount.sign(this.web3.utils.sha3(data))
    return {parms: { did: _did, revokeCode, timestamp }, signer: this.dualSigner.ethAccount.address, signature: sign.signature }
  }

  async SendSignedRevokeCodeDid (parms: {did: string, revokeCode:STATUS, timestamp: number}, signer: string, signature: string) {
    /*
    const rawTx = {
      to: this.contract.options.address,
      gas: DEFAULTGAS, // TODO: estimate gas
      gasPrice: DEFAULTGASPRICE,
      data: this.web3 ? this.contract.methods.SetRevokeCodeDID2(parms.did, parms.revokeCode, parms.timestamp, signer, signature).encodeABI() : null
    }
    */
    const res = await this.api.post('/rest/metatx', { method: 'SetRevokeCodeDID2', parms, signer, signature })
    return res.data
  }

  async GetRevokeCodeDid (did: string, issuer: string): Promise<{success: boolean, status: STATUS}> {
    try {
      const status = this.web3 ? await this.contract.methods.GetRevokeCodeDID(did.replace('did:dual:', ''), issuer.replace('did:dual:', '')).call() : STATUS.ERROR
      return { success: true, status: parseInt(status) }
    } catch (error) {
      console.log(new Error(error))
      return { success: false, status: STATUS.ERROR }
    }
  }

  //   VC
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

  async SetRevokeCodeVC (hashToken: string, credentialStatus: CredentialStatus | null | undefined, revokeCode:STATUS = STATUS.REVOKED) {
    if (revokeCode === STATUS.ACTIVATE || revokeCode === STATUS.ERROR) {
      return { receipt: null } 
    }
    if (!credentialStatus || credentialStatus.type === NONE || credentialStatus.type !== BLOCKCHAIN ) {
      // TODO: test credentialStatus
      return { receipt: null }
    }
    const timestamp = new Date().getTime();
    const rawTx = {
      to: this.contract.options.address,
      gas: DEFAULTGAS, // TODO: estimate gas
      gasPrice: DEFAULTGASPRICE,
      data: this.web3 ? this.contract.methods.SetRevokeCodeVC(hashToken, revokeCode, timestamp).encodeABI() : null
    }
    const signedTx = await this.dualSigner.ethAccount.signTransaction(rawTx)
    const receipt = this.web3 ? await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction) : null
    return { receipt }
  }

  async SignRevokeCodeVC (hashToken: string, credentialStatus: CredentialStatus | null | undefined, revokeCode:STATUS = STATUS.REVOKED) {
    if (revokeCode === STATUS.ACTIVATE || revokeCode === STATUS.ERROR) {
      return { parms: { hashToken, revokeCode, nonce: 0 }, signature: null } 
    }
    if (!credentialStatus || credentialStatus.type === NONE || credentialStatus.type !== BLOCKCHAIN ) {
      // TODO: test credentialStatus
      return { parms: { hashToken, revokeCode, nonce: 0 }, signature: null }
    }
    const timestamp = new Date().getTime();
    const data = this.contract.methods.SetRevokeCodeVC(hashToken, revokeCode, timestamp).encodeABI()
    const sign = await this.dualSigner.ethAccount.sign(this.web3.utils.sha3(data))
    return {parms: { hashToken, revokeCode, timestamp }, signer: this.dualSigner.ethAccount.address, signature: sign.signature }
  }

  async SendSignedRevokeCodeVC (parms: {hashToken: string, revokeCode:STATUS, nonce: number}, signer: string, signature: string) {
    /*
    const rawTx = {
      to: this.contract.options.address,
      gas: DEFAULTGAS, // TODO: estimate gas
      gasPrice: DEFAULTGASPRICE,
      data: this.web3 ? this.contract.methods.SetRevokeCodeVC2(parms.hashToken, parms.revokeCode, parms.timestamp, signer, signature).encodeABI() : null
    }
    */
    const res = await this.api.post('/rest/metatx', { method: 'SetRevokeCodeVC2', parms, signer, signature })
    return res.data
  }
  /*
  async WriteSignedRevokeCodeVC (parms: {hashToken: string, revokeCode:STATUS, nonce: number}, signer: string, signature: string) {
    const rawTx = {
      to: this.contract.options.address,
      gas: DEFAULTGAS, // TODO: estimate gas
      gasPrice: DEFAULTGASPRICE,
      data: this.web3 ? this.contract.methods.SetRevokeCodeVC2(parms.hashToken, parms.revokeCode, parms.nonce, signer, signature).encodeABI() : null
    }
    const signedTx = await this.dualSigner.ethAccount.signTransaction(rawTx)
    const receipt = this.web3 ? await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction) : null
    return { receipt }
  }
  */
  async GetRevokeCodeVC (hashToken: string, credentialStatus: CredentialStatus | null | undefined, issuer: string): Promise<{success: boolean, status: STATUS}> {
    try {
      if (!credentialStatus || credentialStatus.type === NONE || credentialStatus.type !== BLOCKCHAIN ) {
        // TODO: test credentialStatus
        return { success: true, status: STATUS.ACTIVATE }
      }
      const status = this.web3 ? await this.contract.methods.GetRevokeCodeVC(hashToken, issuer.replace('did:dual:', '')).call() : STATUS.ERROR
      return { success: true, status: parseInt(status) }
    } catch (error) {
      console.log(new Error(error))
      return { success: false, status: STATUS.ERROR }
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
      // nonce formate = 'dual:type:nonce:data'
      // nonce type = did, vp, sign
      nonce,
    }
    const vpJwt = await createVerifiablePresentationJwt(vpPayload, issuer)
    return vpJwt
  }

  async verifyVP (vpJwt: string, nonce: string | undefined) {
    const { resolver } = getResolverFromJwt(vpJwt, this.serviceEndpoint)
    const verifiedVP = await verifyPresentation(vpJwt, resolver)
    if (nonce !== undefined && verifiedVP.verifiablePresentation && verifiedVP.verifiablePresentation.nonce !== nonce) {
      return {success: false, data: null, ...ERROR.NONCE}
    }
    let verify = true
    try {
      for (const item of verifiedVP.verifiablePresentation.verifiableCredential) {
        if (item.credentialSubject && item.credentialSubject.id) {
          verify &&= verifiedVP.verifiablePresentation.holder.toString() === item.credentialSubject.id.toString()
          if (verify) {
            const hashToken = this.web3.utils.sha3(item.proof.jwt)
            const credentialStatus = item.vc.credentialStatus
            const issuer = item.issuer.id.replace('did:dual:', '') 
            const result = await this.GetRevokeCodeVC(hashToken, credentialStatus, issuer)
            verify &&= result.success && result.status === STATUS.ACTIVATE
            if (!verify) {
              return {success: false, data: null, ...ERROR.REVOKED_VC}
            }
          } else {
            return {success: false, data: null, ...ERROR.HOLDER_DID}
          }
        }
      }
    } catch (error) {
      console.log(new Error(error))
      return {success: false, data: null, ...ERROR.UNKONWN}
    }
    return {success: true, data: verifiedVP, ...ERROR.NONE}
  }
}