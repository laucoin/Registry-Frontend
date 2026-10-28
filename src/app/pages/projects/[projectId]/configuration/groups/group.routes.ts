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
                path: '', title: 'seo.groups.list', component: GroupsListPage,
            },
            {
                path: GroupRoutesEnum.MEMBERS, title: 'seo.groups.members', component: GroupMemberListPage,
            },
            {
                path: GroupRoutesEnum.CREATE, title: 'seo.groups.create', component: GroupFormPage,
            },
            {
                path: GroupRoutesEnum.EDIT, title: 'seo.groups.edit', component: GroupFormPage,
            },
        ],
    },
]
