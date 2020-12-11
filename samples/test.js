
const { DualDID } = require('../lib/index')
const Web3 = require('web3')
const provider = 'http://182.162.89.51:4313'
const smartContractAddress = '0x783f6Bf98958baea939C4440d0Fa698Db220cda4'

const web3 = new Web3(provider) // TODO: geth url

const privateKey1 = '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709'
const privateKey2 = '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8710'
const privateKey3 = '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8711'

const ethAccount1 = web3.eth.accounts.privateKeyToAccount(privateKey1)
const ethAccount2 = web3.eth.accounts.privateKeyToAccount(privateKey2)
const ethAccount3 = web3.eth.accounts.privateKeyToAccount(privateKey3)

async function did () {
  const dualDid = new DualDID(ethAccount1, 'test1', 'test2', web3, smartContractAddress)
  const did = await dualDid.createDid()
  console.log("<- JWT & signedTx ------------------------------->")
  console.log(did)
  console.log("<- verifyJWT ------------------------------->")
  console.log(JSON.stringify((await dualDid.verifyJWT(did.jwt)), null, 4))
}

async function vc () {
  const issuer = new DualDID(ethAccount1, 'test1', 'test11', web3, smartContractAddress)
  const holder = new DualDID(ethAccount2, 'test2', 'test22', web3, smartContractAddress)
  const verifier = new DualDID(ethAccount3, 'test3', 'test33', web3, smartContractAddress)
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
  const result1 = await issuer.GetRevokeCodeVC( vc.hashToken, credentialStatus, issuer.getDid().replace('did:dual:', ''))
  console.log(result1)
  /*
  console.log("<- setStatusVC ------------------------------->")
  const receipt = await issuer.SetRevokeCodeVC( vc.hashToken, credentialStatus, issuer.STATUS.REVOKE)
  console.log(receipt)

  console.log("<- GetRevokeCodeVC ------------------------------->")
  const result2 = await issuer.GetRevokeCodeVC( vc.hashToken, credentialStatus, issuer.getDid().replace('did:dual:', ''))
  console.log(result2)
  */
}

// did()
vc()
