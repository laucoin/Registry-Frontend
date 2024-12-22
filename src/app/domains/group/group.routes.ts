import { Routes } from '@angular/router'
import { GroupRoutesEnum } from './group-routes.enum'
import { GroupComponent } from './group.component'
import { GroupListComponent } from './group-list/group-list.component'
import { GroupFormComponent } from './group-form/group-form.component'
import { GroupMemberListComponent } from './group-member-list/group-member-list.component'

export const groupRoutes: Routes = [
    {
        path: '', component: GroupComponent, children: [
            {
                path: '', component: GroupListComponent,
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
