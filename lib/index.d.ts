interface CredentialStatus {
    id?: string;
    type: string;
}
export declare class DualDID {
    protected resolver: any;
    private ethAccount;
    private jwtSigner;
    private issuerName;
    private serviceEndpoint;
    private web3;
    private contract;
    protected STATUS: {
        ACTIVATE: number;
        SUSPENDED: number;
        REVOKED: number;
    };
    constructor(ethAccount: any, issuerName: string, serviceEndpoint: string, web3?: any, contractAddress?: string);
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
    setStatusVC(hashToken: string, credentialStatus: CredentialStatus | null | undefined, newStatus: number): Promise<{
        receipt: any;
    }>;
    getStatusVC(hashToken: string, credentialStatus: CredentialStatus | null | undefined, issuer: string): Promise<{
        success: boolean;
        status: any;
    } | {
        success: boolean;
        status?: undefined;
    }>;
    createVP(vcJwtArray: string[], nonce: number): Promise<string>;
    verifyVP(vpJwt: string, nonce: number | undefined): Promise<import("did-jwt-vc").VerifiedPresentation | null>;
}
export {};
