import { Routes } from '@angular/router'
import { ActivityPage } from '@pages/projects/[projectId]/configuration/activities/activity.page'
import { ActivitiesListPage } from '@pages/projects/[projectId]/configuration/activities/activities-list/activities-list.page'
import { ActivityRoutesEnum } from '@pages/projects/[projectId]/configuration/activities/activity-routes.enum'
import { ActivityFormPage } from '@pages/projects/[projectId]/configuration/activities/activity-form/activity-form.page'
import { ActivityMovementsListPage } from '@pages/projects/[projectId]/configuration/activities/activity-movements-list/activity-movements-list.page'

export const activityRoutes: Routes = [
    {
        path: '',
        component: ActivityPage,
        children: [
            {
                path: '', component: ActivitiesListPage,
            },
            {
                path: ActivityRoutesEnum.CREATE, component: ActivityFormPage,
            },
            {
                path: ActivityRoutesEnum.EDIT, component: ActivityFormPage,
            },
            {
                path: ActivityRoutesEnum.MOVEMENTS, component: ActivityMovementsListPage,
            },
        ],
    },
]
