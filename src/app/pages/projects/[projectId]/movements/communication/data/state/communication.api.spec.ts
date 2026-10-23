import { CommunicationApi } from '@pages/projects/[projectId]/movements/communication/data/state/communication.api'
import { ApiCase, PAGE_QUERY, describeApi, expectMapped, expectMappedList, expectMappedPage } from '@shared/helpers/testing/api-test.helper'
import { ALERT_DTO, COMMUNICATION_DTO, MOVEMENT_DTO, pageDto } from '@shared/helpers/testing/response-fixtures'

const BASE: string = '/api/v1/projects/p1/communications'
const PARAMS: never = { resetSearch: false, textSearched: 'x' } as never

const CASES: ApiCase<CommunicationApi>[] = [
    { name: 'pages the elements with the search parameters', method: 'GET', url: new RegExp( `${BASE}\\?${PAGE_QUERY}&textSearched=x$` ), call: (api: CommunicationApi) => api.findCommunications( 'p1', 0, 10, PARAMS ), response: pageDto( [ COMMUNICATION_DTO ] ), verify: expectMappedPage },
    { name: 'finds an element by id', method: 'GET', url: `${BASE}/c1`, call: (api: CommunicationApi) => api.findCommunicationById( 'p1', 'c1' ), response: COMMUNICATION_DTO, verify: expectMapped },
    { name: 'creates an element', method: 'POST', url: BASE, body: { name: 'x' }, call: (api: CommunicationApi) => api.createCommunication( 'p1', { name: 'x' } as never ), response: COMMUNICATION_DTO, verify: expectMapped },
    { name: 'updates an element', method: 'PATCH', url: `${BASE}/c1`, body: { name: 'y' }, call: (api: CommunicationApi) => api.updateCommunicationById( 'p1', 'c1', { name: 'y' } as never ), response: COMMUNICATION_DTO, verify: expectMapped },
    { name: 'disables an element', method: 'PATCH', url: `${BASE}/c1/disable`, call: (api: CommunicationApi) => api.disableCommunicationById( 'p1', 'c1' ), response: COMMUNICATION_DTO, verify: expectMapped },
    { name: 'enables an element', method: 'PATCH', url: `${BASE}/c1/enable`, call: (api: CommunicationApi) => api.enableCommunicationById( 'p1', 'c1' ), response: COMMUNICATION_DTO, verify: expectMapped },
    { name: 'deletes an element', method: 'DELETE', url: `${BASE}/c1`, call: (api: CommunicationApi) => api.deleteCommunicationById( 'p1', 'c1' ) },
    { name: 'searches movements with a text', method: 'GET', url: `${BASE}/search/movements?textSearched=arr`, call: (api: CommunicationApi) => api.searchMovements( 'p1', 'arr' ), response: [ MOVEMENT_DTO ], verify: expectMappedList },
    { name: 'searches movements without a text', method: 'GET', url: `${BASE}/search/movements`, call: (api: CommunicationApi) => api.searchMovements( 'p1', undefined ), response: [ MOVEMENT_DTO ], verify: expectMappedList },
    { name: 'searches alerts with a text', method: 'GET', url: `${BASE}/search/alerts?textSearched=fi`, call: (api: CommunicationApi) => api.searchAlerts( 'p1', 'fi' ), response: [ ALERT_DTO ], verify: expectMappedList },
    { name: 'searches alerts without a text', method: 'GET', url: `${BASE}/search/alerts`, call: (api: CommunicationApi) => api.searchAlerts( 'p1', undefined ), response: [ ALERT_DTO ], verify: expectMappedList },
]

describeApi( 'CommunicationApi', CommunicationApi, CASES )
