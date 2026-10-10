import { UserApi } from '@pages/users/data/state/user.api'
import { ApiCase, describeApi, expectMapped, expectMappedPage, PAGE_QUERY } from '@shared/helpers/testing/api-test.helper'
import { USER_DTO, pageDto } from '@shared/helpers/testing/response-fixtures'

const BASE: string = '/api/v1/users'

const CASES: ApiCase<UserApi>[] = [
    { name: 'pages the users with the search parameters', method: 'GET', url: new RegExp( `${BASE}\\?${PAGE_QUERY}&textSearched=ada$` ),
        call: (api: UserApi) => api.findUsers( 0, 10, { resetSearch: false, textSearched: 'ada' } as never ), response: pageDto( [ USER_DTO ] ), verify: expectMappedPage },
    { name: 'finds a user by id', method: 'GET', url: `${BASE}/u1`, call: (api: UserApi) => api.findUserById( 'u1' ), response: USER_DTO, verify: expectMapped },
    { name: 'lists the assignable roles', method: 'GET', url: `${BASE}/roles`, call: (api: UserApi) => api.getAssignableUserRoles(), response: [ { label: 'Admin', value: 'ADMIN' } ],
        verify: (result: unknown): void => expect( result ).toEqual( [ { label: 'Admin', value: 'ADMIN' } ] ) },
    { name: 'changes the role of a user', method: 'PATCH', url: `${BASE}/u1/role?role=ADMIN`, call: (api: UserApi) => api.updateUserRole( 'u1', 'ADMIN' ), response: USER_DTO, verify: expectMapped },
    { name: 'removes the role of a user', method: 'PATCH', url: `${BASE}/u1/role?`, call: (api: UserApi) => api.updateUserRole( 'u1', undefined ), response: USER_DTO, verify: expectMapped },
    { name: 'blocks a user', method: 'PATCH', url: `${BASE}/u1/block`, call: (api: UserApi) => api.blockUserById( 'u1' ), response: USER_DTO, verify: expectMapped },
    { name: 'unblocks a user', method: 'PATCH', url: `${BASE}/u1/unblock`, call: (api: UserApi) => api.unblockUserById( 'u1' ), response: USER_DTO, verify: expectMapped },
    { name: 'impersonates a user', method: 'PATCH', url: `${BASE}/u1/impersonate`, call: (api: UserApi) => api.impersonateUserById( 'u1' ), response: USER_DTO, verify: expectMapped },
    { name: 'impersonates the current user', method: 'PATCH', url: `${BASE}/impersonate`, call: (api: UserApi) => api.impersonateCurrentUser(), response: USER_DTO, verify: expectMapped },
    { name: 'deletes a user', method: 'DELETE', url: `${BASE}/u1`, call: (api: UserApi) => api.deleteUserById( 'u1' ) },
]

describeApi( 'UserApi', UserApi, CASES )
