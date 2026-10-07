import { Routes } from '@angular/router'
import { ConfigurationComponent } from '@pages/projects/[projectId]/configuration/configuration.component'
import { importProvidersFrom } from '@angular/core'
import { NgxsModule } from '@ngxs/store'
import { ConfigurationRoutesEnum } from '@pages/projects/[projectId]/configuration/configuration-routes.enum'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileState } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.state'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { MovementState } from '@pages/projects/[projectId]/movements/data/state/movement.state'
import { ParticipantState } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.state'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { GroupState } from '@pages/projects/[projectId]/configuration/groups/data/state/group.state'
import { vehicleOptionGuard } from '@core/authentication/guard/vehicle-option.guard'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { VehicleState } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.state'
import { activityOptionGuard } from '@core/authentication/guard/activity-option.guard'
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import { ActivityState } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.state'

export const configurationRoutes: Routes = [
    {
        path: '',
        component: ConfigurationComponent,
        children: [
            {
                path: '', component: ConfigurationComponent,
            },
            {
                path: ConfigurationRoutesEnum.PROFILES,
                loadChildren: () => import('@pages/projects/[projectId]/configuration/profiles/project-profile.routes').then( (m: typeof import('@pages/projects/[projectId]/configuration/profiles/project-profile.routes')) => m.projectProfileRoutes ),
                providers: [ ProjectProfileFacade, importProvidersFrom( NgxsModule.forFeature( [ ProjectProfileState ] ) ) ],
            },
            {
                path: ConfigurationRoutesEnum.PARTICIPANTS,
                loadChildren: () => import('@pages/projects/[projectId]/configuration/participants/participant.routes').then( (m: typeof import('@pages/projects/[projectId]/configuration/participants/participant.routes')) => m.participantRoutes ),
                providers: [ MovementFacade, ParticipantFacade, importProvidersFrom( NgxsModule.forFeature( [ MovementState, ParticipantState ] ) ) ],
            },
            {
                path: ConfigurationRoutesEnum.GROUPS,
                loadChildren: () => import('@pages/projects/[projectId]/configuration/groups/group.routes').then( (m: typeof import('@pages/projects/[projectId]/configuration/groups/group.routes')) => m.groupRoutes ),
                providers: [ GroupFacade, ParticipantFacade, importProvidersFrom( NgxsModule.forFeature( [ GroupState, ParticipantState ] ) ) ],
            },
            {
                path: ConfigurationRoutesEnum.VEHICLES,
                loadChildren: () => import('@pages/projects/[projectId]/configuration/vehicles/vehicle.routes').then( (m: typeof import('@pages/projects/[projectId]/configuration/vehicles/vehicle.routes')) => m.vehicleRoutes ),
                canActivate: [ vehicleOptionGuard ],
                providers: [ MovementFacade, VehicleFacade, importProvidersFrom( NgxsModule.forFeature( [ MovementState, VehicleState ] ) ) ],
            },
            {
                path: ConfigurationRoutesEnum.ACTIVITIES,
                loadChildren: () => import('@pages/projects/[projectId]/configuration/activities/activity.routes').then( (m: typeof import('@pages/projects/[projectId]/configuration/activities/activity.routes')) => m.activityRoutes ),
                canActivate: [ activityOptionGuard ],
                providers: [ MovementFacade, ActivityFacade, importProvidersFrom( NgxsModule.forFeature( [ MovementState, ActivityState ] ) ) ],
            },
        ],
    },
]
