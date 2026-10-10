import { ProjectApi } from '@pages/projects/data/state/project.api'
import { ApiCase, describeApi, expectMapped, expectMappedList, expectMappedPage, PAGE_QUERY } from '@shared/helpers/testing/api-test.helper'
import { PROJECT_DTO, pageDto } from '@shared/helpers/testing/response-fixtures'

const BASE: string = '/api/v1/projects'
const OPTION: object = { value: 'VEHICLE', label: 'Vehicles', ask: 'Use vehicles?', preRequired: [] }

const CASES: ApiCase<ProjectApi>[] = [
    { name: 'pages the projects with the search parameters', method: 'GET', url: new RegExp( `${BASE}\\?${PAGE_QUERY}&withProfile=true$` ),
        call: (api: ProjectApi) => api.findProjects( 0, 10, { resetSearch: false, withProfile: true } as never ), response: pageDto( [ PROJECT_DTO ] ), verify: expectMappedPage },
    { name: 'finds a project by id', method: 'GET', url: `${BASE}/p1`,
        call: (api: ProjectApi) => api.findProjectById( 'p1' ), response: PROJECT_DTO, verify: expectMapped },
    { name: 'lists the available project options', method: 'GET', url: `${BASE}/options`,
        call: (api: ProjectApi) => api.getAvailableProjectOptions(), response: [ OPTION ], verify: expectMappedList },
    { name: 'creates a project', method: 'POST', url: BASE, body: { name: 'Camp' },
        call: (api: ProjectApi) => api.createProject( { name: 'Camp' } as never ), response: PROJECT_DTO, verify: expectMapped },
    { name: 'updates a project', method: 'PATCH', url: `${BASE}/p1`, body: { name: 'Camp 2' },
        call: (api: ProjectApi) => api.updateProjectById( 'p1', { name: 'Camp 2' } as never ), response: PROJECT_DTO, verify: expectMapped },
    { name: 'disables a project', method: 'PATCH', url: `${BASE}/p1/disable`, call: (api: ProjectApi) => api.disableProjectById( 'p1' ), response: PROJECT_DTO, verify: expectMapped },
    { name: 'enables a project', method: 'PATCH', url: `${BASE}/p1/enable`, call: (api: ProjectApi) => api.enableProjectById( 'p1' ), response: PROJECT_DTO, verify: expectMapped },
    { name: 'deletes a project', method: 'DELETE', url: `${BASE}/p1`, call: (api: ProjectApi) => api.deleteProjectById( 'p1' ) },
]

describeApi( 'ProjectApi', ProjectApi, CASES )
