import { computed, inject, Injectable, Signal } from '@angular/core';

import { Observable, tap } from 'rxjs';

import { BrowserService } from '@core/browser/browser.service';
import { ParticipantDto } from '@pages/projects/[projectId]/configuration/participants/data/dto/participant.dto';
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api';
import { ParticipantStore } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.store';
import { DateHelper } from '@shared/helpers/date.helper';
import { CommandEvent } from '@shared/helpers/facade/command-event.service';
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade';
import { notifyOnError } from '@shared/helpers/rx.helper';
import { SearchParamsHelper } from '@shared/helpers/search/search-params.helper';
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper';
import { MovementModel } from '@shared/models/model/movement.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { ParticipantTimelineModel } from '@shared/models/model/participant-timeline.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

/**
 * Purpose: Point d'entrée public du domaine des participants pour les pages, composants et guards.
 * Scope: Expose le store des participants sous forme de signals, relaie ses requêtes et exécute les commandes de participant avec leurs notifications.
 * Limits: Ne détient aucun état propre et ne construit aucune requête HTTP lui-même.
 */
@Injectable()
export class ParticipantFacade extends GenericProjectElementFacade {
	private readonly store: InstanceType<typeof ParticipantStore> = inject(ParticipantStore);

	private readonly api = inject(ParticipantApi);

	private readonly browser = inject(BrowserService);

	public readonly participantsPage: Signal<PageModel<ParticipantModel> | undefined> = this.store.participants.element;

	public readonly participantsPageLoading = this.store.participants.loading;

	public readonly participantsPageSilentLoading = this.store.participants.silentLoading;

	public readonly participantsPageError: Signal<NotificationModel | undefined> = this.store.participants.error;

	public readonly participantsPageResetSearch = this.store.participants.params.resetSearch;

	public readonly participantsPageQueryParam = this.store.participants.params.q;

	public readonly participantsPageSortParam = this.store.participants.params.sort;

	public readonly participantsPageStatusParam = this.store.participants.params.status;

	public readonly participantsPageIsVisibleParam = this.store.participants.params.isVisible;

	public readonly participantMovementsPage: Signal<PageModel<MovementModel> | undefined> =
		this.store.movements.element;

	public readonly participantMovementsPageLoading = this.store.movements.loading;

	public readonly participantMovementsPageSilentLoading = this.store.movements.silentLoading;

	public readonly participantMovementsPageError: Signal<NotificationModel | undefined> = this.store.movements.error;

	public readonly participantTimeline: Signal<ParticipantTimelineModel | undefined> = this.store.timeline.element;

	public readonly participantTimelineLoading = this.store.timeline.loading;

	public readonly participantTimelineError: Signal<NotificationModel | undefined> = this.store.timeline.error;

	public readonly participantMovementsPageResetSearch = this.store.movements.params.resetSearch;

	public readonly participantMovementsPageTypeParam = this.store.movements.params.type;

	public readonly participantMovementsPageSortParam = this.store.movements.params.sort;

	public readonly participantMovementsPageFromParam = computed(() =>
		DateHelper.buildDate(this.store.movements.params.from()),
	);

	public readonly participantMovementsPageToParam = computed(() =>
		DateHelper.buildDate(this.store.movements.params.to()),
	);

	public readonly participantMovementsPageIsVisibleParam = this.store.movements.params.isVisible;

	public readonly searchedUsersMetadata = this.store.metadata.searchedUsers;

	public readonly searchedGroupsMetadata = this.store.metadata.searchedGroups;

	public readonly presencesStatusMetadata = this.store.metadata.presencesStatus;

	public readonly visibilitiesMetadata: Signal<SelectOptionModel<boolean | undefined>[]> = computed(
		(): SelectOptionModel<boolean | undefined>[] =>
			this.store.metadata.visibilities().map((status): SelectOptionModel<boolean | undefined> => ({
				...status,
				label: this.translateLabel(status.label),
			})),
	);

	public fetchParticipantsPage(page: number | undefined, size: number | undefined): void {
		const index = this.participantsPageResetSearch() ? 0 : page;
		this.store.fetchParticipantsPage({ projectId: this.selectedProjectId(), page: index, size: size });
	}

	public inputPageSearchParameters(
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
		if (!SearchParamsHelper.hasChanged(this.store.participants.params(), next)) return;
		this.store.updateParticipantsPageSearchParams({ ...next, resetSearch: true });
	}

