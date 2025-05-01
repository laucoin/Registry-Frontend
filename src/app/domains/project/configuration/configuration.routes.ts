import { Routes } from '@angular/router'
import { ConfigurationComponent } from './configuration.component'
import { importProvidersFrom } from '@angular/core'
import { NgxsModule } from '@ngxs/store'
import { ConfigurationRoutesEnum } from './configuration-routes.enum'
import { ProjectProfileFacade } from './project-profile/data/state/project-profile.facade'
import { ProjectProfileState } from './project-profile/data/state/project-profile.state'
import { MovementFacade } from '../movement/data/state/movement.facade'
import { ParticipantFacade } from './participant/data/state/participant.facade'
import { MovementState } from '../movement/data/state/movement.state'
import { ParticipantState } from './participant/data/state/participant.state'
import { GroupFacade } from './group/data/state/group.facade'
import { GroupState } from './group/data/state/group.state'
import { vehicleOptionGuard } from '../../../shared/util-authentication/guard/vehicle-option.guard'
import { VehicleFacade } from './vehicle/data/state/vehicle.facade'
import { VehicleState } from './vehicle/data/state/vehicle.state'
import { activityOptionGuard } from '../../../shared/util-authentication/guard/activity-option.guard'
import { ActivityFacade } from './activity/data/state/activity.facade'
import { ActivityState } from './activity/data/state/activity.state'

export const configurationRoutes: Routes = [
    {
        path: '', component: ConfigurationComponent, children: [
            {
                path: '', component: ConfigurationComponent,
            },
            {
                path: ConfigurationRoutesEnum.PROFILES,
                loadChildren: () => import('./project-profile/project-profile.routes').then( (m: typeof import('./project-profile/project-profile.routes')) => m.projectProfileRoutes ),
                providers: [ ProjectProfileFacade, importProvidersFrom( NgxsModule.forFeature( [ ProjectProfileState ] ) ) ],
            },
            {
                path: ConfigurationRoutesEnum.PARTICIPANTS,
                loadChildren: () => import('./participant/participant.routes').then( (m: typeof import('./participant/participant.routes')) => m.participantRoutes ),
                providers: [ MovementFacade, ParticipantFacade, importProvidersFrom( NgxsModule.forFeature( [ MovementState, ParticipantState ] ) ) ],
            },
            {
                path: ConfigurationRoutesEnum.GROUPS,
                loadChildren: () => import('./group/group.routes').then( (m: typeof import('./group/group.routes')) => m.groupRoutes ),
                providers: [ GroupFacade, ParticipantFacade, importProvidersFrom( NgxsModule.forFeature( [ GroupState, ParticipantState ] ) ) ],
            },
            {
                path: ConfigurationRoutesEnum.VEHICLES,
                loadChildren: () => import('./vehicle/vehicle.routes').then( (m: typeof import('./vehicle/vehicle.routes')) => m.vehicleRoutes ),
                canActivate: [ vehicleOptionGuard ],
                providers: [ MovementFacade, VehicleFacade, importProvidersFrom( NgxsModule.forFeature( [ MovementState, VehicleState ] ) ) ],
            },
            {
                path: ConfigurationRoutesEnum.ACTIVITIES,
                loadChildren: () => import('./activity/activity.routes').then( (m: typeof import('./activity/activity.routes')) => m.activityRoutes ),
                canActivate: [ activityOptionGuard ],
                providers: [ MovementFacade, ActivityFacade, importProvidersFrom( NgxsModule.forFeature( [ MovementState, ActivityState ] ) ) ],
            },
        ],
    },
]
