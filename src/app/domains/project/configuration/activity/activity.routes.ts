import { Routes } from '@angular/router'
import { ActivitiesListComponent } from './activities-list/activities-list.component'
import { ActivityFormComponent } from './activity-form/activity-form.component'
import { ActivityMovementsListComponent } from './activity-movements-list/activity-movements-list.component'
import { ActivityRoutesEnum } from './activity-routes.enum'
import { ActivityComponent } from './activity.component'

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
