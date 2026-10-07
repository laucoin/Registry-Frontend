import { Routes } from '@angular/router'
import { ActivityComponent } from '@pages/projects/[projectId]/configuration/activities/activity.component'
import { ActivitiesListComponent } from '@pages/projects/[projectId]/configuration/activities/activities-list/activities-list.component'
import { ActivityRoutesEnum } from '@pages/projects/[projectId]/configuration/activities/activity-routes.enum'
import { ActivityFormComponent } from '@pages/projects/[projectId]/configuration/activities/activity-form/activity-form.component'
import { ActivityMovementsListComponent } from '@pages/projects/[projectId]/configuration/activities/activity-movements-list/activity-movements-list.component'

export const activityRoutes: Routes = [
    {
        path: '',
        component: ActivityComponent,
        children: [
            {
                path: '', component: ActivitiesListComponent,
            },
            {
                path: ActivityRoutesEnum.CREATE, component: ActivityFormComponent,
            },
            {
                path: ActivityRoutesEnum.EDIT, component: ActivityFormComponent,
            },
            {
                path: ActivityRoutesEnum.MOVEMENTS, component: ActivityMovementsListComponent,
            },
        ],
    },
]
