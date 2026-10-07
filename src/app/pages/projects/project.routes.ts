import { Routes } from '@angular/router'
import { ProjectComponent } from '@pages/projects/project.component'
import { ProjectsListComponent } from '@pages/projects/projects-list/projects-list.component'
import { ProjectRoutesEnum } from '@pages/projects/project-routes.enum'
import { ProjectFormComponent } from '@pages/projects/project-form/project-form.component'
import { projectContextDeactivateGuard, projectContextGuard } from '@core/authentication/guard/project-context.guard'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { importProvidersFrom } from '@angular/core'
import { NgxsModule } from '@ngxs/store'
import { MovementState } from '@pages/projects/[projectId]/movements/data/state/movement.state'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import { CommunicationState } from '@pages/projects/[projectId]/movements/communication/data/state/communication.state'
import { ProjectHomeComponent } from '@pages/projects/[projectId]/project-home.component'
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade'
import { SelectedProjectState } from '@pages/projects/data/state/selected-project/selected-project.state'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { ParticipantState } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.state'
import { alertOptionGuard } from '@core/authentication/guard/activity-alert-option.guard'
import { AlertState } from '@pages/projects/[projectId]/alerts/data/state/alert.state'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { AlertsListComponent } from '@pages/projects/[projectId]/alerts/alerts-list/alerts-list.component'

export const projectRoutes: Routes = [
    {
        path: '',
        component: ProjectComponent,
        children: [
            {
                path: '', component: ProjectsListComponent,
            },
            {
                path: ProjectRoutesEnum.CREATE, component: ProjectFormComponent,
            },
            {
                path: `${ProjectRoutesEnum.PROJECT_ID}/${ProjectRoutesEnum.EDIT}`, component: ProjectFormComponent,
            },
            {
                path: ProjectRoutesEnum.PROJECT_ID,
                canActivate: [ projectContextGuard ],
                canDeactivate: [ projectContextDeactivateGuard ],
                runGuardsAndResolvers: 'paramsChange',
                children: [
                    {
                        path: '', component: ProjectHomeComponent,
                        providers: [
                            SelectedProjectFacade, ParticipantFacade, MovementFacade, CommunicationFacade, AlertFacade,
                            importProvidersFrom( NgxsModule.forFeature( [ SelectedProjectState, ParticipantState, MovementState, CommunicationState, AlertState ] ) ),
                        ],
                    },
                    {
                        path: ProjectRoutesEnum.MOVEMENTS,
                        loadChildren: () => import('@pages/projects/[projectId]/movements/movement.routes').then( (m: typeof import('@pages/projects/[projectId]/movements/movement.routes')) => m.movementRoutes ),
                        providers: [ CommunicationFacade, MovementFacade, importProvidersFrom( NgxsModule.forFeature( [ MovementState, CommunicationState ] ) ) ],
                    },
                    {
                        path: ProjectRoutesEnum.ALERTS,
                        component: AlertsListComponent,
                        canActivate: [ alertOptionGuard ],
                        providers: [ CommunicationFacade, AlertFacade, importProvidersFrom( NgxsModule.forFeature( [ AlertState, CommunicationState ] ) ) ],
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
