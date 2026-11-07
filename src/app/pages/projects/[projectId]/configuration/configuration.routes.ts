import { Routes } from '@angular/router';

import { activityOptionGuard, vehicleOptionGuard } from '@core/authentication/guard/project-option.guard';
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade';
import { ActivityStore } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.store';
import { ConfigurationPage } from '@pages/projects/[projectId]/configuration/configuration.page';
import { ConfigurationRoutesEnum } from '@pages/projects/[projectId]/configuration/configuration-routes.enum';
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade';
import { GroupStore } from '@pages/projects/[projectId]/configuration/groups/data/state/group.store';
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { ParticipantStore } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.store';
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade';
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store';
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import { VehicleStore } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.store';
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { MovementStore } from '@pages/projects/[projectId]/movements/data/state/movement.store';

export const configurationRoutes: Routes = [
	{
		path: '',
		children: [
			{
				path: '',
				title: 'seo.configuration',
				component: ConfigurationPage,
			},
			{
				path: ConfigurationRoutesEnum.PROFILES,
				loadChildren: () =>
					import('@pages/projects/[projectId]/configuration/profiles/project-profile.routes').then(
						(m) => m.projectProfileRoutes,
					),
				providers: [ProjectProfileFacade, ProjectProfileStore],
			},
			{
				path: ConfigurationRoutesEnum.PARTICIPANTS,
				loadChildren: () =>
					import('@pages/projects/[projectId]/configuration/participants/participant.routes').then(
						(m) => m.participantRoutes,
					),
				providers: [MovementFacade, ParticipantFacade, ParticipantStore, MovementStore],
			},
			{
				path: ConfigurationRoutesEnum.GROUPS,
				loadChildren: () =>
					import('@pages/projects/[projectId]/configuration/groups/group.routes').then((m) => m.groupRoutes),
				providers: [GroupFacade, GroupStore, ParticipantFacade, ParticipantStore],
			},
			{
				path: ConfigurationRoutesEnum.VEHICLES,
				loadChildren: () =>
					import('@pages/projects/[projectId]/configuration/vehicles/vehicle.routes').then(
						(m) => m.vehicleRoutes,
					),
				canActivate: [vehicleOptionGuard],
				providers: [MovementFacade, VehicleFacade, VehicleStore, MovementStore],
			},
			{
				path: ConfigurationRoutesEnum.ACTIVITIES,
				loadChildren: () =>
					import('@pages/projects/[projectId]/configuration/activities/activity.routes').then(
						(m) => m.activityRoutes,
					),
				canActivate: [activityOptionGuard],
				providers: [MovementFacade, ActivityFacade, ActivityStore, MovementStore],
			},
		],
	},
];
