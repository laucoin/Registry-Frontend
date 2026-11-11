import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';
import type { SgdfStatusVariant } from '@sgdf/ui';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UserProfileFacade } from '@core/registry/state/user-profile.facade';
import { ProjectProfileActions } from '@pages/projects/[projectId]/configuration/profiles/project-profile-row/project-profile-actions.service';
import { EllipsisDirective } from '@shared/directives/ellipsis.directive';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { StringHelper } from '@shared/helpers/string.helper';
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum';
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum';
import { isProjectProfile, ListedProfileModel, profileProjectId } from '@shared/models/model/listed-profile.model';
import { ProjectProfileModel } from '@shared/models/model/project-profile.model';
import { UserInvitationModel } from '@shared/models/model/user-invitation.model';
import { AvailabilityPeriodComponent } from '@shared/ui/common/availability-period/availability-period.component';
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component';
import { FavoriteToggleComponent } from '@shared/ui/common/favorite-toggle/favorite-toggle.component';

import '@sgdf/ui/avatar';
import '@sgdf/ui/button';
import '@sgdf/ui/tag';

const INITIALS_LENGTH = 2;

const STATUS_VARIANTS: Partial<Record<ProfileStatusEnum, SgdfStatusVariant>> = {
	[ProfileStatusEnum.ACCEPTED]: 'success',
	[ProfileStatusEnum.REJECTED]: 'warning',
	[ProfileStatusEnum.BLOCKED]: 'danger',
};

/**
 * Objectif: Présente un profil comme élément de liste (attribut de `sgdf-list-item`), vu depuis l'utilisateur ou depuis
 * le projet.
 * Périmètre: Affiche la personne ou le projet, la période d'accès, le rôle, la disponibilité et le statut, la réponse à
 * une invitation en attente, le favori du projet et le menu d'actions.
 * Limites: Reçoit le profil en entrée ; les commandes sont déléguées à ProjectProfileActions.
 */
@Component({
	selector: 'sgdf-list-item[appProjectProfileRow], app-project-profile-row',
	imports: [
		EllipsisDirective,
		TranslocoPipe,
		AvailabilityPeriodComponent,
		ElementActionsComponent,
		FavoriteToggleComponent,
	],
	providers: [ProjectProfileActions],
	host: { '[disabled]': '!profile().visible' },
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './project-profile-row.component.html',
})
export class ProjectProfileRowComponent {
	protected readonly actions = inject(ProjectProfileActions);
	private readonly sessionFacade = inject(SessionFacade);
	private readonly userProfileFacade = inject(UserProfileFacade);

	public readonly profile = input.required<ListedProfileModel>();

	protected readonly ProfileStatusEnum = ProfileStatusEnum;

	protected readonly title = computed(() => this.titleOf(this.profile()));
	protected readonly initials = computed(() => StringHelper.initials(this.title(), INITIALS_LENGTH));
	protected readonly selected = computed(
		() => this.sessionFacade.selectedProject()?.id === profileProjectId(this.profile()),
	);
	protected readonly awaitsAnswer = computed(() => this.awaitsAnswerOf(this.profile()));
	protected readonly canFavorite = computed(() => this.canFavoriteOf(this.profile()));
	protected readonly favorite = computed(() => this.favoriteOf(this.profile()));
	protected readonly available = computed(
		() => this.profile().availabilityStatus?.value === AvailabilityStatusEnum.AVAILABLE,
	);
	protected readonly statusVariant = computed(() => STATUS_VARIANTS[this.profile().status.value] ?? 'info');
	protected readonly menu = computed(() => this.actions.actionsFor(this.profile()));

	protected toggleFavorite(): void {
		this.userProfileFacade.toggleProjectFavorite(
			GenericHelper.require(this.invitationOf(this.profile()), 'invitation'),
		);
	}

	private titleOf(profile: ListedProfileModel): string {
		return isProjectProfile(profile) ? this.userName(profile) : (profile.project?.name ?? '');
	}

	private awaitsAnswerOf(profile: ListedProfileModel): boolean {
		return (
			profile.status.value === ProfileStatusEnum.INVITED &&
			(!isProjectProfile(profile) || profile.user.id === this.sessionFacade.currentUser()?.id)
		);
	}

	private canFavoriteOf(profile: ListedProfileModel): boolean {
		return !!this.invitationOf(profile)?.project && !this.awaitsAnswerOf(profile);
	}

	private favoriteOf(profile: ListedProfileModel): boolean {
		return !!this.invitationOf(profile)?.project?.favorite;
	}

	private invitationOf(profile: ListedProfileModel): UserInvitationModel | undefined {
		return isProjectProfile(profile) ? undefined : profile;
	}

	private userName(profile: ProjectProfileModel): string {
		return (
			[profile.user.firstName, profile.user.lastName?.toUpperCase()].filter(Boolean).join(' ') ||
			profile.user.email
		);
	}
}
