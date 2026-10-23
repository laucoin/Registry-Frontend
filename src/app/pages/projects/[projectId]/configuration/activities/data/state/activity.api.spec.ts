import { ActivityApi } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.api'
import { ApiCase, PAGE_QUERY, describeApi, expectMapped, expectMappedPage } from '@shared/helpers/testing/api-test.helper'
import { ACTIVITY_DTO, MOVEMENT_DTO, pageDto } from '@shared/helpers/testing/response-fixtures'

const BASE: string = '/api/v1/projects/p1/activities'
const PARAMS: never = { resetSearch: false, textSearched: 'x' } as never

const CASES: ApiCase<ActivityApi>[] = [
    { name: 'pages the elements with the search parameters', method: 'GET', url: new RegExp( `${BASE}\\?${PAGE_QUERY}&textSearched=x$` ), call: (api: ActivityApi) => api.findActivities( 'p1', 0, 10, PARAMS ), response: pageDto( [ ACTIVITY_DTO ] ), verify: expectMappedPage },
    { name: 'finds an element by id', method: 'GET', url: `${BASE}/a1`, call: (api: ActivityApi) => api.findActivityById( 'p1', 'a1' ), response: ACTIVITY_DTO, verify: expectMapped },
    { name: 'creates an element', method: 'POST', url: BASE, body: { name: 'x' }, call: (api: ActivityApi) => api.createActivity( 'p1', { name: 'x' } as never ), response: ACTIVITY_DTO, verify: expectMapped },
    { name: 'updates an element', method: 'PATCH', url: `${BASE}/a1`, body: { name: 'y' }, call: (api: ActivityApi) => api.updateActivityById( 'p1', 'a1', { name: 'y' } as never ), response: ACTIVITY_DTO, verify: expectMapped },
    { name: 'disables an element', method: 'PATCH', url: `${BASE}/a1/disable`, call: (api: ActivityApi) => api.disableActivityById( 'p1', 'a1' ), response: ACTIVITY_DTO, verify: expectMapped },
    { name: 'enables an element', method: 'PATCH', url: `${BASE}/a1/enable`, call: (api: ActivityApi) => api.enableActivityById( 'p1', 'a1' ), response: ACTIVITY_DTO, verify: expectMapped },
    { name: 'deletes an element', method: 'DELETE', url: `${BASE}/a1`, call: (api: ActivityApi) => api.deleteActivityById( 'p1', 'a1' ) },
    { name: 'pages the movements of an activity', method: 'GET', url: new RegExp( `${BASE}/a1/movements\\?${PAGE_QUERY}` ), call: (api: ActivityApi) => api.findActivityMovements( 'p1', 'a1', 0, 10, PARAMS ), response: pageDto( [ MOVEMENT_DTO ] ), verify: expectMappedPage },
]

describeApi( 'ActivityApi', ActivityApi, CASES )
