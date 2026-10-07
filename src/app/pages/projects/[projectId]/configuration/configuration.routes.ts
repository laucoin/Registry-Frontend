import { Routes } from '@angular/router'
import { ConfigurationPage } from '@pages/projects/[projectId]/configuration/configuration.page'
import { importProvidersFrom } from '@angular/core'
import { NgxsModule } from '@ngxs/store'
import { ConfigurationRoutesEnum } from '@pages/projects/[projectId]/configuration/configuration-routes.enum'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { MovementStore } from '@pages/projects/[projectId]/movements/data/state/movement.store'
import { ParticipantStore } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.store'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { GroupStore } from '@pages/projects/[projectId]/configuration/groups/data/state/group.store'
import { vehicleOptionGuard } from '@core/authentication/guard/vehicle-option.guard'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { VehicleStore } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.store'
import { activityOptionGuard } from '@core/authentication/guard/activity-option.guard'
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import { ActivityStore } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.store'

export const configurationRoutes: Routes = [
    {
        path: '',
        component: ConfigurationPage,
        children: [
            {
                path: '', component: ConfigurationPage,
            },
            {
                path: ConfigurationRoutesEnum.PROFILES,
                loadChildren: () => import('@pages/projects/[projectId]/configuration/profiles/project-profile.routes').then( (m: typeof import('@pages/projects/[projectId]/configuration/profiles/project-profile.routes')) => m.projectProfileRoutes ),
                providers: [ ProjectProfileFacade, importProvidersFrom( NgxsModule.forFeature( [ ProjectProfileStore ] ) ) ],
            },
            {
                path: ConfigurationRoutesEnum.PARTICIPANTS,
                loadChildren: () => import('@pages/projects/[projectId]/configuration/participants/participant.routes').then( (m: typeof import('@pages/projects/[projectId]/configuration/participants/participant.routes')) => m.participantRoutes ),
                providers: [ MovementFacade, ParticipantFacade, importProvidersFrom( NgxsModule.forFeature( [ MovementStore, ParticipantStore ] ) ) ],
            },
            {
                path: ConfigurationRoutesEnum.GROUPS,
                loadChildren: () => import('@pages/projects/[projectId]/configuration/groups/group.routes').then( (m: typeof import('@pages/projects/[projectId]/configuration/groups/group.routes')) => m.groupRoutes ),
                providers: [ GroupFacade, ParticipantFacade, importProvidersFrom( NgxsModule.forFeature( [ GroupStore, ParticipantStore ] ) ) ],
            },
            {
                path: ConfigurationRoutesEnum.VEHICLES,
                loadChildren: () => import('@pages/projects/[projectId]/configuration/vehicles/vehicle.routes').then( (m: typeof import('@pages/projects/[projectId]/configuration/vehicles/vehicle.routes')) => m.vehicleRoutes ),
                canActivate: [ vehicleOptionGuard ],
                providers: [ MovementFacade, VehicleFacade, VehicleStore, importProvidersFrom( NgxsModule.forFeature( [ MovementStore ] ) ) ],
            },
            {
                path: ConfigurationRoutesEnum.ACTIVITIES,
                loadChildren: () => import('@pages/projects/[projectId]/configuration/activities/activity.routes').then( (m: typeof import('@pages/projects/[projectId]/configuration/activities/activity.routes')) => m.activityRoutes ),
                canActivate: [ activityOptionGuard ],
                providers: [ MovementFacade, ActivityFacade, ActivityStore, importProvidersFrom( NgxsModule.forFeature( [ MovementStore ] ) ) ],
            },
        ],
    },
]
