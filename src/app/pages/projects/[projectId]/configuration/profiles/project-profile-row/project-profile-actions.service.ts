import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { UserProfileFacade } from '@core/registry/state/user-profile.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade';
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base';
import { RouteHelper } from '@shared/helpers/route.helper';
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { isProjectProfile, ListedProfileModel, profileProjectId } from '@shared/models/model/listed-profile.model';
import { ProjectProfileModel } from '@shared/models/model/project-profile.model';

/**
 * Purpose: Indique quelles commandes un profil de projet d'une liste offre à l'utilisateur connecté et les exécute.
 * Scope: Construit le menu d'actions (sélectionner, modifier, bloquer, débloquer, supprimer) avec ses confirmations, et répond à une invitation après confirmation ; supprimer son propre profil demande une phrase à saisir.
 * Limits: Ne détient aucun état ; lit seulement la session et appelle les facades des profils. Le backend vérifie toujours chaque commande.
 */
@Injectable()
export class ProjectProfileActions extends ElementActionsBase<ListedProfileModel> {
	protected readonly translationPrefix: string = 'project-profiles';

	private readonly facade = inject(ProjectProfileFacade);
	private readonly userProfileFacade = inject(UserProfileFacade);
	private readonly router = inject(Router);

	protected specsFor(profile: ListedProfileModel): ElementActionSpec[] {
		const own = !isProjectProfile(profile) || this.sessionFacade.currentUser()?.id === profile.user.id;
		return [
			this.selectSpec(profile, own),
			this.editSpec(profile, own),
			this.blockSpec(profile, own),
			this.unblockSpec(profile, own),
			this.deleteSpec(profile, own),
		];
	}

	public manageAcceptance(profile: ListedProfileModel, status: ProfileStatusEnum): void {
		const accepted = status === ProfileStatusEnum.ACCEPTED;
		this.confirmation.confirm(
			`project-profiles.actions.confirmations.${status}`,
			profile,
			accepted ? SeverityEnum.SUCCESS : SeverityEnum.DANGER,
			() => this.userProfileFacade.manageProjectInvitationAcceptance(profile.id, accepted),
		);
	}

	private selectSpec(profile: ListedProfileModel, own: boolean): ElementActionSpec {
		const projectId = profileProjectId(profile);
		return {
			id: 'select',
			icon: 'arrow-right',
			shown: own && projectId !== undefined && this.sessionFacade.selectedProject()?.id !== projectId,
			allowed: true,
			run: () => this.navigate(RegistryRouteEnum.PROJECT.replace(':projectId', projectId ?? '')),
		};
	}

	private editSpec(profile: ListedProfileModel, own: boolean): ElementActionSpec {
		return {
			id: 'edit',
			icon: 'pen-to-square',
			shown: !own,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U),
			run: () =>
				this.navigate(
					RouteHelper.preservingQuery(
						RegistryRouteEnum.PROJECTS_CONFIGURATION_PROFILES_EDITION.replace(
							':profileId',
							profile.id,
						).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
						this.router.url,
					),
				),
		};
	}

	private blockSpec(profile: ListedProfileModel, own: boolean): ElementActionSpec {
		return {
			id: 'block',
			icon: 'ban',
			shown: !own && profile.visible && profile.status?.value === ProfileStatusEnum.ACCEPTED,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_SOFT_DELETE),
			confirmation: {
				severity: SeverityEnum.WARNING,
				accept: () => this.run(this.facade.blockProjectProfile(profile as ProjectProfileModel)),
			},
		};
	}

	private unblockSpec(profile: ListedProfileModel, own: boolean): ElementActionSpec {
		return {
			id: 'unblock',
			icon: 'rotate-right',
			shown: !own && !profile.visible,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_RESTORE),
			confirmation: {
				severity: SeverityEnum.INFO,
				accept: () => this.run(this.facade.unblockProjectProfile(profile as ProjectProfileModel)),
			},
		};
	}

	private deleteSpec(profile: ListedProfileModel, own: boolean): ElementActionSpec {
		return {
			id: 'delete',
			icon: 'trash',
			shown: true,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_D),
			confirmation: {
				severity: SeverityEnum.DANGER,
				accept: () => this.run(this.facade.deleteProjectProfile(profile)),
				translationKey: own ? 'delete-own' : 'delete',
				typed: own,
			},
		};
	}

	private navigate(url: string): void {
		this.router.navigateByUrl(url).catch((): void => undefined);
	}
}
