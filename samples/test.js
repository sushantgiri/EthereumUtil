const didJWT = require('did-jwt')
const { DualDID, STATUS, ERROR } = require('../lib/index')
const Web3 = require('web3')
const provider = 'http://182.162.89.51:4313'
const apiUrl = 'http://182.162.89.69:3000/'
const smartContractAddress = '0xd8807a7c83B8d0a558A4Fee8be312AAB7A2d1752'

const web3 = new Web3(provider) // TODO: geth url

const privateKey1 = '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709'
const privateKey2 = '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8710'
const privateKey3 = '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8711'

function createEthAccount (privateKey) {
  const account = web3.eth.accounts.privateKeyToAccount(privateKey)
  return {
    address: account.address,
    signTransaction: account.signTransaction, 
    sign: account.sign
  }
}

function createDualSigner (jwtSigner, ethAccount) {
  return { jwtSigner, ethAccount }
}

const ethAccount1 = createEthAccount(privateKey1)
const ethAccount2 = createEthAccount(privateKey2)
const ethAccount3 = createEthAccount(privateKey3)

async function did () {
  const dualSigner = createDualSigner(didJWT.SimpleSigner(privateKey1.replace('0x','')), ethAccount1)
  const dualDid = new DualDID(dualSigner, 'test1', 'test2', web3, smartContractAddress, apiUrl)
  const did = await dualDid.createDid()
  console.log("<- JWT & signedTx ------------------------------->")
  console.log(did)
  console.log("<- verifyJWT ------------------------------->")
  console.log(JSON.stringify((await dualDid.verifyJWT(did.jwt)), null, 4))

  const result0 = await dualDid.SetRevokeCodeDid(dualDid.getDid())
  console.log(result0)
  const result1 = await dualDid.GetRevokeCodeDid(dualDid.getDid(), dualDid.getDid())
  console.log(result1)
}

async function vc () {
  const dualSigner1 = createDualSigner(didJWT.SimpleSigner(privateKey1.replace('0x','')), ethAccount1)
  const dualSigner2 = createDualSigner(didJWT.SimpleSigner(privateKey2.replace('0x','')), ethAccount2)
  const dualSigner3 = createDualSigner(didJWT.SimpleSigner(privateKey3.replace('0x','')), ethAccount3)

  const issuer = new DualDID(dualSigner1, 'test1', 'test11', web3, smartContractAddress, apiUrl)
  const holder = new DualDID(dualSigner2, 'test2', 'test22', web3, smartContractAddress, apiUrl)
  const verifier = new DualDID(dualSigner3, 'test3', 'test33', web3, smartContractAddress, apiUrl)
  const credentialStatus = {
    "type": "blockChainCheck"
  }
  const vc = await issuer.createVC (
    'http://issuer.dualdid.com/credentials/0001',
    ['VerifiableCredential', 'mobileLicense'],
    holder.getDid(), // holder
    {
      "birthday": "19930533",
      "no": "11-11-11113123123",
      "issueAgency": "dddddddwq",
      "gender": "dfasasdf",
      "renewalEnd": "155522",
      "name": "ddd",
      "renewalStart": "0515",
      "issueDate": "111133asdfasdf",
      "idNo": "d121d122"
    },
    credentialStatus,
    parseInt(new Date().getTime()/1000) + 60 * 5,
    new Date().toISOString()
  )

  // console.log("<- JWT & signedTx ------------------------------->")
  // console.log(vc)
  console.log("<- verifyJWT ------------------------------->")
  console.log(JSON.stringify((await verifier.verifyJWT(vc.jwt)), null, 4))
  console.log("<- verifyVC ------------------------------->")
  console.log(JSON.stringify((await verifier.verifyVC(vc.jwt)), null, 4))

  console.log("<- JWT & signedTx ------------------------------->")
  const vp = await holder.createVP([vc.jwt], '12312312')
  console.log(vp)
  console.log("<- verifyJWT ------------------------------->")
  console.log(JSON.stringify((await verifier.verifyJWT(vp)), null, 4))
  console.log("<- verifyVP ------------------------------->")
  console.log(JSON.stringify((await verifier.verifyVP(vp, '12312312')), null, 4))

  console.log("<- GetRevokeCodeVC ------------------------------->")
  const result1 = await issuer.GetRevokeCodeVC(vc.hashToken, credentialStatus, issuer.getAddress())
  console.log(result1)
  /*
  console.log("<- setStatusVC ------------------------------->")
  const receipt = await issuer.SetRevokeCodeVC(vc.hashToken, credentialStatus, STATUS.REVOKED)
  console.log(receipt)

  console.log("<- GetRevokeCodeVC ------------------------------->")
  const result2 = await issuer.GetRevokeCodeVC(vc.hashToken, credentialStatus, issuer.getAddress())
  console.log(result2)

  console.log("<- verifyVP ------------------------------->")
  console.log(JSON.stringify((await verifier.verifyVP(vp, '12312312')), null, 4))
  */
  console.log("<- SignRevokeCodeVC ------------------------------->")
  const result2 = await issuer.SignRevokeCodeVC(vc.hashToken, credentialStatus, STATUS.REVOKED)
  console.log(result2)

  console.log("<- SendSignedRevokeCodeVC ------------------------------->")
  const receipt = await verifier.SendSignedRevokeCodeVC(result2.parms, result2.signer, result2.signature)
  console.log(receipt)

  console.log("<- GetRevokeCodeVC ------------------------------->")
  const result3 = await issuer.GetRevokeCodeVC(vc.hashToken, credentialStatus, issuer.getAddress())
  console.log(result3)

  console.log("<- verifyVP ------------------------------->")
  console.log(JSON.stringify((await verifier.verifyVP(vp, '12312312')), null, 4))

}

did()
// vc()
