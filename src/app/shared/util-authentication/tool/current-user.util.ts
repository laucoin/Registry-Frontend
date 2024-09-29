import { EventAuthorityEnum } from '../../util-model/enumeration/event-authority.enum'
import { UserAuthorityEnum } from '../../util-model/enumeration/user-authority.enum'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { ArrayUtil } from '../../util-tool/util/array.util'
import { EventUtil } from '../../util-tool/util/event.util'
import { GenericUtil } from '../../util-tool/util/generic.util'
import { EventModel } from '../../util-model/model/event.model'
import { ActionableItemModel } from '../../util-model/model/actionable-item.model'

export class CurrentUserUtil {
    public static isFeasible (
        currentUser: CurrentUserModel | undefined,
        event: EventModel | undefined,
        actionableItem: ActionableItemModel,
    ): boolean {
        if (GenericUtil.isNull( currentUser ) || (!event && (actionableItem.requiredEventOption || actionableItem.requiredEventAuthority))) return false

        return EventUtil.hasOption( event, actionableItem.requiredEventOption ) &&
               CurrentUserUtil.hasAuthority( currentUser!, actionableItem.requiredUserAuthority ) &&
               CurrentUserUtil.hasAuthority(
                   currentUser!,
                   this.buildAuthority( actionableItem.requiredEventAuthority, event?.id ),
               )
    }

    public static hasUserAuthority (
        currentUser: CurrentUserModel | undefined,
        authority: UserAuthorityEnum,
    ): boolean {
        if (GenericUtil.isNull( currentUser )) return false

        return CurrentUserUtil.hasAuthority( currentUser!, authority )
    }

    public static hasEventAuthority (
        currentUser: CurrentUserModel | undefined,
        id: string | undefined,
        authority: EventAuthorityEnum,
    ): boolean {
        const eventId: string | undefined = id ?? currentUser?.preferences?.selectedProfile?.event?.id

        if (GenericUtil.isNull( currentUser ) || !eventId) return false

        return CurrentUserUtil.hasAuthority( currentUser!, this.buildAuthority( authority, id ) )
    }

    private static buildAuthority (
        requiredAuthority: EventAuthorityEnum | undefined,
        id: string | undefined,
    ): UserAuthorityEnum | string | undefined {
        if (GenericUtil.isNull( requiredAuthority )) return undefined

        return `${id}_${requiredAuthority}`
    }

    public static hasAuthority (
        currentUser: CurrentUserModel | undefined,
        authority: UserAuthorityEnum | string | undefined,
    ): boolean {
        if (!currentUser) return false
        return ArrayUtil.includes( currentUser.authorities, authority )
    }
}