	public fetchParticipantMovementsPage(id: string, page: number | undefined, size: number | undefined): void {
		const index = this.participantMovementsPageResetSearch() ? 0 : page;
		this.store.fetchParticipantMovementsPage({
			projectId: this.selectedProjectId(),
			id: id,
			page: index,
			size: size,
		});
	}

	public fetchParticipantTimeline(id: string): void {
		this.store.fetchParticipantTimeline({ projectId: this.selectedProjectId(), id: id });
	}

	public reloadParticipantTimeline(id: string): void {
		this.store.reloadParticipantTimeline({ projectId: this.selectedProjectId(), id: id });
	}

	public reloadParticipantMovementsPage(id: string): void {
		this.store.fetchParticipantMovementsPage({
			projectId: this.selectedProjectId(),
			id: id,
			...CumulativePageHelper.reloadRequest(this.participantMovementsPage()),
		});
	}

	public inputMovementsPageSearchParameters(
		type: string | undefined,
		from: Date | undefined,
		to: Date | undefined,
		isVisible: boolean | undefined,
		sort: string | undefined = undefined,
	): void {
		const next = {
			isVisible,
			type,
			from: DateHelper.toIsoInstant(from),
			to: DateHelper.toIsoInstant(to),
			sort,
		};
		if (!SearchParamsHelper.hasChanged(this.store.movements.params(), next)) return;
		this.store.updateParticipantMovementsPageSearchParams({
			...next,
			resetSearch: true,
			isCurrent: false,
			hasActivity: undefined,
		});
	}

	public searchUsers(q: string | undefined = undefined): void {
		this.store.searchUsers({ projectId: this.selectedProjectId(), q: q });
	}

	public searchGroups(q: string | undefined = undefined): void {
		this.store.searchGroups({ projectId: this.selectedProjectId(), q: q });
	}

	public handleParticipantFirstPageReload(): Observable<unknown> {
		return this.commandEvents.on('participant', 'create', 'hardDelete');
	}

	public handleParticipantCurrentPageReload(): Observable<unknown> {
		return this.commandEvents.on('participant', 'update', 'softDelete', 'restore');
	}

	public fetchParticipant(id: string): Observable<ParticipantModel> {
		return this.api.findParticipantById(this.selectedProjectId(), id).pipe(notifyOnError(this.uiFacade));
	}

	public createParticipant(participant: ParticipantDto): Observable<ParticipantModel> {
		return this.api
			.createParticipant(this.selectedProjectId(), participant)
			.pipe(tap((created) => this.onCommandSuccess('create', created)));
	}

	public updateParticipant(id: string, participant: ParticipantDto, ifMatch?: string): Observable<ParticipantModel> {
		return this.api
			.updateParticipantById(this.selectedProjectId(), id, participant, ifMatch)
			.pipe(tap((updated) => this.onCommandSuccess('update', updated)));
	}

	public softDeleteParticipant(id: string): Observable<ParticipantModel> {
		return this.api.softDeleteParticipantById(this.selectedProjectId(), id).pipe(
			notifyOnError(this.uiFacade),
			tap((disabled) => this.onCommandSuccess('softDelete', disabled)),
		);
	}

	public restoreParticipant(id: string): Observable<ParticipantModel> {
		return this.api.restoreParticipantById(this.selectedProjectId(), id).pipe(
			notifyOnError(this.uiFacade),
			tap((enabled) => this.onCommandSuccess('restore', enabled)),
		);
	}

	public exportParticipant(participant: ParticipantModel): Observable<unknown> {
		return this.api.exportParticipantById(this.selectedProjectId(), participant.id).pipe(
			notifyOnError(this.uiFacade),
			tap((data) => this.browser.downloadJson(data, `registry-participant-${participant.id}.json`)),
		);
	}

	public hardDeleteParticipant(participant: ParticipantModel): Observable<void> {
		return this.api.hardDeleteParticipantById(undefined, participant.id).pipe(
			notifyOnError(this.uiFacade),
			tap(() => this.onCommandSuccess('hardDelete', participant)),
		);
	}

	private onCommandSuccess(command: CommandEvent, participant: ParticipantModel): void {
		this.onCommandSucceeded('participant', command, 'participants.notifications', {
			firstName: participant?.firstName,
			lastName: participant?.lastName,
		});

		this.store.fetchParticipantsPage({
			projectId: this.selectedProjectId(),
			...CumulativePageHelper.reloadRequest(this.participantsPage()),
		});
	}
}
