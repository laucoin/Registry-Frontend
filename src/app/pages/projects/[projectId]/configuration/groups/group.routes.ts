import { Routes } from '@angular/router'
import { GroupRoutesEnum } from '@pages/projects/[projectId]/configuration/groups/group-routes.enum'
import { GroupPage } from '@pages/projects/[projectId]/configuration/groups/group.page'
import { GroupsListPage } from '@pages/projects/[projectId]/configuration/groups/groups-list/groups-list.page'
import { GroupFormPage } from '@pages/projects/[projectId]/configuration/groups/group-form/group-form.page'
import { GroupMemberListPage } from '@pages/projects/[projectId]/configuration/groups/group-member-list/group-member-list.page'

export const groupRoutes: Routes = [
    {
        path: '',
        component: GroupPage,
        children: [
            {
                path: '', component: GroupsListPage,
            },
            {
                path: GroupRoutesEnum.MEMBERS, component: GroupMemberListPage,
            },
            {
                path: GroupRoutesEnum.CREATE, component: GroupFormPage,
            },
            {
                path: GroupRoutesEnum.EDIT, component: GroupFormPage,
            },
        ],
    },
]
