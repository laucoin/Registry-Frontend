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
import { ProjectDetailComponent } from './project-detail/project-detail.component'
import { CommunicationFacade } from './communication/data/state/communication.facade'
import { CommunicationState } from './communication/data/state/communication.state'
import { communicationOptionGuard } from '../../shared/util-authentication/guard/activity-communication-option.guard'

export const projectRoutes: Routes = [
    {
        path: '',
        component: ProjectComponent,
        children: [
            {
                path: '', component: ProjectsListComponent,
            },
            {
                path: ProjectRoutesEnum.SELECTED, component: ProjectDetailComponent,
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
                path: ProjectRoutesEnum.COMMUNICATIONS,
                loadChildren: () => import('./communication/communication.routes').then( (m: typeof import('./communication/communication.routes')) => m.communicationRoutes ),
                canActivate: [ selectedProfileGuard, communicationOptionGuard ],
                providers: [ CommunicationFacade, importProvidersFrom( NgxsModule.forFeature( [ CommunicationState ] ) ) ],
            },
            {
                path: ProjectRoutesEnum.CONFIGURATION,
                loadChildren: () => import('./configuration/configuration.routes').then( (m: typeof import('./configuration/configuration.routes')) => m.configurationRoutes ),
                canActivate: [ selectedProfileGuard ],
            },
        ],
    },
]
