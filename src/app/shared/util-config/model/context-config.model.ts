import { MenuItemModel } from '../../../shell/data/model/menu-item.model'
import { ActionModel } from '../../util-model/model/action.model'
import { EventActionEnum } from '../../../domains/event/data/state/event.action'
import { EventProfileActionEnum } from '../../util-model/enumeration/event-profile-action.enum'
import { UserActionEnum } from '../../../domains/user/data/state/user.action'
import { ParticipantActionEnum } from '../../../domains/participant/data/state/participant.action'
import { MovementActionEnum } from '../../../domains/movement/data/state/movement.action'
import { GroupActionEnum } from '../../../domains/group/data/state/group.action'

export interface ContextConfigModel {
    theme: unknown
    logo: {
        light: string
        dark: string
    }
    defaultLanguage: string
    maintainerEmail: string
    menu: MenuItemModel[]
    event: {
        optionIcons: Map<string, string>
        action: ActionModel<EventActionEnum>[]
    }
    profile: {
        event: {
            action: ActionModel<EventProfileActionEnum>[]
        }
    }
    user: {
        action: ActionModel<UserActionEnum>[]
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
