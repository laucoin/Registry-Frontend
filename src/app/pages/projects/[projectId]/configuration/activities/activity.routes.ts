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
                path: '', title: 'seo.activities.list', component: ActivitiesListPage,
                children: [
                    { path: ActivityRoutesEnum.CREATE, title: 'seo.activities.create', component: ActivityFormPage },
                    { path: ActivityRoutesEnum.EDIT, title: 'seo.activities.edit', component: ActivityFormPage },
                ],
            },
            {
                path: ActivityRoutesEnum.MOVEMENTS, title: 'seo.activities.movements', component: ActivityMovementsListPage,
            },
        ],
    },
]
