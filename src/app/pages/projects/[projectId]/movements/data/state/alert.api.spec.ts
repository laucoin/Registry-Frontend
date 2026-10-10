import { AlertApi } from '@pages/projects/[projectId]/movements/data/state/alert.api'
import { ApiCase, PAGE_QUERY, describeApi, expectMapped, expectMappedPage } from '@shared/helpers/testing/api-test.helper'
import { ALERT_DTO, COMMUNICATION_DTO, pageDto } from '@shared/helpers/testing/response-fixtures'

const BASE: string = '/api/v1/projects/p1/alerts'
const PARAMS: never = { resetSearch: false, textSearched: 'x' } as never

const CASES: ApiCase<AlertApi>[] = [
    { name: 'pages the elements with the search parameters', method: 'GET', url: new RegExp( `${BASE}\\?${PAGE_QUERY}&textSearched=x$` ), call: (api: AlertApi) => api.findAlerts( 'p1', 0, 10, PARAMS ), response: pageDto( [ ALERT_DTO ] ), verify: expectMappedPage },
    { name: 'finds an element by id', method: 'GET', url: `${BASE}/al1`, call: (api: AlertApi) => api.findAlertById( 'p1', 'al1' ), response: ALERT_DTO, verify: expectMapped },
    { name: 'creates an element', method: 'POST', url: BASE, body: { name: 'x' }, call: (api: AlertApi) => api.createAlert( 'p1', { name: 'x' } as never ), response: ALERT_DTO, verify: expectMapped },
    { name: 'updates an element', method: 'PATCH', url: `${BASE}/al1`, body: { name: 'y' }, call: (api: AlertApi) => api.updateAlertById( 'p1', 'al1', { name: 'y' } as never ), response: ALERT_DTO, verify: expectMapped },
    { name: 'disables an element', method: 'PATCH', url: `${BASE}/al1/disable`, call: (api: AlertApi) => api.disableAlertById( 'p1', 'al1' ), response: ALERT_DTO, verify: expectMapped },
    { name: 'enables an element', method: 'PATCH', url: `${BASE}/al1/enable`, call: (api: AlertApi) => api.enableAlertById( 'p1', 'al1' ), response: ALERT_DTO, verify: expectMapped },
    { name: 'deletes an element', method: 'DELETE', url: `${BASE}/al1`, call: (api: AlertApi) => api.deleteAlertById( 'p1', 'al1' ) },
    { name: 'pages the communications of an alert', method: 'GET', url: new RegExp( `${BASE}/al1/communications\\?${PAGE_QUERY}` ), call: (api: AlertApi) => api.findAlertCommunications( 'p1', 'al1', 0, 10, PARAMS ), response: pageDto( [ COMMUNICATION_DTO ] ), verify: expectMappedPage },
    { name: 'changes the status of an alert', method: 'PATCH', url: `${BASE}/al1/status/RESOLVED`, call: (api: AlertApi) => api.updateAlertStatusById( 'p1', 'al1', 'RESOLVED' as never ), response: ALERT_DTO, verify: expectMapped },
]

describeApi( 'AlertApi', AlertApi, CASES )
