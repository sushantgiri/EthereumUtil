import { Signer } from 'did-jwt';
import { STATUS } from './status';
import { ERROR } from './error';
interface CredentialStatus {
    id?: string;
    type: string;
}
interface DualSigner {
    jwtSigner: Signer;
    ethAccount: {
        address: string;
        signTransaction: (tx: any) => any;
        sign: (data: any) => any;
    };
}
export { STATUS, ERROR };
export declare class DualDID {
    protected resolver: any;
    private dualSigner;
    private issuerName;
    private serviceEndpoint;
    private web3;
    private contract;
    private api;
    constructor(dualSigner: DualSigner, issuerName: string, serviceEndpoint: string, web3?: any, contractAddress?: string, apiUrl?: string);
    getDid(): string;
    getAddress(): string;
    verifyJWT(jwt: string): Promise<import("did-jwt").JWTVerified>;
    createDid(): Promise<{
        jwt: string;
        hashToken: any;
    }>;
    SetRevokeCodeDid(did: string, revokeCode?: STATUS): Promise<{
        receipt: any;
    }>;
    GetRevokeCodeDid(did: string, issuer: string): Promise<{
        success: boolean;
        status: STATUS;
    }>;
    createVC(vcID: string, vcType: string[], holder: string, credentialSubject: object, credentialStatus: CredentialStatus | null, expirationDate: number, issuanceDate: string): Promise<{
        jwt: string;
        hashType: any;
        hashToken: any;
    }>;
    verifyVC(vcJwt: string): Promise<{
        result: import("did-jwt-vc").VerifiedCredential;
    }>;
    SetRevokeCodeVC(hashToken: string, credentialStatus: CredentialStatus | null | undefined, revokeCode?: STATUS): Promise<{
        receipt: any;
    }>;
    SignRevokeCodeVC(hashToken: string, credentialStatus: CredentialStatus | null | undefined, revokeCode?: STATUS): Promise<{
        parms: {
            hashToken: string;
            revokeCode: STATUS.ACTIVATE | STATUS.ERROR;
            nonce: number;
        };
        signature: null;
        signer?: undefined;
    } | {
        parms: {
            hashToken: string;
            revokeCode: STATUS.REVOKED;
            nonce: number;
        };
        signature: null;
        signer?: undefined;
    } | {
        parms: {
            hashToken: string;
            revokeCode: STATUS.REVOKED;
            nonce: number;
        };
        signer: string;
        signature: any;
    }>;
    SendSignedRevokeCodeVC(parms: {
        hashToken: string;
        revokeCode: STATUS;
        nonce: number;
    }, signer: string, signature: string): Promise<any>;
    GetRevokeCodeVC(hashToken: string, credentialStatus: CredentialStatus | null | undefined, issuer: string): Promise<{
        success: boolean;
        status: STATUS;
    }>;
    createVP(vcJwtArray: string[], nonce: string | undefined): Promise<string>;
    verifyVP(vpJwt: string, nonce: string | undefined): Promise<{
        code: string;
        msg: string;
        success: boolean;
        data: null;
    } | {
        code: string;
        msg: string;
        success: boolean;
        data: import("did-jwt-vc").VerifiedPresentation;
    }>;
}
