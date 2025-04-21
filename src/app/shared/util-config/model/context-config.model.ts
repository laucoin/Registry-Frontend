import { MenuItemModel } from '../../../shell/data/model/menu-item.model'
import { ActionModel } from '../../util-model/model/action.model'
import { EventActionEnum } from '../../../domains/event/data/state/event.action'
import { EventProfileActionEnum } from '../../util-model/enumeration/event-profile-action.enum'
import { UserActionEnum } from '../../../domains/user/data/state/user.action'
import { ParticipantActionEnum } from '../../../domains/participant/data/state/participant.action'
import { MovementActionEnum } from '../../../domains/movement/data/state/movement.action'
import { GroupActionEnum } from '../../../domains/group/data/state/group.action'
import { RegistryActionEnum } from '../../util-common/state/registry.action'
import { VehicleActionEnum } from '../../../domains/vehicle/data/state/vehicle.action'
import { ActivityActionEnum } from '../../../domains/activity/data/state/activity.action'

export interface ContextConfigModel {
    theme: unknown
    logo: {
        light: string
        dark: string
    }
    defaultLanguage: string
    maintainerEmail: string
    generalMenu: MenuItemModel[]
    profileMenu: MenuItemModel[]
    event: {
        optionIcons: Map<string, string>
        action: ActionModel<EventActionEnum | RegistryActionEnum>[]
    }
    profile: {
        event: {
            action: ActionModel<EventProfileActionEnum>[]
        }
    }
    user: {
        myAction: ActionModel<RegistryActionEnum>[]
        action: ActionModel<UserActionEnum>[]
    }
    vehicle: {
        action: ActionModel<VehicleActionEnum>[]
    }
    activity: {
        action: ActionModel<ActivityActionEnum>[]
    }
    participant: {
        action: ActionModel<ParticipantActionEnum | GroupActionEnum>[]
    }
    group: {
        action: ActionModel<GroupActionEnum>[]
    }
    movement: {
        action: ActionModel<MovementActionEnum>[]
    },
    notification: {
        duration: {
            info: number
            success: number
            warn: number
            secondary: number
            contrast: number
        }
    }
}
