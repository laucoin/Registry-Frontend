import { Routes } from '@angular/router'
import { ProjectPage } from '@pages/projects/project.page'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { ProjectStore } from '@pages/projects/data/state/project/project.store'
import { ProjectsListPage } from '@pages/projects/projects-list/projects-list.page'
import { ProjectRoutesEnum } from '@pages/projects/project-routes.enum'
import { ProjectFormPage } from '@pages/projects/project-form/project-form.page'
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
import { alertOptionGuard } from '@core/authentication/guard/project-option.guard'
import { AlertStore } from '@pages/projects/[projectId]/alerts/data/state/alert.store'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { AlertsListPage } from '@pages/projects/[projectId]/alerts/alerts-list/alerts-list.page'

/**
 * Purpose: Declares the routes below a project.
 * Scope: Maps the project pages, forms and configuration areas to their lazy components.
 * Limits: Holds no navigation logic; the guards and the pages own it.
 */
export const projectRoutes: Routes = [
    {
        path: '',
        component: ProjectPage,
        providers: [ ProjectFacade, ProjectStore ],
        children: [
            {
                path: '', component: ProjectsListPage,
            },
            {
                path: ProjectRoutesEnum.CREATE, component: ProjectFormPage,
            },
            {
                path: `${ProjectRoutesEnum.PROJECT_ID}/${ProjectRoutesEnum.EDIT}`, component: ProjectFormPage,
            },
            {
                path: ProjectRoutesEnum.PROJECT_ID,
                canActivate: [ projectContextGuard ],
                canDeactivate: [ projectContextDeactivateGuard ],
                runGuardsAndResolvers: 'paramsChange',
                children: [
                    {
                        path: '', component: ProjectHomePage,
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
                        component: AlertsListPage,
                        canActivate: [ alertOptionGuard ],
                        providers: [ CommunicationFacade, CommunicationStore, AlertFacade, AlertStore ],
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
