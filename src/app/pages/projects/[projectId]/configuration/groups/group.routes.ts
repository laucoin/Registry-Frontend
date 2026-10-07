import { Routes } from '@angular/router'
import { GroupRoutesEnum } from '@pages/projects/[projectId]/configuration/groups/group-routes.enum'
import { GroupComponent } from '@pages/projects/[projectId]/configuration/groups/group.component'
import { GroupsListComponent } from '@pages/projects/[projectId]/configuration/groups/groups-list/groups-list.component'
import { GroupFormComponent } from '@pages/projects/[projectId]/configuration/groups/group-form/group-form.component'
import { GroupMemberListComponent } from '@pages/projects/[projectId]/configuration/groups/group-member-list/group-member-list.component'

export const groupRoutes: Routes = [
    {
        path: '',
        component: GroupComponent,
        children: [
            {
                path: '', component: GroupsListComponent,
            },
            {
                path: GroupRoutesEnum.MEMBERS, component: GroupMemberListComponent,
            },
            {
                path: GroupRoutesEnum.CREATE, component: GroupFormComponent,
            },
            {
                path: GroupRoutesEnum.EDIT, component: GroupFormComponent,
            },
        ],
    },
]
