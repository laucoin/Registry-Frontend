import { GroupStatusApi } from '@pages/projects/[projectId]/participants/data/state/group-status.api'
import { ApiCase, describeApi, expectMappedPage, PAGE_QUERY } from '@shared/helpers/testing/api-test.helper'
import { GROUP_DTO, PARTICIPANT_DTO, pageDto } from '@shared/helpers/testing/response-fixtures'

const BASE: string = '/api/v2/projects/p1/groups'

const CASES: ApiCase<GroupStatusApi>[] = [
    { name: 'pages the visible groups having members on site, by name', method: 'GET', url: new RegExp( `${BASE}\\?${PAGE_QUERY}&hasOnSiteMembers=true&isVisible=true&sort=name$` ),
        call: (api: GroupStatusApi) => api.findGroups( 'p1', 0, 10 ), response: pageDto( [ GROUP_DTO ] ), verify: expectMappedPage },
    { name: 'pages only the groups of the signed-in user', method: 'GET', url: new RegExp( `${BASE}\\?${PAGE_QUERY}&hasOnSiteMembers=true&isVisible=true&sort=name&mine=true$` ),
        call: (api: GroupStatusApi) => api.findMyGroups( 'p1', 0, 10 ), response: pageDto( [ GROUP_DTO ] ), verify: expectMappedPage },
    { name: 'pages the on-site members of a group, the late ones first', method: 'GET', url: new RegExp( `${BASE}/g1/members\\?${PAGE_QUERY}&onSite=true&isVisible=true&sort=status$` ),
        call: (api: GroupStatusApi) => api.findOnSiteMembers( 'p1', 'g1', 0, 10 ), response: pageDto( [ PARTICIPANT_DTO ] ), verify: expectMappedPage },
]

describeApi( 'GroupStatusApi', GroupStatusApi, CASES )
