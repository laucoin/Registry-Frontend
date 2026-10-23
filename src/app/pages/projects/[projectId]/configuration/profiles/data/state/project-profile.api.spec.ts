import { ProjectProfileApi } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.api'
import { ApiCase, describeApi, expectMapped, expectMappedList, expectMappedPage, PAGE_QUERY } from '@shared/helpers/testing/api-test.helper'
import { PROFILE_DTO, USER_DTO, pageDto } from '@shared/helpers/testing/response-fixtures'

const BASE: string = '/api/v1/projects/p1/profiles'
const PARAMS: never = { resetSearch: false, textSearched: 'x' } as never

const CASES: ApiCase<ProjectProfileApi>[] = [
    { name: 'pages the profiles of a project', method: 'GET', url: new RegExp( `${BASE}\\?${PAGE_QUERY}&textSearched=x$` ),
        call: (api: ProjectProfileApi) => api.findProjectProfiles( 'p1', 0, 10, PARAMS ), response: pageDto( [ PROFILE_DTO ] ), verify: expectMappedPage },
    { name: 'finds a profile by id', method: 'GET', url: `${BASE}/pp1`,
        call: (api: ProjectProfileApi) => api.findProjectProfileById( 'p1', 'pp1' ), response: PROFILE_DTO, verify: expectMapped },
    { name: 'searches users with a text', method: 'GET', url: `${BASE}/search/users?textSearched=ada`,
        call: (api: ProjectProfileApi) => api.searchUsers( 'p1', 'ada' ), response: [ USER_DTO ], verify: expectMappedList },
    { name: 'searches users without a text', method: 'GET', url: `${BASE}/search/users`,
        call: (api: ProjectProfileApi) => api.searchUsers( 'p1', undefined ), response: [ USER_DTO ], verify: expectMappedList },
    { name: 'lists the assignable roles', method: 'GET', url: `${BASE}/roles`,
        call: (api: ProjectProfileApi) => api.getAssignableProjectProfileRoles( 'p1' ), response: [ { label: 'Chief', value: 'CHIEF' } ],
        verify: (result: unknown): void => expect( result ).toEqual( [ { label: 'Chief', value: 'CHIEF' } ] ) },
    { name: 'invites users to a project', method: 'POST', url: BASE, body: { userIds: [ 'u1' ] },
        call: (api: ProjectProfileApi) => api.createProjectProfiles( 'p1', { userIds: [ 'u1' ] } as never ), response: { createdUserIds: [ 'u1' ], notCreatedUserIds: [] },
        verify: (result: unknown): void => expect( result ).toEqual( { createdUserIds: [ 'u1' ], notCreatedUserIds: [] } ) },
    { name: 'updates a profile', method: 'PATCH', url: `${BASE}/pp1`, body: { role: 'CHIEF' },
        call: (api: ProjectProfileApi) => api.updateProjectProfileById( 'p1', 'pp1', { role: 'CHIEF' } as never ), response: PROFILE_DTO, verify: expectMapped },
    { name: 'blocks a profile', method: 'PATCH', url: `${BASE}/pp1/block`, call: (api: ProjectProfileApi) => api.blockProjectProfileById( 'p1', 'pp1' ), response: PROFILE_DTO, verify: expectMapped },
    { name: 'unblocks a profile', method: 'PATCH', url: `${BASE}/pp1/unblock`, call: (api: ProjectProfileApi) => api.unblockProjectProfileById( 'p1', 'pp1' ), response: PROFILE_DTO, verify: expectMapped },
    { name: 'deletes a profile', method: 'DELETE', url: `${BASE}/pp1`, call: (api: ProjectProfileApi) => api.deleteProjectProfileById( 'p1', 'pp1' ) },
]

describeApi( 'ProjectProfileApi', ProjectProfileApi, CASES )
