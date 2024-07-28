import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router'
import { Store } from '@ngxs/store'
import { inject } from '@angular/core'
import { User } from 'oidc-client-ts'
import { AuthState } from '../auth.state'
import { LocalStorageUtils } from '../../util-tool/local-storage.util'
import { StorageEnum } from '../../model/storage.enum'
import { GetMe, SignIn } from '../auth.action'

export const authGuard: CanActivateFn = (
    _: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
): Promise<boolean> | boolean => {
    const store: Store = inject( Store )
    const token: User | null = store.selectSnapshot( AuthState.token )

    if (token !== null && !token.expired) {
        if (!store.selectSnapshot( AuthState.me )) {
            store.dispatch( GetMe )
        }
        return true
    }

    LocalStorageUtils.set( StorageEnum.REDIRECT_URI, state.url )

    store.dispatch( SignIn )
    return false
}
