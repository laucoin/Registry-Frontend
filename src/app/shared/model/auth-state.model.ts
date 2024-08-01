import { User } from 'oidc-client-ts'
import { HttpErrorResponse } from '@angular/common/http'
import { EnrichedUserModel } from './user/enriched-user.model'

export interface AuthStateModel {
    loading: boolean
    me: EnrichedUserModel | null
    token: User | null
    backendError: HttpErrorResponse | null
    oidcError: HttpErrorResponse | null
}
