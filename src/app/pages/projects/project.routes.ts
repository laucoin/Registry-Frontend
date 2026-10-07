import { Routes } from '@angular/router'
import { ProjectComponent } from '@pages/projects/project.component'
import { ProjectsListComponent } from '@pages/projects/projects-list/projects-list.component'
import { ProjectRoutesEnum } from '@pages/projects/project-routes.enum'
import { ProjectFormComponent } from '@pages/projects/project-form/project-form.component'
import { projectContextDeactivateGuard, projectContextGuard } from '@core/authentication/guard/project-context.guard'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { importProvidersFrom } from '@angular/core'
import { NgxsModule } from '@ngxs/store'
import { MovementStore } from '@pages/projects/[projectId]/movements/data/state/movement.store'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import { CommunicationStore } from '@pages/projects/[projectId]/movements/communication/data/state/communication.store'
import { ProjectHomeComponent } from '@pages/projects/[projectId]/project-home.component'
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade'
import { SelectedProjectStore } from '@pages/projects/data/state/selected-project/selected-project.store'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { ParticipantStore } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.store'
import { alertOptionGuard } from '@core/authentication/guard/activity-alert-option.guard'
import { AlertStore } from '@pages/projects/[projectId]/alerts/data/state/alert.store'
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
                            importProvidersFrom( NgxsModule.forFeature( [ SelectedProjectStore, ParticipantStore, MovementStore, CommunicationStore, AlertStore ] ) ),
                        ],
                    },
                    {
                        path: ProjectRoutesEnum.MOVEMENTS,
                        loadChildren: () => import('@pages/projects/[projectId]/movements/movement.routes').then( (m: typeof import('@pages/projects/[projectId]/movements/movement.routes')) => m.movementRoutes ),
                        providers: [ CommunicationFacade, MovementFacade, importProvidersFrom( NgxsModule.forFeature( [ MovementStore, CommunicationStore ] ) ) ],
                    },
                    {
                        path: ProjectRoutesEnum.ALERTS,
                        component: AlertsListComponent,
                        canActivate: [ alertOptionGuard ],
                        providers: [ CommunicationFacade, AlertFacade, importProvidersFrom( NgxsModule.forFeature( [ AlertStore, CommunicationStore ] ) ) ],
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
