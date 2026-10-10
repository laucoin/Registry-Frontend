import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api'
import { ApiCase, PAGE_QUERY, describeApi, expectMapped, expectMappedList, expectMappedPage } from '@shared/helpers/testing/api-test.helper'
import { GROUP_DTO, MOVEMENT_DTO, PARTICIPANT_DTO, USER_DTO, pageDto } from '@shared/helpers/testing/response-fixtures'

const BASE: string = '/api/v1/projects/p1/participants'
const PARAMS: never = { resetSearch: false, textSearched: 'x' } as never

const CASES: ApiCase<ParticipantApi>[] = [
    { name: 'pages the elements with the search parameters', method: 'GET', url: new RegExp( `${BASE}\\?${PAGE_QUERY}&textSearched=x$` ), call: (api: ParticipantApi) => api.findParticipants( 'p1', 0, 10, PARAMS ), response: pageDto( [ PARTICIPANT_DTO ] ), verify: expectMappedPage },
    { name: 'finds an element by id', method: 'GET', url: `${BASE}/pa1`, call: (api: ParticipantApi) => api.findParticipantById( 'p1', 'pa1' ), response: PARTICIPANT_DTO, verify: expectMapped },
    { name: 'creates an element', method: 'POST', url: BASE, body: { name: 'x' }, call: (api: ParticipantApi) => api.createParticipant( 'p1', { name: 'x' } as never ), response: PARTICIPANT_DTO, verify: expectMapped },
    { name: 'updates an element', method: 'PATCH', url: `${BASE}/pa1`, body: { name: 'y' }, call: (api: ParticipantApi) => api.updateParticipantById( 'p1', 'pa1', { name: 'y' } as never ), response: PARTICIPANT_DTO, verify: expectMapped },
    { name: 'disables an element', method: 'PATCH', url: `${BASE}/pa1/disable`, call: (api: ParticipantApi) => api.disableParticipantById( 'p1', 'pa1' ), response: PARTICIPANT_DTO, verify: expectMapped },
    { name: 'enables an element', method: 'PATCH', url: `${BASE}/pa1/enable`, call: (api: ParticipantApi) => api.enableParticipantById( 'p1', 'pa1' ), response: PARTICIPANT_DTO, verify: expectMapped },
    { name: 'deletes an element', method: 'DELETE', url: `${BASE}/pa1`, call: (api: ParticipantApi) => api.deleteParticipantById( 'p1', 'pa1' ) },
    { name: 'searches users with a text', method: 'GET', url: `${BASE}/search/users?textSearched=ada`, call: (api: ParticipantApi) => api.searchUsers( 'p1', 'ada' ), response: [ USER_DTO ], verify: expectMappedList },
    { name: 'searches users without a text', method: 'GET', url: `${BASE}/search/users`, call: (api: ParticipantApi) => api.searchUsers( 'p1', undefined ), response: [ USER_DTO ], verify: expectMappedList },
    { name: 'searches groups with a text', method: 'GET', url: `${BASE}/search/groups?textSearched=wo`, call: (api: ParticipantApi) => api.searchGroups( 'p1', 'wo' ), response: [ GROUP_DTO ], verify: expectMappedList },
    { name: 'searches groups without a text', method: 'GET', url: `${BASE}/search/groups`, call: (api: ParticipantApi) => api.searchGroups( 'p1', undefined ), response: [ GROUP_DTO ], verify: expectMappedList },
    { name: 'pages the movements of a participant', method: 'GET', url: new RegExp( `${BASE}/pa1/movements\\?${PAGE_QUERY}` ), call: (api: ParticipantApi) => api.findParticipantMovements( 'p1', 'pa1', 0, 10, PARAMS ), response: pageDto( [ MOVEMENT_DTO ] ), verify: expectMappedPage },
    { name: 'finds the birthdays of the participants', method: 'GET', url: `${BASE}/birthday`, call: (api: ParticipantApi) => api.findParticipantsBirthdays( 'p1' ), response: [ PARTICIPANT_DTO ], verify: expectMappedList },
]

describeApi( 'ParticipantApi', ParticipantApi, CASES )
