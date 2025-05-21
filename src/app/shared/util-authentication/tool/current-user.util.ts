import { ProjectAuthorityEnum } from '../../util-model/enumeration/project-authority.enum'
import { UserAuthorityEnum } from '../../util-model/enumeration/user-authority.enum'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { ArrayUtil } from '../../util-tool/util/array.util'
import { ProjectUtil } from '../../util-tool/util/project.util'
import { GenericUtil } from '../../util-tool/util/generic.util'
import { ProjectModel } from '../../util-model/model/project.model'
import { ActionableItemModel } from '../../util-model/model/actionable-item.model'

export class CurrentUserUtil {
    public static isFeasible (
        currentUser: CurrentUserModel | undefined,
        project: ProjectModel | undefined,
        actionableItem: ActionableItemModel,
    ): boolean {
        if (GenericUtil.isNull( currentUser ) || (!project && (actionableItem.requiredProjectOption || actionableItem.requiredProjectAuthority))) return false

        return ProjectUtil.hasOption( project, actionableItem.requiredProjectOption ) &&
               this.hasAuthority( currentUser!, actionableItem.requiredUserAuthority ) &&
               this.hasAuthority(
                   currentUser!,
                   this.buildAuthority( actionableItem.requiredProjectAuthority, project?.id ),
               )
    }

    public static hasProjectAuthority (
        currentUser: CurrentUserModel | undefined,
        id: string | undefined,
        authority: ProjectAuthorityEnum,
    ): boolean {
        const projectId: string | undefined = id ?? currentUser?.preferences?.selectedProfile?.project?.id

        if (GenericUtil.isNull( currentUser ) || !projectId) return false

        return this.hasAuthority( currentUser!, this.buildAuthority( authority, id ) )
    }

    private static buildAuthority (
        requiredAuthority: ProjectAuthorityEnum | undefined,
        id: string | undefined,
    ): UserAuthorityEnum | string | undefined {
        if (GenericUtil.isNull( requiredAuthority )) return undefined

        return `${id}_${requiredAuthority}`
    }

    public static hasUserAuthority (
        currentUser: CurrentUserModel | undefined,
        authority: UserAuthorityEnum,
    ): boolean {
        if (GenericUtil.isNull( currentUser )) return false

        return this.hasAuthority( currentUser!, authority )
    }

    private static hasAuthority (
        currentUser: CurrentUserModel | undefined,
        authority: UserAuthorityEnum | string | undefined,
    ): boolean {
        if (!currentUser) return false
        return ArrayUtil.includes( currentUser.authorities, authority )
    }
}
