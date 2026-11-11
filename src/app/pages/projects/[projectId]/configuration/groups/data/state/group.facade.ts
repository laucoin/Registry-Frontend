import { computed, inject, Injectable, Signal } from '@angular/core';

import { Observable, tap } from 'rxjs';

import { GroupDto } from '@pages/projects/[projectId]/configuration/groups/data/dto/group.dto';
import { GroupApi } from '@pages/projects/[projectId]/configuration/groups/data/state/group.api';
import { GroupStore } from '@pages/projects/[projectId]/configuration/groups/data/state/group.store';
import { DateHelper } from '@shared/helpers/date.helper';
import { CommandEvent } from '@shared/helpers/facade/command-event.service';
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade';
import { ParticipantHelper } from '@shared/helpers/participant.helper';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { notifyOnError } from '@shared/helpers/rx.helper';
import { SearchParamsHelper } from '@shared/helpers/search/search-params.helper';
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { AddedGroupMembersModel } from '@shared/models/model/added-group-members.model';
import { GroupModel } from '@shared/models/model/group.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

/**
 * Objectif: Point d'entrée public du domaine des groupes pour les pages, composants et guards.
 * Périmètre: Expose le store des groupes sous forme de signals, relaie ses requêtes et exécute les commandes de groupe avec leurs notifications.
 * Limites: Ne détient aucun état propre et ne construit aucune requête HTTP lui-même.
 */
@Injectable()
export class GroupFacade extends GenericProjectElementFacade {
	private readonly store: InstanceType<typeof GroupStore> = inject(GroupStore);

	private readonly api = inject(GroupApi);
	private readonly pluralTranslationPipe = inject(PluralTranslationPipe);

	public readonly groupsPage: Signal<PageModel<GroupModel> | undefined> = this.store.groups.element;

	public readonly groupsPageLoading = this.store.groups.loading;

	public readonly groupsPageSilentLoading = this.store.groups.silentLoading;

	public readonly groupsPageError: Signal<NotificationModel | undefined> = this.store.groups.error;

	private readonly groupsPageResetSearch = this.store.groups.params.resetSearch;

	public readonly groupsPageQueryParam = this.store.groups.params.q;

	public readonly groupsPageAtParam = computed(() => DateHelper.buildDate(this.store.groups.params.at()));

	public readonly groupsPageIsPresentParam = this.store.groups.params.isPresent;

	public readonly groupsPageIsVisibleParam = this.store.groups.params.isVisible;

	public readonly groupMembersPage: Signal<PageModel<ParticipantModel> | undefined> = this.store.members.element;

	public readonly groupMembersPageLoading = this.store.members.loading;

	public readonly groupMembersPageSilentLoading = this.store.members.silentLoading;

	public readonly groupMembersPageError: Signal<NotificationModel | undefined> = this.store.members.error;

	private readonly groupMembersPageResetSearch = this.store.members.params.resetSearch;

	public readonly groupMembersPageQueryParam = this.store.members.params.q;

	public readonly groupMembersPageStatusParam = this.store.members.params.status;

	public readonly groupMembersPageIsVisibleParam = this.store.members.params.isVisible;

	public readonly searchedParticipantsMetadata = computed(() =>
		this.store.metadata.searched().map(ParticipantHelper.toSelectItem),
	);

	public readonly availabilitiesMetadata = this.translatedOptions(this.store.metadata.availabilities);

	public readonly visibilitiesMetadata = this.translatedOptions(this.store.metadata.visibilities);

	public fetchGroupsPage(page: number | undefined, size: number | undefined): void {
		const index = this.groupsPageResetSearch() ? 0 : page;
		this.store.fetchGroupsPage({ projectId: this.selectedProjectId(), page: index, size: size });
	}

	public inputPageSearchParameters(
		q: string | undefined,
		at: Date | undefined,
		isPresent: boolean | undefined,
		isVisible: boolean | undefined,
		sort: string | undefined = undefined,
	): void {
		const next = {
			q,
			isPresent,
			isVisible,
			at: DateHelper.toIsoInstant(at),
			sort,
		};
		if (!SearchParamsHelper.hasChanged(this.store.groups.params(), next)) return;
		this.store.updateGroupsPageSearchParams({ ...next, resetSearch: true });
	}

	public fetchGroupMembersPage(id: string, page: number | undefined, size: number | undefined): void {
		const index = this.groupMembersPageResetSearch() ? 0 : page;
		this.store.fetchGroupMembersPage({ projectId: this.selectedProjectId(), id: id, page: index, size: size });
	}

