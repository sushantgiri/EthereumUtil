import { Signer } from 'did-jwt';
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
export declare class DualDID {
    protected resolver: any;
    private dualSigner;
    private issuerName;
    private serviceEndpoint;
    private web3;
    private contract;
    protected STATUS: {
        ACTIVATE: number;
        REVOKE: number;
    };
    constructor(dualSigner: DualSigner, issuerName: string, serviceEndpoint: string, web3?: any, contractAddress?: string);
    getDid(): string;
    createDid(): Promise<{
        jwt: string;
        hashToken: any;
    }>;
    verifyJWT(jwt: string): Promise<import("did-jwt").JWTVerified>;
    createVC(vcID: string, vcType: string[], holder: string, credentialSubject: object, credentialStatus: CredentialStatus | null, expirationDate: number, issuanceDate: string): Promise<{
        jwt: string;
        hashType: any;
        hashToken: any;
    }>;
    verifyVC(vcJwt: string): Promise<{
        result: import("did-jwt-vc").VerifiedCredential;
    }>;
    SetRevokeCodeVC(hashToken: string, credentialStatus: CredentialStatus | null | undefined, revokeCode?: number): Promise<{
        receipt: any;
    }>;
    GetRevokeCodeVC(hashToken: string, credentialStatus: CredentialStatus | null | undefined, issuer: string): Promise<{
        success: boolean;
        code: any;
    } | {
        success: boolean;
        code?: undefined;
    }>;
    createVP(vcJwtArray: string[], nonce: string | undefined): Promise<string>;
    verifyVP(vpJwt: string, nonce: string | undefined): Promise<import("did-jwt-vc").VerifiedPresentation | null>;
}
export {};
