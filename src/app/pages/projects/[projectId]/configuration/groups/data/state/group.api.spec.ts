import { GroupApi } from '@pages/projects/[projectId]/configuration/groups/data/state/group.api'
import { ApiCase, describeApi, expectMapped, expectMappedList, expectMappedPage, PAGE_QUERY } from '@shared/helpers/testing/api-test.helper'
import { GROUP_DTO, PARTICIPANT_DTO, pageDto } from '@shared/helpers/testing/response-fixtures'

const BASE: string = '/api/v1/projects/p1/groups'
const PARAMS: never = { resetSearch: false, textSearched: 'wolves' } as never

const CASES: ApiCase<GroupApi>[] = [
    { name: 'pages the groups with the search parameters', method: 'GET', url: new RegExp( `${BASE}\\?${PAGE_QUERY}&textSearched=wolves$` ),
        call: (api: GroupApi) => api.findGroups( 'p1', 0, 10, PARAMS ), response: pageDto( [ GROUP_DTO ] ), verify: expectMappedPage },
    { name: 'pages the members of a group', method: 'GET', url: new RegExp( `${BASE}/g1/members\\?${PAGE_QUERY}` ),
        call: (api: GroupApi) => api.findGroupMembersByGroupId( 'p1', 'g1', 0, 10, PARAMS ), response: pageDto( [ PARTICIPANT_DTO ] ), verify: expectMappedPage },
    { name: 'finds a group by id', method: 'GET', url: `${BASE}/g1`,
        call: (api: GroupApi) => api.findGroupById( 'p1', 'g1' ), response: GROUP_DTO, verify: expectMapped },
    { name: 'searches participants with a text', method: 'GET', url: `${BASE}/search/participants?textSearched=ada`,
        call: (api: GroupApi) => api.searchParticipants( 'p1', 'ada' ), response: [ PARTICIPANT_DTO ], verify: expectMappedList },
    { name: 'searches participants without a text', method: 'GET', url: `${BASE}/search/participants`,
        call: (api: GroupApi) => api.searchParticipants( 'p1', undefined ), response: [ PARTICIPANT_DTO ], verify: expectMappedList },
    { name: 'creates a group', method: 'POST', url: BASE, body: { name: 'Wolves' },
        call: (api: GroupApi) => api.createGroup( 'p1', { name: 'Wolves' } as never ), response: GROUP_DTO, verify: expectMapped },
    { name: 'updates a group', method: 'PATCH', url: `${BASE}/g1`, body: { name: 'Pack' },
        call: (api: GroupApi) => api.updateGroupById( 'p1', 'g1', { name: 'Pack' } as never ), response: GROUP_DTO, verify: expectMapped },
    { name: 'adds members to a group', method: 'PATCH', url: `${BASE}/g1/members`, body: [ 'pa1' ],
        call: (api: GroupApi) => api.addMembersToGroupById( 'p1', 'g1', [ 'pa1' ] ), response: { members: [ 'pa1' ], notAddedMemberIds: [] },
        verify: (result: unknown) => expect( result ).toEqual( { members: [ 'pa1' ], notAddedMemberIds: [] } ) },
    { name: 'removes a member from a group', method: 'DELETE', url: `${BASE}/g1/members/pa1`,
        call: (api: GroupApi) => api.removeMemberFromGroupById( 'p1', 'g1', 'pa1' ), response: GROUP_DTO, verify: expectMapped },
    { name: 'disables a group', method: 'PATCH', url: `${BASE}/g1/disable`, call: (api: GroupApi) => api.disableGroupById( 'p1', 'g1' ), response: GROUP_DTO, verify: expectMapped },
    { name: 'enables a group', method: 'PATCH', url: `${BASE}/g1/enable`, call: (api: GroupApi) => api.enableGroupById( 'p1', 'g1' ), response: GROUP_DTO, verify: expectMapped },
    { name: 'deletes a group', method: 'DELETE', url: `${BASE}/g1`, call: (api: GroupApi) => api.deleteGroupById( 'p1', 'g1' ) },
]

describeApi( 'GroupApi', GroupApi, CASES )

