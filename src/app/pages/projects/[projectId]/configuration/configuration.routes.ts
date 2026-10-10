import { Routes } from '@angular/router'
import { ConfigurationPage } from '@pages/projects/[projectId]/configuration/configuration.page'
import { ConfigurationRoutesEnum } from '@pages/projects/[projectId]/configuration/configuration-routes.enum'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { MovementStore } from '@pages/projects/[projectId]/movements/data/state/movement.store'
import { ParticipantStore } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.store'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { GroupStore } from '@pages/projects/[projectId]/configuration/groups/data/state/group.store'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { VehicleStore } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.store'
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import { ActivityStore } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.store'
import { vehicleOptionGuard, activityOptionGuard } from '@core/authentication/guard/project-option.guard'

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
                providers: [ ProjectProfileFacade, ProjectProfileStore ],
            },
            {
                path: ConfigurationRoutesEnum.PARTICIPANTS,
                loadChildren: () => import('@pages/projects/[projectId]/configuration/participants/participant.routes').then( (m: typeof import('@pages/projects/[projectId]/configuration/participants/participant.routes')) => m.participantRoutes ),
                providers: [ MovementFacade, ParticipantFacade, ParticipantStore, MovementStore ],
            },
            {
                path: ConfigurationRoutesEnum.GROUPS,
                loadChildren: () => import('@pages/projects/[projectId]/configuration/groups/group.routes').then( (m: typeof import('@pages/projects/[projectId]/configuration/groups/group.routes')) => m.groupRoutes ),
                providers: [ GroupFacade, GroupStore, ParticipantFacade, ParticipantStore ],
            },
            {
                path: ConfigurationRoutesEnum.VEHICLES,
                loadChildren: () => import('@pages/projects/[projectId]/configuration/vehicles/vehicle.routes').then( (m: typeof import('@pages/projects/[projectId]/configuration/vehicles/vehicle.routes')) => m.vehicleRoutes ),
                canActivate: [ vehicleOptionGuard ],
                providers: [ MovementFacade, VehicleFacade, VehicleStore, MovementStore ],
            },
            {
                path: ConfigurationRoutesEnum.ACTIVITIES,
                loadChildren: () => import('@pages/projects/[projectId]/configuration/activities/activity.routes').then( (m: typeof import('@pages/projects/[projectId]/configuration/activities/activity.routes')) => m.activityRoutes ),
                canActivate: [ activityOptionGuard ],
                providers: [ MovementFacade, ActivityFacade, ActivityStore, MovementStore ],
            },
        ],
    },
]
