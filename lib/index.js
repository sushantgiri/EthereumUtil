"use strict";
exports.__esModule = true;
exports.DualDID = void 0;
var tslib_1 = require("tslib");
var did_resolver_1 = require("did-resolver");
var did_jwt_1 = require("did-jwt");
var did_jwt_vc_1 = require("did-jwt-vc");
var did_jwt_vc_2 = require("did-jwt-vc");
var did_jwt_vc_3 = require("did-jwt-vc");
var abi = require('../contracts/abi');
var BLOCKCHAIN = 'blockChainCheck';
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
    function DualDID(ethAccount, issuerName, serviceEndpoint, web3, contractAddress) {
        if (web3 === void 0) { web3 = null; }
        if (contractAddress === void 0) { contractAddress = ''; }
        this.STATUS = {
            ACTIVATE: 0,
            SUSPENDED: 1001,
            REVOKED: 1002
        };
        /*
          const Web3 = require('web3')
          const web3 = new Web3('http://182.162.89.51:8545')
    
          const privateKey = '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709'
          const ethAccount = web3.eth.accounts.privateKeyToAccount(privateKey)
          const jwtSigner = didJWT.SimpleSigner(privateKey.replace('0x',''))
    
          const result = createDid()
          web3.eth.sendSignedTransaction(result.signedTx).on('receipt', console.log)
        */
        this.ethAccount = ethAccount;
        this.jwtSigner = did_jwt_1.SimpleSigner(ethAccount.privateKey.replace('0x', ''));
        this.issuerName = issuerName;
        this.serviceEndpoint = serviceEndpoint;
        this.resolver = new did_resolver_1.Resolver(getResolver(ethAccount.address.toLowerCase(), serviceEndpoint));
        this.web3 = web3;
        this.contract = web3 ? new web3.eth.Contract(abi, contractAddress) : null;
    }
    DualDID.prototype.getDid = function () {
        return "did:dual:" + this.ethAccount.address.toLowerCase();
    };
    DualDID.prototype.createDid = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var did, jwt, hashToken;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        did = "did:dual:" + this.ethAccount.address.toLowerCase();
                        return [4 /*yield*/, did_jwt_1.createJWT({
                                aud: did,
                                name: 'estorem did'
                            }, {
                                alg: 'ES256K-R',
                                issuer: did,
                                signer: this.jwtSigner
                            })];
                    case 1:
                        jwt = _a.sent();
                        hashToken = this.web3.utils.sha3(jwt);
                        return [2 /*return*/, { jwt: jwt, hashToken: hashToken }];
                }
            });
        });
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
                                    id: "did:dual:" + this.ethAccount.address.toLowerCase(),
                                    name: this.issuerName
                                },
                                issuanceDate: issuanceDate,
                                credentialSubject: credentialSubject,
                                credentialStatus: credentialStatus
                            }
                        };
                        issuer = {
                            did: "did:dual:" + this.ethAccount.address.toLowerCase(),
                            signer: this.jwtSigner
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
    DualDID.prototype.setStatusVC = function (hashToken, credentialStatus, newStatus) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var rawTx, signedTx, receipt, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log(credentialStatus);
                        if (!credentialStatus || credentialStatus.type !== BLOCKCHAIN) {
                            // TODO: test credentialStatus
                            return [2 /*return*/, { receipt: null }];
                        }
                        rawTx = {
                            to: this.contract.options.address,
                            gas: 400000,
                            gasPrice: 0,
                            data: this.web3 ? this.contract.methods.setStatusVC(hashToken, newStatus).encodeABI() : null
                        };
                        return [4 /*yield*/, this.ethAccount.signTransaction(rawTx)];
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
    DualDID.prototype.getStatusVC = function (hashToken, credentialStatus, issuer) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var result, _a, error_1;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        if (!credentialStatus || credentialStatus.type !== BLOCKCHAIN) {
                            // TODO: test credentialStatus
                            return [2 /*return*/, { success: true, status: 0 }];
                        }
                        if (!this.web3) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.contract.methods.getStatusVC(hashToken, issuer).call()];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = null;
                        _b.label = 3;
                    case 3:
                        result = _a;
                        return [2 /*return*/, { success: true, status: result }];
                    case 4:
                        error_1 = _b.sent();
                        console.log(new Error(error_1));
                        return [2 /*return*/, { success: false }];
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
                            did: "did:dual:" + this.ethAccount.address.toLowerCase(),
                            signer: this.jwtSigner
                        };
                        vpPayload = {
                            vp: {
                                '@context': ['https://www.w3.org/2018/credentials/v1'],
                                type: ['VerifiablePresentation'],
                                verifiableCredential: vcJwtArray
                            },
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
            var resolver, verifiedVP, holder;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resolver = getResolverFromJwt(vpJwt, this.serviceEndpoint).resolver;
                        return [4 /*yield*/, did_jwt_vc_3.verifyPresentation(vpJwt, resolver)];
                    case 1:
                        verifiedVP = _a.sent();
                        if (nonce !== undefined && verifiedVP.verifiablePresentation && verifiedVP.verifiablePresentation.nonce !== nonce) {
                            return [2 /*return*/, null];
                        }
                        holder = true;
                        verifiedVP.verifiablePresentation.verifiableCredential.forEach(function (element) {
                            if (element.credentialSubject && element.credentialSubject.id) {
                                holder && (holder = verifiedVP.verifiablePresentation.holder.toString() === element.credentialSubject.id.toString());
                            }
                        });
                        return [2 /*return*/, holder ? verifiedVP : null];
                }
            });
        });
    };
    return DualDID;
}());
exports.DualDID = DualDID;