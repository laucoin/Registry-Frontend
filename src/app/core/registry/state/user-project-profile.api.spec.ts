import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api'
import { ApiCase, describeApi, expectMapped, expectMappedPage, PAGE_QUERY } from '@shared/helpers/testing/api-test.helper'
import { INVITATION_DTO, PROJECT_DTO, pageDto } from '@shared/helpers/testing/response-fixtures'

const BASE: string = '/api/v2/users/profiles'

const CASES: ApiCase<UserProjectProfileApi>[] = [
    { name: 'pages the profiles of the user', method: 'GET', url: new RegExp( `${BASE}\\?${PAGE_QUERY}&statusSearched=ACCEPTED$` ),
        call: (api: UserProjectProfileApi) => api.findUserProjectProfiles( 0, 10, { resetSearch: false, statusSearched: 'ACCEPTED' } as never ), response: pageDto( [ INVITATION_DTO ] ), verify: expectMappedPage },
    { name: 'accepts an invitation', method: 'POST', url: `${BASE}/pp1/accept/true`,
        call: (api: UserProjectProfileApi) => api.manageUserProjectProfileAcceptance( 'pp1', true ), response: INVITATION_DTO, verify: expectMapped },
    { name: 'rejects an invitation', method: 'POST', url: `${BASE}/pp1/accept/false`,
        call: (api: UserProjectProfileApi) => api.manageUserProjectProfileAcceptance( 'pp1', false ), response: INVITATION_DTO, verify: expectMapped },
    { name: 'creates a support profile', method: 'POST', url: `${BASE}/p1/support`,
        call: (api: UserProjectProfileApi) => api.createSupportProjectProfile( 'p1' ), response: PROJECT_DTO, verify: expectMapped },
    { name: 'deletes a profile of the user', method: 'DELETE', url: `${BASE}/pp1`, call: (api: UserProjectProfileApi) => api.deleteUserProfileById( 'pp1' ) },
]

describeApi( 'UserProjectProfileApi', UserProjectProfileApi, CASES )
