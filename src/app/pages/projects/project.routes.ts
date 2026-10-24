import { Routes } from '@angular/router'
import { ProjectPage } from '@pages/projects/project.page'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { ProjectStore } from '@pages/projects/data/state/project/project.store'
import { ProjectsListPage } from '@pages/projects/projects-list/projects-list.page'
import { ProjectRoutesEnum } from '@pages/projects/project-routes.enum'
import { ProjectFormPage } from '@pages/projects/project-form/project-form.page'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store'
import { projectContextDeactivateGuard, projectContextGuard } from '@core/authentication/guard/project-context.guard'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { MovementStore } from '@pages/projects/[projectId]/movements/data/state/movement.store'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import { CommunicationStore } from '@pages/projects/[projectId]/movements/communication/data/state/communication.store'
import { ProjectHomePage } from '@pages/projects/[projectId]/project-home.page'
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade'
import { SelectedProjectStore } from '@pages/projects/data/state/selected-project/selected-project.store'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { ParticipantStore } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.store'
import { GroupStatusFacade } from '@pages/projects/[projectId]/participants/data/state/group-status.facade'
import { GroupStatusStore } from '@pages/projects/[projectId]/participants/data/state/group-status.store'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { VehicleStore } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.store'
import { ParticipantsMonitoringPage } from '@pages/projects/[projectId]/participants/participants-monitoring.page'
import { VehiclesMonitoringPage } from '@pages/projects/[projectId]/vehicles/vehicles-monitoring.page'
import { alertOptionGuard, vehicleOptionGuard } from '@core/authentication/guard/project-option.guard'
import { AlertStore } from '@pages/projects/[projectId]/alerts/data/state/alert.store'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { AlertsListPage } from '@pages/projects/[projectId]/alerts/alerts-list/alerts-list.page'

/**
 * Purpose: Déclare les routes situées sous un projet.
 * Scope: Mappe les pages, formulaires et espaces de configuration du projet vers leurs composants chargés paresseusement.
 * Limits: Ne détient aucune logique de navigation ; les guards et les pages la possèdent.
 */
export const projectRoutes: Routes = [
    {
        path: '',
        component: ProjectPage,
        providers: [ ProjectFacade, ProjectStore ],
        children: [
            {
                path: '', title: 'seo.projects.list', component: ProjectsListPage,
            },
            {
                path: ProjectRoutesEnum.CREATE, title: 'seo.projects.create', component: ProjectFormPage,
                providers: [ ProjectProfileFacade, ProjectProfileStore ],
            },
            {
                path: `${ProjectRoutesEnum.PROJECT_ID}/${ProjectRoutesEnum.EDIT}`, title: 'seo.projects.edit', component: ProjectFormPage,
                providers: [ ProjectProfileFacade, ProjectProfileStore ],
            },
            {
                path: ProjectRoutesEnum.PROJECT_ID,
                canActivate: [ projectContextGuard ],
                canDeactivate: [ projectContextDeactivateGuard ],
                runGuardsAndResolvers: 'paramsChange',
                children: [
                    {
                        path: '', title: 'seo.projects.home', component: ProjectHomePage,
                        providers: [
                            SelectedProjectFacade, SelectedProjectStore, ParticipantFacade, ParticipantStore, MovementFacade, MovementStore, CommunicationFacade, CommunicationStore, AlertFacade, AlertStore,
                        ],
                    },
                    {
                        path: ProjectRoutesEnum.MOVEMENTS,
                        loadChildren: () => import('@pages/projects/[projectId]/movements/movement.routes').then( (m: typeof import('@pages/projects/[projectId]/movements/movement.routes')) => m.movementRoutes ),
                        providers: [ CommunicationFacade, CommunicationStore, MovementFacade, MovementStore ],
                    },
                    {
                        path: ProjectRoutesEnum.ALERTS,
                        title: 'seo.alerts',
                        component: AlertsListPage,
                        canActivate: [ alertOptionGuard ],
                        providers: [ CommunicationFacade, CommunicationStore, AlertFacade, AlertStore ],
                    },
                    {
                        path: ProjectRoutesEnum.PARTICIPANTS,
                        title: 'seo.participantsMonitoring',
                        component: ParticipantsMonitoringPage,
                        providers: [ SelectedProjectFacade, SelectedProjectStore, ParticipantFacade, ParticipantStore, GroupStatusFacade, GroupStatusStore ],
                    },
                    {
                        path: ProjectRoutesEnum.VEHICLES,
                        title: 'seo.vehiclesMonitoring',
                        component: VehiclesMonitoringPage,
                        canActivate: [ vehicleOptionGuard ],
                        providers: [ SelectedProjectFacade, SelectedProjectStore, VehicleFacade, VehicleStore ],
                    },
                    {
                        path: ProjectRoutesEnum.CONFIGURATION,
                        loadChildren: () => import('@pages/projects/[projectId]/configuration/configuration.routes').then( (m: typeof import('@pages/projects/[projectId]/configuration/configuration.routes')) => m.configurationRoutes ),
                    },
                ],
            },
        ],
    },
]
