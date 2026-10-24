import { inject, Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { UserFacade } from '@pages/users/data/state/user.facade'
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum'
import { UserModel } from '@shared/models/model/user.model'

/**
 * Purpose: Indique quelles commandes un utilisateur de la liste offre à l'utilisateur connecté et les exécute.
 * Scope: Construit le menu d'actions (changer le rôle, bloquer, débloquer, supprimer) avec ses confirmations ; personne ne peut agir sur son propre compte.
 * Limits: Ne détient aucun état ; lit seulement la session et appelle la facade des utilisateurs. Le backend vérifie toujours chaque commande.
 */
@Injectable()
export class UserActions extends ElementActionsBase<UserModel> {
    protected readonly translationPrefix: string = 'users'

    private readonly facade: UserFacade = inject(UserFacade)
    private readonly router: Router = inject(Router)

    protected specsFor(user: UserModel): ElementActionSpec[] {
        const others: boolean = this.sessionFacade.currentUser()?.id !== user.id
        return [
            this.updateRoleSpec(user, others),
            this.blockSpec(user, others),
            this.unblockSpec(user, others),
            this.deleteSpec(user, others),
        ]
    }

    private updateRoleSpec(user: UserModel, others: boolean): ElementActionSpec {
        return {
            id: 'update-role',
            icon: 'user-pen',
            shown: others,
            allowed: this.hasAuthority(UserAuthorityEnum.REGISTRY_USER_U),
            run: (): void => {
                this.router.navigateByUrl(RegistryRouteEnum.USERS_EDITION.replace(':userId', user.id)).catch((): void => undefined)
            },
        }
    }

    private blockSpec(user: UserModel, others: boolean): ElementActionSpec {
        return {
            id: 'disable',
            icon: 'ban',
            shown: others && user.visible,
            allowed: this.hasAuthority(UserAuthorityEnum.REGISTRY_USER_U),
            confirmation: { severity: SeverityEnum.WARNING, accept: (): void => this.facade.blockUser(user.id) },
        }
    }

    private unblockSpec(user: UserModel, others: boolean): ElementActionSpec {
        return {
            id: 'enable',
            icon: 'rotate-right',
            shown: others && !user.visible,
            allowed: this.hasAuthority(UserAuthorityEnum.REGISTRY_USER_U),
            confirmation: { severity: SeverityEnum.INFO, accept: (): void => this.facade.unblockUser(user.id) },
        }
    }

    private deleteSpec(user: UserModel, others: boolean): ElementActionSpec {
        return {
            id: 'delete',
            icon: 'trash',
            shown: others,
            allowed: this.hasAuthority(UserAuthorityEnum.REGISTRY_USER_D),
            confirmation: { severity: SeverityEnum.DANGER, accept: (): void => this.facade.deleteUser(user) },
        }
    }

    private hasAuthority(authority: UserAuthorityEnum): boolean {
        return CurrentUserHelper.hasUserAuthority(this.sessionFacade.currentUser(), authority)
    }
}