	public inputMembersPageSearchParameters(
		q: string | undefined,
		status: string | undefined,
		isVisible: boolean | undefined,
		sort: string | undefined = undefined,
	): void {
		const next = {
			isVisible,
			status,
			q,
			sort,
		};
		if (!SearchParamsHelper.hasChanged(this.store.members.params(), next)) return;
		this.store.updateGroupMembersPageSearchParams({ ...next, resetSearch: true });
	}

	public searchParticipants(q: string | undefined = undefined): void {
		this.store.searchParticipants({ projectId: this.selectedProjectId(), q: q });
	}

	public fetchGroup(id: string): Observable<GroupModel> {
		return this.api.findGroupById(this.selectedProjectId(), id).pipe(notifyOnError(this.uiFacade));
	}

	public createGroup(group: GroupDto): Observable<GroupModel> {
		return this.api
			.createGroup(this.selectedProjectId(), group)
			.pipe(tap((created) => this.onCommandSuccess('create', created)));
	}

	public updateGroup(id: string, group: GroupDto, ifMatch?: string): Observable<GroupModel> {
		return this.api
			.updateGroupById(this.selectedProjectId(), id, group, ifMatch)
			.pipe(tap((updated) => this.onCommandSuccess('update', updated)));
	}

	public softDeleteGroup(id: string): Observable<GroupModel> {
		return this.api.softDeleteGroupById(this.selectedProjectId(), id).pipe(
			notifyOnError(this.uiFacade),
			tap((disabled) => this.onCommandSuccess('softDelete', disabled)),
		);
	}

	public restoreGroup(id: string): Observable<GroupModel> {
		return this.api.restoreGroupById(this.selectedProjectId(), id).pipe(
			notifyOnError(this.uiFacade),
			tap((enabled) => this.onCommandSuccess('restore', enabled)),
		);
	}

	public hardDeleteGroup(group: GroupModel): Observable<void> {
		return this.api.hardDeleteGroupById(undefined, group.id).pipe(
			notifyOnError(this.uiFacade),
			tap(() => this.onCommandSuccess('hardDelete', group)),
		);
	}

	private onCommandSuccess(command: CommandEvent, group: GroupModel): void {
		this.onCommandSucceeded('group', command, 'groups.notifications', { name: group.name });

		this.store.fetchGroupsPage({
			projectId: this.selectedProjectId(),
			...CumulativePageHelper.reloadRequest(this.groupsPage()),
		});
	}

	public addMembersToGroup(id: string, memberIds: string[]): Observable<AddedGroupMembersModel> {
		return this.api.addMembersToGroupById(this.selectedProjectId(), id, memberIds).pipe(
			notifyOnError(this.uiFacade),
			tap((response) => this.onMembersAdded(id, memberIds, response)),
		);
	}

	public removeMemberFromGroup(id: string, participant: ParticipantModel): Observable<void> {
		return this.api.removeMemberFromGroupById(this.selectedProjectId(), id, participant.id).pipe(
			notifyOnError(this.uiFacade),
			tap(() => this.onMemberRemoved(id, participant)),
		);
	}

	private onMembersAdded(id: string, memberIds: string[], response: AddedGroupMembersModel): void {
		const added = response.members.length;
		const partial = memberIds.length !== added;
		const prefixKey: string = partial
			? 'groups.notifications.partial-add-member'
			: 'groups.notifications.add-member';
		this.notifyMessage(
			partial ? SeverityEnum.WARNING : SeverityEnum.SUCCESS,
			this.pluralTranslationPipe.transform(prefixKey + '.title', added),
			this.pluralTranslationPipe.transform(prefixKey + '.message', added),
			partial ? { asked: memberIds.length, added: added } : { added: added },
		);
		this.onMembersChanged(id);
	}

	private onMemberRemoved(id: string, participant: ParticipantModel): void {
		this.notifySuccess('groups.notifications.remove-member', {
			name: participant.groups?.find((group) => group.id === id)?.name,
			firstName: participant.firstName,
			lastName: participant.lastName,
		});
		this.onMembersChanged(id);
	}

	public handleGroupMembersChange(): Observable<unknown> {
		return this.commandEvents.on('group', 'members');
	}

	public reloadGroupMembersPage(id: string): void {
		this.store.fetchGroupMembersPage({
			projectId: this.selectedProjectId(),
			id: id,
			...CumulativePageHelper.reloadRequest(this.groupMembersPage()),
		});
	}

	private onMembersChanged(id: string): void {
		this.reloadGroupMembersPage(id);
		this.commandEvents.emit('group', 'members');
	}
}
