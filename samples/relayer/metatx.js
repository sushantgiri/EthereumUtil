var app = require('express');
var router = app.Router();
var Web3 = require('web3');

var provider = 'http://182.162.89.51:4313';
var privateKey = '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8719';
var web3 = new Web3(provider);
var account = web3.eth.accounts.privateKeyToAccount(privateKey);

var conf = require(__dirname + "/../conf/config.js");

router.post('/metatx', async function(req, res){
  var signedTx = await account.signTransaction(req.body.rawTx);
  var receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  res.send(receipt);
  res.end();
});

module.exports = {"restRouter":router};