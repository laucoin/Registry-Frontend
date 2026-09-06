export interface CredentialsModel {
    redirectUri: string,
    /** Echoed back from the callback so the backend can match it against its challenge cookie. */
    state: string,
    authorizationCode: string,
}
