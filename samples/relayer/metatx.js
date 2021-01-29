var app = require('express');
var router = app.Router();
var Web3 = require('web3');

var provider = 'http://182.162.89.51:4313';
var privateKey = '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8719';
var web3 = new Web3(provider);
var account = web3.eth.accounts.privateKeyToAccount(privateKey);

//  registry ABI
var abi = [
  {
		"inputs": [
			{
				"internalType": "address",
				"name": "_did",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_revokeCode",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_nonce",
				"type": "uint256"
			}
		],
		"name": "SetRevokeCodeDID",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
  },
  {
		"inputs": [
			{
				"internalType": "address",
				"name": "_did",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_revokeCode",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_timestamp",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_signer",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "_sig",
				"type": "bytes"
			}
		],
		"name": "SetRevokeCodeDID2",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
  },
  {
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_hash",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "_revokeCode",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_timestamp",
				"type": "uint256"
			}
		],
		"name": "SetRevokeCodeVC",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
  },
  {
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_hash",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "_revokeCode",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_timestamp",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_signer",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "_sig",
				"type": "bytes"
			}
		],
		"name": "SetRevokeCodeVC2",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
  },
  {
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_hash",
				"type": "bytes32"
			}
		],
		"name": "isUsedTx",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

var CONTRACTADDRESS = '' //  contract address
var DEFAULTGAS = 500000
var DEFAULTGASPRICE = 0

async function sendSignedTransaction(contract, data, data2) {
  var isUsed = contract.methods.isUsedTx(web3.utils.soliditySha3(data)).call();
  if (!isUsed) {
    return null;
  }
  const rawTx = {
    to: CONTRACTADDRESS,
    gas: DEFAULTGAS, // TODO: estimate gas
    gasPrice: DEFAULTGASPRICE,
    data: data2
  }
  var signedTx = await account.signTransaction(rawTx);
  var receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  return receipt;
}

router.post('/metatx', async function(req, res){
  var contract = new web3.eth.Contract(json, CONTRACTADDRESS)
  switch (req.body.method) {
    case 'SetRevokeCodeDID2':
      var receipt0 = await sendSignedTransaction(
          contract, 
          contract.methods.SetRevokeCodeDID(req.body.parms.did, req.body.parms.revokeCode, req.body.parms.timestamp).encodeABI(),
          contract.methods.SetRevokeCodeDID2(req.body.parms.did, req.body.parms.revokeCode, req.body.parms.timestamp, req.body.signer, req.body.signature).encodeABI()
        )
      res.json({receipt: receipt0});
      break;
    case 'SetRevokeCodeVC2':
      var receipt1 = await sendSignedTransaction(
          contract,
          contract.methods.SetRevokeCodeVC(req.body.parms.hashToken, req.body.parms.revokeCode, req.body.parms.timestamp).encodeABI(),
          contract.methods.SetRevokeCodeVC2(req.body.parms.hashToken, req.body.parms.revokeCode, req.body.parms.timestamp, req.body.signer, req.body.signature).encodeABI()
        )
      res.json({receipt: receipt1});
      break;
    default:
      break;
  }
  res.end();
});

module.exports = {"restRouter":router};
