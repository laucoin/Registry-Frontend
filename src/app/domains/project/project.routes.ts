import { Routes } from '@angular/router'
import { ProjectComponent } from './project.component'
import { ProjectsListComponent } from './projects-list/projects-list.component'
import { ProjectRoutesEnum } from './project-routes.enum'
import { ProjectFormComponent } from './project-form/project-form.component'
import { selectedProfileGuard } from '../../shared/util-authentication/guard/selected-profile.guard'
import { MovementFacade } from './movement/data/state/movement.facade'
import { importProvidersFrom } from '@angular/core'
import { NgxsModule } from '@ngxs/store'
import { MovementState } from './movement/data/state/movement.state'
import { CommunicationFacade } from './communication/data/state/communication.facade'
import { CommunicationState } from './communication/data/state/communication.state'
import { ProjectHomeComponent } from './project-home/project-home.component'
import { SelectedProjectFacade } from './data/state/selected-project/selected-project.facade'
import { SelectedProjectState } from './data/state/selected-project/selected-project.state'
import { ParticipantFacade } from './configuration/participant/data/state/participant.facade'
import { ParticipantState } from './configuration/participant/data/state/participant.state'
import { alertOptionGuard } from '../../shared/util-authentication/guard/activity-alert-option.guard'
import { AlertState } from './alert/data/state/alert.state'
import { AlertFacade } from './alert/data/state/alert.facade'
import { AlertsListComponent } from './alert/alerts-list/alerts-list.component'

export const projectRoutes: Routes = [
    {
        path: '',
        component: ProjectComponent,
        children: [
            {
                path: '', component: ProjectsListComponent,
            },
            {
                path: ProjectRoutesEnum.SELECTED, component: ProjectHomeComponent,
                providers: [
                    SelectedProjectFacade, ParticipantFacade, MovementFacade, CommunicationFacade, AlertFacade,
                    importProvidersFrom( NgxsModule.forFeature( [ SelectedProjectState, ParticipantState, MovementState, CommunicationState, AlertState ] ) ),
                ],
            },
            {
                path: ProjectRoutesEnum.CREATE, component: ProjectFormComponent,
            },
            {
                path: ProjectRoutesEnum.EDIT, component: ProjectFormComponent,
            },
            {
                path: ProjectRoutesEnum.MOVEMENTS,
                loadChildren: () => import('./movement/movement.routes').then( (m: typeof import('./movement/movement.routes')) => m.movementRoutes ),
                canActivate: [ selectedProfileGuard ],
                providers: [ CommunicationFacade, MovementFacade, importProvidersFrom( NgxsModule.forFeature( [ MovementState, CommunicationState ] ) ) ],
            },
            {
                path: ProjectRoutesEnum.ALERTS,
                component: AlertsListComponent,
                canActivate: [ selectedProfileGuard, alertOptionGuard ],
                providers: [ CommunicationFacade, AlertFacade, importProvidersFrom( NgxsModule.forFeature( [ AlertState, CommunicationState ] ) ) ],
            },
            {
                path: ProjectRoutesEnum.CONFIGURATION,
                loadChildren: () => import('./configuration/configuration.routes').then( (m: typeof import('./configuration/configuration.routes')) => m.configurationRoutes ),
                canActivate: [ selectedProfileGuard ],
            },
        ],
    },
]
