
const { DualDID } = require('../lib/index')
const Web3 = require('web3')
const provider = 'http://182.162.89.51:4313'
const smartContractAddress = ''

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
  const dualDid1 = new DualDID(ethAccount1, 'test1', 'test11', web3, smartContractAddress)
  const dualDid2 = new DualDID(ethAccount2, 'test2', 'test22', web3, smartContractAddress)
  const dualDid3 = new DualDID(ethAccount3, 'test3', 'test33', web3, smartContractAddress)
  const credentialStatus = {
    "type": "blockChainCheck"
  }
  const vc = await dualDid1.createVC (
    'http://issuer.dualdid.com/credentials/0001',
    ['VerifiableCredential', 'mobileLicense'],
    dualDid2.getDid(), // holder
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
  console.log(JSON.stringify((await dualDid3.verifyJWT(vc.jwt)), null, 4))
  console.log("<- verifyVC ------------------------------->")
  console.log(JSON.stringify((await dualDid3.verifyVC(vc.jwt)), null, 4))

  console.log("<- JWT & signedTx ------------------------------->")
  const vp = await dualDid2.createVP([vc.jwt], 1)
  console.log(vp)
  console.log("<- verifyJWT ------------------------------->")
  console.log(JSON.stringify((await dualDid3.verifyJWT(vp)), null, 4))
  console.log("<- verifyVP ------------------------------->")
  console.log(JSON.stringify((await dualDid3.verifyVP(vp, 1)), null, 4))

  /*
  console.log("<- getStatusVC ------------------------------->")
  const result1 = await dualDid.getStatusVC( vc.hashToken, credentialStatus, dualDid.getDid().replace('did:dual:', ''))
  console.log(result1)

  console.log("<- setStatusVC ------------------------------->")
  const receipt = await dualDid.setStatusVC( vc.hashToken, credentialStatus, dualDid.STATUS.SUSPENDED)
  console.log(receipt)

  console.log("<- getStatusVC ------------------------------->")
  const result2 = await dualDid.getStatusVC( vc.hashToken, credentialStatus, dualDid.getDid().replace('did:dual:', ''))
  console.log(result2)
  */
}

// did()
vc()
