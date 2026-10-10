import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ArrayHelper } from '@shared/helpers/array.helper'
import { ProjectHelper } from '@shared/helpers/project.helper'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { ProjectModel } from '@shared/models/model/project.model'
import { ActionableItemModel } from '@shared/models/model/actionable-item.model'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'

/**
 * Purpose: Answers authority, project option and theme questions about the current user.
 * Scope: Pure functions over the user model: feasibility of an action, authority lookups and theme mapping.
 * Limits: Never enforces anything; the backend is the only security boundary.
 */
export class CurrentUserHelper {
    public static isFeasible (
        currentUser: CurrentUserModel | undefined,
        project: ProjectModel | undefined,
        actionableItem: ActionableItemModel,
    ): boolean {
        if (GenericHelper.isNull( currentUser ) || (!project && (actionableItem.requiredProjectOption || actionableItem.requiredProjectAuthority))) return false

        return ProjectHelper.hasOption( project, actionableItem.requiredProjectOption ) &&
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
        if (GenericHelper.isNull( currentUser ) || !id) return false

        return this.hasAuthority( currentUser!, this.buildAuthority( authority, id ) )
    }

    private static buildAuthority (
        requiredAuthority: ProjectAuthorityEnum | undefined,
        id: string | undefined,
    ): UserAuthorityEnum | string | undefined {
        if (GenericHelper.isNull( requiredAuthority )) return undefined

        return `${id}_${requiredAuthority}`
    }

    public static hasUserAuthority (
        currentUser: CurrentUserModel | undefined,
        authority: UserAuthorityEnum,
    ): boolean {
        if (GenericHelper.isNull( currentUser )) return false

        return this.hasAuthority( currentUser!, authority )
    }

    private static hasAuthority (
        currentUser: CurrentUserModel | undefined,
        authority: UserAuthorityEnum | string | undefined,
    ): boolean {
        if (!currentUser) return false
        return ArrayHelper.includes( currentUser.authorities, authority )
    }

    public static mapThemeToEnum (theme: string): ThemeEnum {
        switch (theme) {
            case 'DARK':
                return ThemeEnum.DARK
            case 'LIGHT':
                return ThemeEnum.LIGHT
            default:
                return ThemeEnum.SYSTEM
        }
    }

    public static mapThemeToString (theme: ThemeEnum): string {
        switch (theme) {
            case ThemeEnum.DARK:
                return 'DARK'
            case ThemeEnum.LIGHT:
                return 'LIGHT'
            default:
                return ThemeEnum.SYSTEM
        }
    }
}
