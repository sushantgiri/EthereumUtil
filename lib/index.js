"use strict";
exports.__esModule = true;
exports.DualDID = exports.ERROR = exports.STATUS = void 0;
var tslib_1 = require("tslib");
var did_resolver_1 = require("did-resolver");
var did_jwt_1 = require("did-jwt");
var did_jwt_vc_1 = require("did-jwt-vc");
var did_jwt_vc_2 = require("did-jwt-vc");
var did_jwt_vc_3 = require("did-jwt-vc");
var status_1 = require("./status");
exports.STATUS = status_1.STATUS;
var error_1 = require("./error");
exports.ERROR = error_1.ERROR;
var axios = require('axios');
var abi = require('../contracts/abi');
var BLOCKCHAIN = 'blockChainCheck';
var NONE = 'none';
var DEFAULTGAS = 500000;
var DEFAULTGASPRICE = 0;
function wrapDidDocument(did, issuer, serviceEndpoint) {
    var publicKey = {
        id: did + "#controller",
        controller: did,
        type: 'Secp256k1VerificationKey2018',
        ethereumAddress: issuer
    };
    var service = [{
            id: did,
            type: 'estorm',
            serviceEndpoint: serviceEndpoint + "/" + did
        }];
    var doc = {
        '@context': 'https://w3id.org/did/v1',
        id: did,
        publicKey: [publicKey],
        service: service
    };
    return doc;
}
function getResolver(issuer, serviceEndpoint) {
    function resolve(did, parsed) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var fullId;
            return tslib_1.__generator(this, function (_a) {
                fullId = parsed.id.match(/^(.*)?(0x[0-9a-fA-F]{40})$/);
                if (!fullId)
                    throw new Error("Not a valid estorm DID: " + did);
                return [2 /*return*/, wrapDidDocument(did, issuer, serviceEndpoint)];
            });
        });
    }
    return { dual: resolve };
}
function getResolverFromJwt(jwt, serviceEndpoint) {
    var decode = did_jwt_1.decodeJWT(jwt);
    return {
        resolver: new did_resolver_1.Resolver(getResolver(decode.payload.iss.replace('did:dual:', ''), serviceEndpoint)),
        audience: decode.payload.aud ? decode.payload.aud.toString() : undefined
    };
}
var DualDID = /** @class */ (function () {
    function DualDID(dualSigner, issuerName, serviceEndpoint, web3, contractAddress, apiUrl) {
        if (web3 === void 0) { web3 = null; }
        if (contractAddress === void 0) { contractAddress = ''; }
        if (apiUrl === void 0) { apiUrl = ''; }
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
        this.dualSigner = dualSigner;
        this.issuerName = issuerName;
        this.serviceEndpoint = serviceEndpoint;
        this.resolver = new did_resolver_1.Resolver(getResolver(this.getDid(), serviceEndpoint));
        this.web3 = web3;
        this.contract = web3 ? new web3.eth.Contract(abi, contractAddress) : null;
        this.api = axios.create({
            baseURL: apiUrl
        });
    }
    DualDID.prototype.getDid = function () {
        return "did:dual:" + this.dualSigner.ethAccount.address.toLowerCase();
    };
    DualDID.prototype.getAddress = function () {
        return this.dualSigner.ethAccount.address.toLowerCase();
    };
    DualDID.prototype.verifyJWT = function (jwt) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var result;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, did_jwt_1.verifyJWT(jwt, getResolverFromJwt(jwt, this.serviceEndpoint))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    // DID
    DualDID.prototype.createDid = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var jwt, hashToken;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, did_jwt_1.createJWT({
                            aud: this.getDid(),
                            name: 'estorem did'
                        }, {
                            alg: 'ES256K-R',
                            issuer: this.getDid(),
                            signer: this.dualSigner.jwtSigner
                        })];
                    case 1:
                        jwt = _a.sent();
                        hashToken = this.web3.utils.sha3(jwt);
                        return [2 /*return*/, { jwt: jwt, hashToken: hashToken }];
                }
            });
        });
    };
    DualDID.prototype.SetRevokeCodeDid = function (did, revokeCode) {
        if (revokeCode === void 0) { revokeCode = status_1.STATUS.REVOKED; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _did, timestamp, rawTx, signedTx, receipt, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (revokeCode === status_1.STATUS.ACTIVATE || revokeCode === status_1.STATUS.ERROR) {
                            return [2 /*return*/, { receipt: null }];
                        }
                        _did = did.replace('did:dual:', '');
                        timestamp = new Date().getTime();
                        rawTx = {
                            to: this.contract.options.address,
                            gas: DEFAULTGAS,
                            gasPrice: DEFAULTGASPRICE,
                            data: this.web3 ? this.contract.methods.SetRevokeCodeDID(_did, revokeCode, timestamp).encodeABI() : null
                        };
                        return [4 /*yield*/, this.dualSigner.ethAccount.signTransaction(rawTx)];
                    case 1:
                        signedTx = _b.sent();
                        if (!this.web3) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = null;
                        _b.label = 4;
                    case 4:
                        receipt = _a;
                        return [2 /*return*/, { receipt: receipt }];
                }
            });
        });
    };
    DualDID.prototype.SignRevokeCodeDid = function (did, revokeCode) {
        if (revokeCode === void 0) { revokeCode = status_1.STATUS.REVOKED; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _did, timestamp, data, sign;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (revokeCode === status_1.STATUS.ACTIVATE || revokeCode === status_1.STATUS.ERROR) {
                            return [2 /*return*/, { receipt: null }];
                        }
                        _did = did.replace('did:dual:', '');
                        timestamp = new Date().getTime();
                        data = this.contract.methods.SetRevokeCodeDID(_did, revokeCode, timestamp).encodeABI();
                        return [4 /*yield*/, this.dualSigner.ethAccount.sign(this.web3.utils.sha3(data))];
                    case 1:
                        sign = _a.sent();
                        return [2 /*return*/, { parms: { did: _did, revokeCode: revokeCode, timestamp: timestamp }, signer: this.dualSigner.ethAccount.address, signature: sign.signature }];
                }
            });
        });
    };
    DualDID.prototype.SendSignedRevokeCodeDid = function (parms, signer, signature) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var res;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.api.post('/rest/metatx', { method: 'SetRevokeCodeDID2', parms: parms, signer: signer, signature: signature })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.data];
                }
            });
        });
    };
    DualDID.prototype.GetRevokeCodeDid = function (did, issuer) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var status_2, _a, error_2;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        if (!this.web3) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.contract.methods.GetRevokeCodeDID(did.replace('did:dual:', ''), issuer.replace('did:dual:', '')).call()];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = status_1.STATUS.ERROR;
                        _b.label = 3;
                    case 3:
                        status_2 = _a;
                        return [2 /*return*/, { success: true, status: parseInt(status_2) }];
                    case 4:
                        error_2 = _b.sent();
                        console.log(new Error(error_2));
                        return [2 /*return*/, { success: false, status: status_1.STATUS.ERROR }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    //   VC
    DualDID.prototype.createVC = function (vcID, vcType, holder, credentialSubject, credentialStatus, expirationDate, issuanceDate) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var vcPayload, issuer, jwt, hashType, hashToken;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vcPayload = {
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
                                credentialSubject: credentialSubject,
                                credentialStatus: credentialStatus
                            }
                        };
                        issuer = {
                            did: this.getDid(),
                            signer: this.dualSigner.jwtSigner
                        };
                        return [4 /*yield*/, did_jwt_vc_1.createVerifiableCredentialJwt(vcPayload, issuer)];
                    case 1:
                        jwt = _a.sent();
                        hashType = this.web3.utils.sha3(vcID);
                        hashToken = this.web3.utils.sha3(jwt);
                        return [2 /*return*/, { jwt: jwt, hashType: hashType, hashToken: hashToken }];
                }
            });
        });
    };
    DualDID.prototype.verifyVC = function (vcJwt) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var resolver, result;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resolver = getResolverFromJwt(vcJwt, this.serviceEndpoint).resolver;
                        return [4 /*yield*/, did_jwt_vc_3.verifyCredential(vcJwt, resolver)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, { result: result }];
                }
            });
        });
    };
    DualDID.prototype.SetRevokeCodeVC = function (hashToken, credentialStatus, revokeCode) {
        if (revokeCode === void 0) { revokeCode = status_1.STATUS.REVOKED; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var timestamp, rawTx, signedTx, receipt, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (revokeCode === status_1.STATUS.ACTIVATE || revokeCode === status_1.STATUS.ERROR) {
                            return [2 /*return*/, { receipt: null }];
                        }
                        if (!credentialStatus || credentialStatus.type === NONE || credentialStatus.type !== BLOCKCHAIN) {
                            // TODO: test credentialStatus
                            return [2 /*return*/, { receipt: null }];
                        }
                        timestamp = new Date().getTime();
                        rawTx = {
                            to: this.contract.options.address,
                            gas: DEFAULTGAS,
                            gasPrice: DEFAULTGASPRICE,
                            data: this.web3 ? this.contract.methods.SetRevokeCodeVC(hashToken, revokeCode, timestamp).encodeABI() : null
                        };
                        return [4 /*yield*/, this.dualSigner.ethAccount.signTransaction(rawTx)];
                    case 1:
                        signedTx = _b.sent();
                        if (!this.web3) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = null;
                        _b.label = 4;
                    case 4:
                        receipt = _a;
                        return [2 /*return*/, { receipt: receipt }];
                }
            });
        });
    };
    DualDID.prototype.SignRevokeCodeVC = function (hashToken, credentialStatus, revokeCode) {
        if (revokeCode === void 0) { revokeCode = status_1.STATUS.REVOKED; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var timestamp, data, sign;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (revokeCode === status_1.STATUS.ACTIVATE || revokeCode === status_1.STATUS.ERROR) {
                            return [2 /*return*/, { parms: { hashToken: hashToken, revokeCode: revokeCode, nonce: 0 }, signature: null }];
                        }
                        if (!credentialStatus || credentialStatus.type === NONE || credentialStatus.type !== BLOCKCHAIN) {
                            // TODO: test credentialStatus
                            return [2 /*return*/, { parms: { hashToken: hashToken, revokeCode: revokeCode, nonce: 0 }, signature: null }];
                        }
                        timestamp = new Date().getTime();
                        data = this.contract.methods.SetRevokeCodeVC(hashToken, revokeCode, timestamp).encodeABI();
                        return [4 /*yield*/, this.dualSigner.ethAccount.sign(this.web3.utils.sha3(data))];
                    case 1:
                        sign = _a.sent();
                        return [2 /*return*/, { parms: { hashToken: hashToken, revokeCode: revokeCode, timestamp: timestamp }, signer: this.dualSigner.ethAccount.address, signature: sign.signature }];
                }
            });
        });
    };
    DualDID.prototype.SendSignedRevokeCodeVC = function (parms, signer, signature) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var res;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.api.post('/rest/metatx', { method: 'SetRevokeCodeVC2', parms: parms, signer: signer, signature: signature })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.data];
                }
            });
        });
    };
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
    DualDID.prototype.GetRevokeCodeVC = function (hashToken, credentialStatus, issuer) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var status_3, _a, error_3;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        if (!credentialStatus || credentialStatus.type === NONE || credentialStatus.type !== BLOCKCHAIN) {
                            // TODO: test credentialStatus
                            return [2 /*return*/, { success: true, status: status_1.STATUS.ACTIVATE }];
                        }
                        if (!this.web3) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.contract.methods.GetRevokeCodeVC(hashToken, issuer.replace('did:dual:', '')).call()];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = status_1.STATUS.ERROR;
                        _b.label = 3;
                    case 3:
                        status_3 = _a;
                        return [2 /*return*/, { success: true, status: parseInt(status_3) }];
                    case 4:
                        error_3 = _b.sent();
                        console.log(new Error(error_3));
                        return [2 /*return*/, { success: false, status: status_1.STATUS.ERROR }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DualDID.prototype.createVP = function (vcJwtArray, nonce) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var issuer, vpPayload, vpJwt;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        issuer = {
                            did: this.getDid(),
                            signer: this.dualSigner.jwtSigner
                        };
                        vpPayload = {
                            vp: {
                                '@context': ['https://www.w3.org/2018/credentials/v1'],
                                type: ['VerifiablePresentation'],
                                verifiableCredential: vcJwtArray
                            },
                            // nonce formate = 'dual:type:nonce:data'
                            // nonce type = did, vp, sign
                            nonce: nonce
                        };
                        return [4 /*yield*/, did_jwt_vc_2.createVerifiablePresentationJwt(vpPayload, issuer)];
                    case 1:
                        vpJwt = _a.sent();
                        return [2 /*return*/, vpJwt];
                }
            });
        });
    };
    DualDID.prototype.verifyVP = function (vpJwt, nonce) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var resolver, verifiedVP, verify, _i, _a, item, hashToken, credentialStatus, issuer, result, error_4;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        resolver = getResolverFromJwt(vpJwt, this.serviceEndpoint).resolver;
                        return [4 /*yield*/, did_jwt_vc_3.verifyPresentation(vpJwt, resolver)];
                    case 1:
                        verifiedVP = _b.sent();
                        if (nonce !== undefined && verifiedVP.verifiablePresentation && verifiedVP.verifiablePresentation.nonce !== nonce) {
                            return [2 /*return*/, tslib_1.__assign({ success: false, data: null }, error_1.ERROR.NONCE)];
                        }
                        verify = true;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 8, , 9]);
                        _i = 0, _a = verifiedVP.verifiablePresentation.verifiableCredential;
                        _b.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 7];
                        item = _a[_i];
                        if (!(item.credentialSubject && item.credentialSubject.id)) return [3 /*break*/, 6];
                        verify && (verify = verifiedVP.verifiablePresentation.holder.toString() === item.credentialSubject.id.toString());
                        if (!verify) return [3 /*break*/, 5];
                        hashToken = this.web3.utils.sha3(item.proof.jwt);
                        credentialStatus = item.vc.credentialStatus;
                        issuer = item.issuer.id.replace('did:dual:', '');
                        return [4 /*yield*/, this.GetRevokeCodeVC(hashToken, credentialStatus, issuer)];
                    case 4:
                        result = _b.sent();
                        verify && (verify = result.success && result.status === status_1.STATUS.ACTIVATE);
                        if (!verify) {
                            return [2 /*return*/, tslib_1.__assign({ success: false, data: null }, error_1.ERROR.REVOKED_VC)];
                        }
                        return [3 /*break*/, 6];
                    case 5: return [2 /*return*/, tslib_1.__assign({ success: false, data: null }, error_1.ERROR.HOLDER_DID)];
                    case 6:
                        _i++;
                        return [3 /*break*/, 3];
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_4 = _b.sent();
                        console.log(new Error(error_4));
                        return [2 /*return*/, tslib_1.__assign({ success: false, data: null }, error_1.ERROR.UNKONWN)];
                    case 9: return [2 /*return*/, tslib_1.__assign({ success: true, data: verifiedVP }, error_1.ERROR.NONE)];
                }
            });
        });
    };
    return DualDID;
}());
exports.DualDID = DualDID;
