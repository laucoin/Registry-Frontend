enum AuthActionEnum {
    GETTING_ME = '[Backend] Getting me',
    SIGNING_IN = '[OIDC] Signing in',
    GETTING_TOKEN_FROM_AUTHORIZATION_CODE = '[OIDC] Getting token from authorization code',
    REFRESHING_TOKEN = '[OIDC] Refreshing token',
    SIGNING_OUT = '[OIDC] Signing out',
}

export class GetMe {
    public static readonly type: AuthActionEnum = AuthActionEnum.GETTING_ME
}

export class SignIn {
    public static readonly type: AuthActionEnum = AuthActionEnum.SIGNING_IN
}

export class GetTokenFromAuthorizationCode {
    public static readonly type: AuthActionEnum = AuthActionEnum.GETTING_TOKEN_FROM_AUTHORIZATION_CODE
}

export class RefreshToken {
    public static readonly type: AuthActionEnum = AuthActionEnum.REFRESHING_TOKEN
}

export class SignOut {
    public static readonly type: AuthActionEnum = AuthActionEnum.SIGNING_OUT
}
