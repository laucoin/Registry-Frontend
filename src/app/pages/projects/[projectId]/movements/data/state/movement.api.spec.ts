import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { ApiCase, describeApi, expectMapped, expectMappedList, expectMappedPage, PAGE_QUERY } from '@shared/helpers/testing/api-test.helper'
import { COMMUNICATION_DTO, GROUP_DTO, MOVEMENT_DTO, PARTICIPANT_DTO, VEHICLE_DTO, WHEN, pageDto } from '@shared/helpers/testing/response-fixtures'

const BASE: string = '/api/v1/projects/p1/movements'
const PARAMS: never = { resetSearch: false, currentMovements: false } as never

const CASES: ApiCase<MovementApi>[] = [
    { name: 'pages the movements', method: 'GET', url: new RegExp( `${BASE}\\?${PAGE_QUERY}` ),
        call: (api: MovementApi) => api.findMovements( 'p1', 0, 10, PARAMS ), response: pageDto( [ MOVEMENT_DTO ] ), verify: expectMappedPage },
    { name: 'finds the contents of several movements and maps each pair', method: 'GET', url: `${BASE}/contents?currentMovements=true&movementIds=m1&movementIds=m2`,
        call: (api: MovementApi) => api.findMovementsContents( 'p1', [ 'm1', 'm2' ], true ), response: [ { first: 'm1', second: MOVEMENT_DTO.content } ],
        verify: (result: unknown, response: unknown): void => {
            const pairs: { first: string, second: unknown[] }[] = result as { first: string, second: unknown[] }[]
            expect( pairs ).toEqual( response )
            expect( pairs[ 0 ].second[ 0 ] ).not.toBe( (response as { second: unknown[] }[])[ 0 ].second[ 0 ] )
        } },
    { name: 'pages the communications of a movement', method: 'GET', url: new RegExp( `${BASE}/m1/communications\\?${PAGE_QUERY}` ),
        call: (api: MovementApi) => api.findMovementCommunications( 'p1', 'm1', 0, 10, PARAMS ), response: pageDto( [ COMMUNICATION_DTO ] ), verify: expectMappedPage },
    { name: 'finds the status of the participants', method: 'GET', url: `${BASE}/participants/status`,
        call: (api: MovementApi) => api.findParticipantsStatus( 'p1' ), response: { registered: { presentMinors: 1, presentMajors: 2, absentMinors: 3, absentMajors: 4 }, guests: 5, lastRefresh: WHEN }, verify: expectMapped },
    { name: 'finds the status of the vehicles', method: 'GET', url: `${BASE}/vehicles/status`,
        call: (api: MovementApi) => api.findVehiclesStatus( 'p1' ), response: { present: 1, absent: 2, lastRefresh: WHEN }, verify: expectMapped },
    { name: 'finds a movement by id', method: 'GET', url: `${BASE}/m1`,
        call: (api: MovementApi) => api.findMovementById( 'p1', 'm1' ), response: MOVEMENT_DTO, verify: expectMapped },
    { name: 'searches reasons and activities with a text', method: 'GET', url: `${BASE}/search/reasons?typeSearched=IN&contentTypeSearched=REGISTERED&textSearched=arr`,
        call: (api: MovementApi) => api.searchReasonsAndActivities( 'p1', 'arr', 'IN', 'REGISTERED' as never ), response: [ { label: 'Arrival', value: 'r1', kind: 'REASON' } ], verify: expectMappedList },
    { name: 'searches reasons and activities without a text', method: 'GET', url: `${BASE}/search/reasons?typeSearched=IN&contentTypeSearched=GUEST`,
        call: (api: MovementApi) => api.searchReasonsAndActivities( 'p1', undefined, 'IN', 'GUEST' as never ), response: [ { label: 'Arrival', value: 'r1', kind: 'REASON' } ], verify: expectMappedList },
    { name: 'searches participants and groups and maps both lists', method: 'GET', url: new RegExp( `${BASE}/search/participants-and-groups\\?` ),
        call: (api: MovementApi) => api.searchParticipantsAndGroups( 'p1', 'REGISTERED' as never, 'ad' ), response: { participants: [ PARTICIPANT_DTO ], groups: [ GROUP_DTO ] },
        verify: (result: unknown, response: unknown): void => {
            const found: { participants: unknown[], groups: unknown[] } = result as { participants: unknown[], groups: unknown[] }
            expect( found ).toEqual( response )
            expect( found.groups[ 0 ] ).not.toBe( (response as { groups: unknown[] }).groups[ 0 ] )
        } },
    { name: 'searches vehicles with a text', method: 'GET', url: `${BASE}/search/vehicles?textSearched=ab`,
        call: (api: MovementApi) => api.searchVehicles( 'p1', 'ab' ), response: [ VEHICLE_DTO ], verify: expectMappedList },
    { name: 'searches vehicles without a text', method: 'GET', url: `${BASE}/search/vehicles`,
        call: (api: MovementApi) => api.searchVehicles( 'p1', undefined ), response: [ VEHICLE_DTO ], verify: expectMappedList },
    { name: 'creates a movement of registered participants', method: 'POST', url: BASE, body: { reason: 'r1' },
        call: (api: MovementApi) => api.createMovement( 'p1', { reason: 'r1' } as never ), response: MOVEMENT_DTO, verify: expectMapped },
    { name: 'updates a movement of registered participants', method: 'PATCH', url: `${BASE}/m1`, body: { reason: 'r2' },
        call: (api: MovementApi) => api.updateMovementById( 'p1', 'm1', { reason: 'r2' } as never ), response: MOVEMENT_DTO, verify: expectMapped },
    { name: 'creates a movement of guests', method: 'POST', url: `${BASE}/guests`, body: { reason: 'r1' },
        call: (api: MovementApi) => api.createGuestsMovement( 'p1', { reason: 'r1' } as never ), response: MOVEMENT_DTO, verify: expectMapped },
    { name: 'updates a movement of guests', method: 'PATCH', url: `${BASE}/guests/m1`, body: { reason: 'r2' },
        call: (api: MovementApi) => api.updateGuestsMovementById( 'p1', 'm1', { reason: 'r2' } as never ), response: MOVEMENT_DTO, verify: expectMapped },
    { name: 'disables a movement', method: 'PATCH', url: `${BASE}/m1/disable`, call: (api: MovementApi) => api.disableMovementById( 'p1', 'm1' ), response: MOVEMENT_DTO, verify: expectMapped },
    { name: 'enables a movement', method: 'PATCH', url: `${BASE}/m1/enable`, call: (api: MovementApi) => api.enableMovementById( 'p1', 'm1' ), response: MOVEMENT_DTO, verify: expectMapped },
    { name: 'deletes a movement', method: 'DELETE', url: `${BASE}/m1`, call: (api: MovementApi) => api.deleteMovementById( 'p1', 'm1' ) },
]

describeApi( 'MovementApi', MovementApi, CASES )
