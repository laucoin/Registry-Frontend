import { Action, Selector, State, StateContext } from '@ngxs/store'
import { StateEnum } from '../model/state.enum'
import { AuthStateModel } from '../model/auth-state.model'
import { Injectable, NgZone } from '@angular/core'
import { AuthService } from './auth.service'
import { GetMe, GetTokenFromAuthorizationCode, RefreshToken, SignIn, SignOut } from './auth.action'
import { HttpErrorResponse } from '@angular/common/http'
import { User } from 'oidc-client-ts'
import { StorageEnum } from '../model/storage.enum'
import { AppRoutesEnum } from '../model/app-routes.enum'
import { LocalStorageUtils } from '../util-tool/local-storage.util'
import { SessionStorageUtils } from '../util-tool/session-storage.util'
import { UserService } from './user.service'
import { EnrichedUserModel } from '../model/user/enriched-user.model'
import { initialize } from '../util-tool/rx.ext'
import { GenericState } from '../util-tool/generic.state'
import { finalize } from 'rxjs'

@State<AuthStateModel>( {
    name: StateEnum.AUTH,
    defaults: {
        loading: false,
        me: null,
        token: null,
        backendError: null,
        oidcError: null,
    },
} )
@Injectable()
export class AuthState extends GenericState<AuthStateModel> {
    public constructor (
        private readonly service: AuthService,
        private readonly userService: UserService,
        private readonly ngZone: NgZone,
    ) {
        super()
    }

    @Selector()
    public static loading (state: AuthStateModel): boolean {
        return state.loading
    }

    @Selector()
    public static me (state: AuthStateModel): EnrichedUserModel | null {
        return state.me
    }

    @Selector()
    public static token (state: AuthStateModel): User | null {
        return state.token
    }

    @Selector()
    public static oidcError (state: AuthStateModel): HttpErrorResponse | null {
        return state.oidcError
    }

    @Action( GetMe )
    public getMe (ctx: StateContext<AuthStateModel>): void {
        this.userService.getMe()
            .pipe(
                initialize( () => ctx.patchState( { loading: true } ) ),
                finalize( () => ctx.patchState( { loading: false } ) ),
            )
            .subscribe( {
                next: (me: EnrichedUserModel): void => ctx.patchState( {
                    me: me,
                    backendError: null,
                } ),
                error: (error: HttpErrorResponse): void => {
                    this.notifyError( error.message )
                    ctx.patchState( {
                        me: null,
                        backendError: error,
                    } )
                },
            } )
    }

    @Action( SignIn )
    public signIn (): void {
        this.service.signIn().catch( console.error )
    }

    @Action( GetTokenFromAuthorizationCode )
    public signInFromAuthorizationCode (ctx: StateContext<AuthStateModel>): void {
        this.service.completeAuthentication()
            .then( (token: User | null): void => this.updateToken( ctx, token ) )
            .catch( (error: HttpErrorResponse): void => this.onOidcError( ctx, error ) )
    }

    @Action( RefreshToken )
    public refreshToken (ctx: StateContext<AuthStateModel>): void {
        this.service.completeSilentAuthentication()
            .then( () => this.service.getToken() )
            .then( (token: User | null): void => this.updateToken( ctx, token ) )
            .catch( (error: HttpErrorResponse): void => this.onOidcError( ctx, error ) )
    }

    @Action( SignOut )
    public signOut (): void {
        LocalStorageUtils.clear()
        SessionStorageUtils.clear()

        this.service.signOut().catch( console.error )
    }

    private updateToken (ctx: StateContext<AuthStateModel>, token: User | null): void {
        if (token === null) {
            console.error( 'Erreur lors de la récupération du jeton de sécurité' )
            ctx.dispatch( SignOut )
            return
        }

        ctx.patchState( {
            token: token,
            oidcError: null,
        } )

        this.redirect()
    }

    private redirect (): void {
        this.ngZone.run( (): void => {
            this.router
                .navigateByUrl(
                    (LocalStorageUtils.get( StorageEnum.REDIRECT_URI ) as string) ??
                    AppRoutesEnum.HOME,
                )
                .then( () => LocalStorageUtils.delete( StorageEnum.REDIRECT_URI ) )
                .catch( console.error )
        } )
    }

    private onOidcError (ctx: StateContext<AuthStateModel>, error: HttpErrorResponse): void {
        this.notifyError( error.message )
        ctx.patchState( {
            token: null,
            oidcError: error,
        } )
    }
}
