import { Routes } from '@angular/router';

import { projectContextDeactivateGuard, projectContextGuard } from '@core/authentication/guard/project-context.guard';
import { alertOptionGuard, vehicleOptionGuard } from '@core/authentication/guard/project-option.guard';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { AlertStore } from '@pages/projects/[projectId]/alerts/data/state/alert.store';
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { ParticipantStore } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.store';
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade';
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store';
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import { VehicleStore } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.store';
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade';
import { CommunicationStore } from '@pages/projects/[projectId]/movements/communication/data/state/communication.store';
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { MovementStore } from '@pages/projects/[projectId]/movements/data/state/movement.store';
import { GroupStatusFacade } from '@pages/projects/[projectId]/participants/data/state/group-status.facade';
import { GroupStatusStore } from '@pages/projects/[projectId]/participants/data/state/group-status.store';
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { ProjectStore } from '@pages/projects/data/state/project/project.store';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { SelectedProjectStore } from '@pages/projects/data/state/selected-project/selected-project.store';
import { ProjectPage } from '@pages/projects/project.page';
import { ProjectRoutesEnum } from '@pages/projects/project-routes.enum';

/**
 * Objectif: Déclare les routes situées sous un projet.
 * Périmètre: Mappe les pages, formulaires et espaces de configuration du projet vers leurs composants chargés paresseusement.
 * Limites: Ne détient aucune logique de navigation ; les guards et les pages la possèdent.
 */
export const projectRoutes: Routes = [
	{
		path: '',
		component: ProjectPage,
		providers: [ProjectFacade, ProjectStore],
		children: [
			{
				path: '',
				title: 'seo.projects.list',
				loadComponent: () =>
					import('@pages/projects/projects-list/projects-list.page').then((m) => m.ProjectsListPage),
			},
			{
				path: ProjectRoutesEnum.CREATE,
				title: 'seo.projects.create',
				loadComponent: () =>
					import('@pages/projects/project-form/project-form.page').then((m) => m.ProjectFormPage),
				providers: [ProjectProfileFacade, ProjectProfileStore],
			},
			{
				path: `${ProjectRoutesEnum.PROJECT_ID}/${ProjectRoutesEnum.EDIT}`,
				title: 'seo.projects.edit',
				loadComponent: () =>
					import('@pages/projects/project-form/project-form.page').then((m) => m.ProjectFormPage),
				providers: [ProjectProfileFacade, ProjectProfileStore],
			},
			{
				path: ProjectRoutesEnum.PROJECT_ID,
				canActivate: [projectContextGuard],
				canDeactivate: [projectContextDeactivateGuard],
				runGuardsAndResolvers: 'paramsChange',
				children: [
					{
						path: '',
						title: 'seo.projects.home',
						loadComponent: () =>
							import('@pages/projects/[projectId]/project-home.page').then((m) => m.ProjectHomePage),
						providers: [
							SelectedProjectFacade,
							SelectedProjectStore,
							ParticipantFacade,
							ParticipantStore,
							MovementFacade,
							MovementStore,
							CommunicationFacade,
							CommunicationStore,
							AlertFacade,
							AlertStore,
						],
					},
					{
						path: ProjectRoutesEnum.MOVEMENTS,
						loadChildren: () =>
							import('@pages/projects/[projectId]/movements/movement.routes').then(
								(m) => m.movementRoutes,
							),
						providers: [CommunicationFacade, CommunicationStore, MovementFacade, MovementStore],
					},
					{
						path: ProjectRoutesEnum.ALERTS,
						title: 'seo.alerts',
						loadComponent: () =>
							import('@pages/projects/[projectId]/alerts/alerts-list/alerts-list.page').then(
								(m) => m.AlertsListPage,
							),
						canActivate: [alertOptionGuard],
						providers: [CommunicationFacade, CommunicationStore, AlertFacade, AlertStore],
					},
					{
						path: ProjectRoutesEnum.PARTICIPANTS,
						title: 'seo.participantsMonitoring',
						loadComponent: () =>
							import('@pages/projects/[projectId]/participants/participants-monitoring.page').then(
								(m) => m.ParticipantsMonitoringPage,
							),
						providers: [
							SelectedProjectFacade,
							SelectedProjectStore,
							ParticipantFacade,
							ParticipantStore,
							GroupStatusFacade,
							GroupStatusStore,
						],
					},
					{
						path: ProjectRoutesEnum.VEHICLES,
						title: 'seo.vehiclesMonitoring',
						loadComponent: () =>
							import('@pages/projects/[projectId]/vehicles/vehicles-monitoring.page').then(
								(m) => m.VehiclesMonitoringPage,
							),
						canActivate: [vehicleOptionGuard],
						providers: [SelectedProjectFacade, SelectedProjectStore, VehicleFacade, VehicleStore],
					},
					{
						path: ProjectRoutesEnum.CONFIGURATION,
						loadChildren: () =>
							import('@pages/projects/[projectId]/configuration/configuration.routes').then(
								(m) => m.configurationRoutes,
							),
					},
				],
			},
		],
	},
];
