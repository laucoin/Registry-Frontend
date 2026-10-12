import { inject, Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { UserProfileFacade } from '@core/registry/state/user-profile.facade'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base'
import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { isProjectProfile, ListedProfileModel } from '@shared/models/model/listed-profile.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'

/**
 * Purpose: Tells which commands a project profile of a list offers to the signed-in user and runs them.
 * Scope: Builds the action menu (select, edit, block, unblock, delete) with its confirmations, and answers an invitation after a confirmation.
 * Limits: Holds no state; it only reads the session and calls the profile facades. The backend still checks every command.
 */
@Injectable()
export class ProjectProfileActions extends ElementActionsBase<ListedProfileModel> {
    protected readonly translationPrefix: string = 'project-profiles'

    private readonly facade: ProjectProfileFacade = inject(ProjectProfileFacade)
    private readonly userProfileFacade: UserProfileFacade = inject(UserProfileFacade)
    private readonly router: Router = inject(Router)

    protected specsFor(profile: ListedProfileModel): ElementActionSpec[] {
        const own: boolean = !isProjectProfile( profile ) || this.sessionFacade.currentUser()?.id === profile.user.id
        return [
            this.selectSpec(profile, own),
            this.editSpec(profile, own),
            this.blockSpec(profile, own),
            this.unblockSpec(profile, own),
            this.deleteSpec(profile),
        ]
    }

    public manageAcceptance(profile: ListedProfileModel, status: ProfileStatusEnum): void {
        const accepted: boolean = status === ProfileStatusEnum.ACCEPTED
        this.confirmation.confirm(
            `project-profiles.actions.confirmations.${status}`,
            profile,
            accepted ? SeverityEnum.SUCCESS : SeverityEnum.DANGER,
            accepted ? 'pi pi-info-circle' : 'pi pi-exclamation-triangle',
            (): void => this.userProfileFacade.manageProjectInvitationAcceptance(profile.id, accepted),
        )
    }

    private selectSpec(profile: ListedProfileModel, own: boolean): ElementActionSpec {
        return {
            id: 'select',
            icon: 'arrow-right',
            enabledAction: ElementActionEnum.PROJECT_PROFILE_SELECT,
            shown: own && this.sessionFacade.selectedProject()?.id !== profile.projectId,
            allowed: true,
            run: (): void => this.navigate(RegistryRouteEnum.PROJECT.replace(':projectId', profile.projectId)),
        }
    }

    private editSpec(profile: ListedProfileModel, own: boolean): ElementActionSpec {
        return {
            id: 'edit',
            icon: 'pen-to-square',
            enabledAction: ElementActionEnum.PROJECT_PROFILE_UPDATE,
            shown: !own,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U),
            run: (): void => this.navigate(
                RegistryRouteEnum.PROJECTS_CONFIGURATION_PROFILES_EDITION
                    .replace(':profileId', profile.id)
                    .replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
            ),
        }
    }

    private blockSpec(profile: ListedProfileModel, own: boolean): ElementActionSpec {
        return {
            id: 'disable',
            icon: 'ban',
            enabledAction: ElementActionEnum.PROJECT_PROFILE_BLOCK,
            shown: !own && profile.visible && profile.status?.value === ProfileStatusEnum.ACCEPTED,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U),
            confirmation: { severity: SeverityEnum.WARNING, icon: 'pi pi-exclamation-triangle', accept: (): void => this.run(this.facade.blockProjectProfile(profile as ProjectProfileModel)) },
        }
    }

    private unblockSpec(profile: ListedProfileModel, own: boolean): ElementActionSpec {
        return {
            id: 'enable',
            icon: 'rotate-right',
            enabledAction: ElementActionEnum.PROJECT_PROFILE_UNBLOCK,
            shown: !own && !profile.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U),
            confirmation: { severity: SeverityEnum.INFO, icon: 'pi pi-info-circle', accept: (): void => this.run(this.facade.unblockProjectProfile(profile as ProjectProfileModel)) },
        }
    }

    private deleteSpec(profile: ListedProfileModel): ElementActionSpec {
        return {
            id: 'delete',
            icon: 'trash',
            enabledAction: ElementActionEnum.PROJECT_PROFILE_DELETE,
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_D),
            confirmation: { severity: SeverityEnum.DANGER, icon: 'pi pi-exclamation-triangle', accept: (): void => this.run(this.facade.deleteProjectProfile(profile)) },
        }
    }

    private navigate(url: string): void {
        this.router.navigateByUrl(url).catch((err: Error) => console.error(err))
    }
}
