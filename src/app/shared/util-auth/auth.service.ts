import { Injectable } from '@angular/core'
import { User, UserManager } from 'oidc-client-ts'

@Injectable( {
    providedIn: 'root',
} )
export class AuthService {
    public constructor (private readonly userManager: UserManager) {}

    public getToken = (): Promise<User | null> => this.userManager.getUser()

    public signIn = (): Promise<void> => {
        return this.userManager.signinRedirect()
    }

    public completeAuthentication = (): Promise<User> => {
        return this.userManager.signinRedirectCallback()
    }

    public completeSilentAuthentication = (): Promise<void> => {
        return this.userManager.signinSilentCallback()
    }

    public signOut = (): Promise<void> => {
        return this.userManager.signoutRedirect()
    }
}
