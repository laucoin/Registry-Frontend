import { SecurityApi } from '@core/authentication/service/security.api'
import { ApiCase, describeApi, expectMapped } from '@shared/helpers/testing/api-test.helper'
import { USER_DTO } from '@shared/helpers/testing/response-fixtures'

const BASE: string = '/api/v1/authentication'
const CURRENT_USER: object = { ...USER_DTO, authorities: [ 'REGISTRY_USER_R' ], preferences: { userId: 'u1', theme: 'DARK', language: 'fr' } }

const CASES: ApiCase<SecurityApi>[] = [
    { name: 'asks for the login uri with the redirect uri', method: 'GET', url: `${BASE}/login/uri?redirectUri=http://app.test/auth/callback`,
        call: (api: SecurityApi) => api.getLoginUri( 'http://app.test/auth/callback' ), response: { uri: 'https://idp.test/login' }, verify: expectMapped },
    { name: 'asks for the logout uri with the redirect uri', method: 'GET', url: `${BASE}/logout/uri?redirectUri=http://app.test`,
        call: (api: SecurityApi) => api.getLogoutUri( 'http://app.test' ), response: { uri: 'https://idp.test/logout' }, verify: expectMapped },
    { name: 'exchanges the authorization code for a session', method: 'POST', url: `${BASE}/token`, body: { authorizationCode: 'code', redirectUri: 'http://app.test' },
        call: (api: SecurityApi) => api.fetchToken( { authorizationCode: 'code', redirectUri: 'http://app.test' } ) },
    { name: 'refreshes the token', method: 'POST', url: `${BASE}/token/refresh`, body: {}, call: (api: SecurityApi) => api.refreshToken() },
    { name: 'fetches the current user with its authorities and preferences', method: 'GET', url: `${BASE}/user/current`,
        call: (api: SecurityApi) => api.fetchCurrentUser(), response: CURRENT_USER, verify: expectMapped },
]

describeApi( 'SecurityApi', SecurityApi, CASES )
