import { computed, inject, Injectable, Signal } from '@angular/core';

import { Observable, tap } from 'rxjs';

import { CreatedProjectProfiles } from '@pages/projects/[projectId]/configuration/profiles/data/dto/created-project-profiles.dto';
import { ProjectProfileDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profile.dto';
import { ProjectProfilesDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profiles.dto';
import { ProjectProfileApi } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.api';
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store';
import { DateHelper } from '@shared/helpers/date.helper';
import { CommandEvent } from '@shared/helpers/facade/command-event.service';
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { notifyOnError } from '@shared/helpers/rx.helper';
import { SearchParamsHelper } from '@shared/helpers/search/search-params.helper';
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper';
import { UserHelper } from '@shared/helpers/user.helper';
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { isProjectProfile, ListedProfileModel } from '@shared/models/model/listed-profile.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { ProjectProfileModel } from '@shared/models/model/project-profile.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

function countOf(emails: string[] | undefined): number {
	return emails?.length ?? 0;
}

/**
 * Objectif: Point d'entrée public du domaine des profils de projet pour les pages, composants et guards.
 * Périmètre: Expose le store des profils de projet sous forme de signals, relaie ses requêtes et exécute les commandes de profil de projet avec leurs notifications.
 * Limites: Ne détient aucun état propre et ne construit aucune requête HTTP lui-même.
 */
@Injectable()
export class ProjectProfileFacade extends GenericProjectElementFacade {
	private readonly api = inject(ProjectProfileApi);
	private readonly pluralTranslationPipe = inject(PluralTranslationPipe);

	private readonly store: InstanceType<typeof ProjectProfileStore> = inject(ProjectProfileStore);

	public readonly projectProfilesPage: Signal<PageModel<ProjectProfileModel> | undefined> =
		this.store.projectProfiles.element;
	public readonly projectProfilesPageLoading = this.store.projectProfiles.loading;
	public readonly projectProfilesPageSilentLoading = this.store.projectProfiles.silentLoading;
	public readonly projectProfilesPageError: Signal<NotificationModel | undefined> = this.store.projectProfiles.error;
	private readonly projectProfilesPageResetSearch = this.store.projectProfiles.params.resetSearch;
	public readonly projectProfilesPageQueryParam = this.store.projectProfiles.params.q;

	public readonly projectProfilesPageAtParam = computed(() =>
		DateHelper.buildDate(this.store.projectProfiles.params.at()),
	);
	public readonly projectProfilesPageIsAvailableParam = this.store.projectProfiles.params.isAvailable;
	public readonly projectProfilesPageIsVisibleParam = this.store.projectProfiles.params.isVisible;
	public readonly projectProfilesPageStatusParam: Signal<string | undefined> =
		this.store.projectProfiles.params.status;

	public readonly searchedUsersMetadata = computed(() => this.store.metadata.searched().map(UserHelper.toSelectItem));
	public readonly projectProfileAssignableRolesMetadata: Signal<SelectOptionModel<string>[]> = computed(
		() => this.store.metadata.roles() ?? [],
	);
	public readonly projectProfileAssignableRolesLoading: Signal<boolean> = computed(
		() => this.store.metadata.roles() === undefined && !this.store.sectionErrors()['metadata.roles'],
	);
	public readonly inviteByEmailEnabled = this.store.metadata.features.inviteByEmail;
	public readonly projectProfilesStatusMetadata = this.store.metadata.status;
	public readonly projectProfilesAvailabilitiesMetadata = this.translatedOptions(this.store.metadata.availabilities);

	public readonly projectProfilesVisibilitiesMetadata = this.translatedOptions(this.store.metadata.visibilities);

	public fetchProjectProfilesPage(page: number | undefined, size: number | undefined): void {
		const index = this.projectProfilesPageResetSearch() ? 0 : page;
		this.store.fetchProjectProfilesPage({ projectId: this.selectedProjectId(), page: index, size: size });
	}

	public inputPageSearchParameters(
		q: string | undefined,
		at: Date | undefined,
		status: ProfileStatusEnum | undefined,
		isAvailable: boolean | undefined,
		isVisible: boolean | undefined,
		sort: string | undefined = undefined,
	): void {
		const next = {
			status,
			isAvailable,
			isVisible,
			q,
			at: DateHelper.toIsoInstant(at),
			sort,
		};
		if (!SearchParamsHelper.hasChanged(this.store.projectProfiles.params(), next)) return;
		this.store.updateProjectProfilesPageSearchParams({ ...next, resetSearch: true });
	}

	public searchUsers(
		q: string | undefined = undefined,
		projectId: string | undefined = this.selectedProjectId(),
	): void {
		this.store.searchUsers({ projectId: projectId, q: q });
	}

	public fetchAssignableRoles(projectId: string | undefined = this.selectedProjectId()): void {
		this.store.fetchAssignableRoles(projectId);
	}

	public fetchFeatures(): void {
		this.store.fetchFeatures();
	}

	public fetchProjectProfile(id: string): Observable<ProjectProfileModel> {
		return this.api.findProjectProfileById(this.selectedProjectId(), id).pipe(notifyOnError(this.uiFacade));
	}

	public createProjectProfiles(
		projectProfiles: ProjectProfilesDto,
		projectId: string | undefined = this.selectedProjectId(),
	): Observable<CreatedProjectProfiles> {
		return this.api
			.createProjectProfiles(projectId, projectProfiles)
			.pipe(tap((creationStatus) => this.onProfilesCreated(creationStatus, projectId)));
	}

	private onProfilesCreated(creationStatus: CreatedProjectProfiles, projectId: string | undefined): void {
		this.notifyCreation(creationStatus);
		if (projectId === this.selectedProjectId()) this.refreshPage();
	}

	private notifyCreation(creationStatus: CreatedProjectProfiles): void {
		const created = countOf(creationStatus?.createdEmails);
		const notCreated = countOf(creationStatus?.notCreatedEmails);
		if (notCreated > 0) {
			this.notifyPartialCreation(created, notCreated);
		} else {
			this.notifyFullCreation(creationStatus, created);
		}
	}

	private notifyPartialCreation(created: number, notCreated: number): void {
		const prefixKey = 'project-profiles.notifications.partial-invitation';
		this.notifyMessage(
			SeverityEnum.WARNING,
			this.pluralTranslationPipe.transform(prefixKey + '.title', created),
			this.pluralTranslationPipe.transform(prefixKey + '.message', created),
			{ asked: created + notCreated, created: created },
		);
	}

	private notifyFullCreation(creationStatus: CreatedProjectProfiles, created: number): void {
		this.notifyMessage(
			SeverityEnum.SUCCESS,
			this.pluralTranslationPipe.transform(
				'project-profiles.notifications.create.title',
				creationStatus.createdEmails,
			),
			this.pluralTranslationPipe.transform(
				'project-profiles.notifications.create.message',
				creationStatus.createdEmails,
			),
			{ created: created },
		);
	}

	public updateProjectProfile(
		id: string,
		projectProfile: ProjectProfileDto,
		ifMatch?: string,
	): Observable<ProjectProfileModel> {
		return this.api
			.updateProjectProfileById(this.selectedProjectId(), id, projectProfile, ifMatch)
			.pipe(tap((updated) => this.onCommandSuccess('update', updated)));
	}

	public blockProjectProfile(profile: ProjectProfileModel): Observable<ProjectProfileModel> {
		return this.api.blockProjectProfileById(this.selectedProjectId(), profile.id).pipe(
			notifyOnError(this.uiFacade),
			tap(() => this.onCommandSuccess('block', profile)),
		);
	}

	public unblockProjectProfile(profile: ProjectProfileModel): Observable<ProjectProfileModel> {
		return this.api.unblockProjectProfileById(this.selectedProjectId(), profile.id).pipe(
			notifyOnError(this.uiFacade),
			tap(() => this.onCommandSuccess('unblock', profile)),
		);
	}

	public deleteProjectProfile(profile: ListedProfileModel): Observable<void> {
		return this.api.deleteProjectProfileById(undefined, profile.id).pipe(
			notifyOnError(this.uiFacade),
			tap(() => this.onCommandSuccess('delete', profile)),
		);
	}

	private onCommandSuccess(command: CommandEvent, profile: ListedProfileModel): void {
		const key: string = command === 'update' ? 'edit' : command;
		this.notifyMessage(
			SeverityEnum.SUCCESS,
			`project-profiles.notifications.${key}.title`,
			command === 'delete'
				? 'project-profiles.notifications.delete.message.other'
				: `project-profiles.notifications.${key}.message`,
			this.notificationParams(profile),
		);
		this.refreshPage();
	}

	private notificationParams(profile: ListedProfileModel): Record<string, string | undefined> {
		const user = isProjectProfile(profile) ? profile.user : undefined;
		return {
			firstName: user?.firstName,
			lastName: user?.lastName,
			name: this.sessionFacade.selectedProject()?.name,
		};
	}

	private refreshPage(): void {
		this.store.fetchProjectProfilesPage({
			projectId: this.selectedProjectId(),
			...CumulativePageHelper.reloadRequest(this.projectProfilesPage()),
		});
	}
}
