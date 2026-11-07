import { computed, inject, Injectable, Signal } from '@angular/core';

import { Observable, tap } from 'rxjs';

import { GuestMovementDto } from '@pages/projects/[projectId]/movements/data/dto/guest-movement.dto';
import { MovementDto } from '@pages/projects/[projectId]/movements/data/dto/movement.dto';
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api';
import { MovementStore } from '@pages/projects/[projectId]/movements/data/state/movement.store';
import { DateHelper } from '@shared/helpers/date.helper';
import { CommandEvent } from '@shared/helpers/facade/command-event.service';
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { notifyOnError } from '@shared/helpers/rx.helper';
import { SearchParamsHelper } from '@shared/helpers/search/search-params.helper';
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { CommunicationModel } from '@shared/models/model/communication.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

/**
 * Purpose: Point d'entrée public du domaine des mouvements pour les pages, composants et guards.
 * Scope: Expose le store des mouvements sous forme de signals, relaie ses requêtes et exécute les commandes de mouvement avec leurs notifications.
 * Limits: Ne détient aucun état propre et ne construit aucune requête HTTP lui-même.
 */
@Injectable()
export class MovementFacade extends GenericProjectElementFacade {
	private readonly store: InstanceType<typeof MovementStore> = inject(MovementStore);

	private readonly api = inject(MovementApi);
	private readonly pluralTranslationPipe = inject(PluralTranslationPipe);
	private readonly datePipe = inject(DateFormatPipe);

	public readonly movementsPage: Signal<PageModel<MovementModel> | undefined> = this.store.movements.element;

	public readonly movementsPageLoading = this.store.movements.loading;

	public readonly movementsPageSilentLoading = this.store.movements.silentLoading;

	public readonly movementsPageError: Signal<NotificationModel | undefined> = this.store.movements.error;

	private readonly movementsPageResetSearch = this.store.movements.params.resetSearch;

	public readonly movementsPageTypeParam = this.store.movements.params.type;

	public readonly movementsPageSortParam = this.store.movements.params.sort;

	public readonly movementsPageFromParam = computed(() => DateHelper.buildDate(this.store.movements.params.from()));

	public readonly movementsPageToParam = computed(() => DateHelper.buildDate(this.store.movements.params.to()));

	public readonly movementsPageIsVisibleParam = this.store.movements.params.isVisible;

	public readonly movementCommunicationsPage: Signal<PageModel<CommunicationModel> | undefined> =
		this.store.movementCommunications.element;

	public readonly movementCommunicationsPageLoading = this.store.movementCommunications.loading;

	public readonly movementCommunicationsPageSilentLoading = this.store.movementCommunications.silentLoading;

	private readonly movementCommunicationsPageResetSearch = this.store.movementCommunications.params.resetSearch;

	public readonly searchedReasonAndActivityMetadata = this.store.metadata.searchedReasonsAndActivities;

	public readonly searchedParticipantAndGroupMetadata = this.store.metadata.searchedParticipantsAndGroups;

	public readonly searchedVehicleMetadata = this.store.metadata.searchedVehicles;

	public readonly movementTypesMetadata = this.store.metadata.types;

	public readonly visibilitiesMetadata: Signal<SelectOptionModel<boolean | undefined>[]> = computed(() =>
		this.store.metadata.visibilities().map((status) => ({
			...status,
			label: this.translateLabel(status.label),
		})),
	);

	public fetchMovementsPage(page: number | undefined, size: number | undefined): void {
		const index = this.movementsPageResetSearch() ? 0 : page;
		this.store.fetchMovementsPage({ projectId: this.selectedProjectId(), page: index, size: size });
	}

	public inputPageSearchParameters(
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
		this.store.updateMovementsPageSearchParams({
			...next,
			resetSearch: true,
			isCurrent: false,
			hasActivity: undefined,
		});
	}

	public fetchMovementCommunicationsPage(id: string, page: number | undefined, size: number | undefined): void {
		const index = this.movementCommunicationsPageResetSearch() ? 0 : page;
		this.store.fetchMovementCommunicationsPage({
			projectId: this.selectedProjectId(),
			id: id,
			page: index,
			size: size,
		});
	}

	public loadOlderMovementCommunications(id: string): void {
		const shown = this.movementCommunicationsPage();
		if (shown?.hasNext) {
			this.store.fetchMovementCommunicationsPage({
				projectId: this.selectedProjectId(),
				id: id,
				page: shown.page + 1,
				size: shown.size,
			});
		}
	}

	public reloadMovementCommunications(id: string): void {
		this.store.fetchMovementCommunicationsPage({
			projectId: this.selectedProjectId(),
			id: id,
			...CumulativePageHelper.reloadRequest(this.movementCommunicationsPage()),
		});
	}

	public searchReasonsAndActivities(
		q: string | undefined = undefined,
		type: string,
		contentType: ParticipantTypeEnum,
	): void {
		this.store.searchReasonsAndActivities({
			projectId: this.selectedProjectId(),
			q: q,
			type: type,
			contentType: contentType,
		});
	}

	public searchParticipantsAndGroups(
		contentType: ParticipantTypeEnum,
		q: string | undefined,
		at: Date,
		all = false,
	): void {
		this.store.searchParticipantsAndGroups({
			projectId: this.selectedProjectId(),
			contentType: contentType,
			q: q,
			at: at,
			all: all,
		});
	}

	public searchVehicles(q: string | undefined = undefined): void {
		this.store.searchVehicles({ projectId: this.selectedProjectId(), q: q });
	}

	public fetchMovementTypes(): void {
		if (this.movementTypesMetadata().length === 0) {
			this.store.fetchMovementTypes();
		}
	}

	public handleMovementFirstPageReload(): Observable<unknown> {
		return this.commandEvents.on('movement', 'create', 'hardDelete');
	}

	public handleMovementCurrentPageReload(): Observable<unknown> {
		return this.commandEvents.on('movement', 'update', 'softDelete', 'restore');
	}

	public fetchMovement(id: string): Observable<MovementModel> {
		return this.api.findMovementById(this.selectedProjectId(), id).pipe(notifyOnError(this.uiFacade));
	}

	public createRegisteredMovement(movement: MovementDto): Observable<MovementModel> {
		return this.api
			.createMovement(this.selectedProjectId(), movement)
			.pipe(tap((created) => this.onCommandSuccess('create', created)));
	}

	public updateRegisteredMovement(id: string, movement: MovementDto, ifMatch?: string): Observable<MovementModel> {
		return this.api
			.updateMovementById(this.selectedProjectId(), id, movement, ifMatch)
			.pipe(tap((updated) => this.onCommandSuccess('update', updated)));
	}

	public createGuestMovement(movement: GuestMovementDto): Observable<MovementModel> {
		return this.api
			.createGuestsMovement(this.selectedProjectId(), movement)
			.pipe(tap((created) => this.onCommandSuccess('create', created)));
	}

	public updateGuestMovement(id: string, movement: GuestMovementDto, ifMatch?: string): Observable<MovementModel> {
		return this.api
			.updateGuestsMovementById(this.selectedProjectId(), id, movement, ifMatch)
			.pipe(tap((updated) => this.onCommandSuccess('update', updated)));
	}

	public softDeleteMovement(id: string): Observable<MovementModel> {
		return this.api.softDeleteMovementById(this.selectedProjectId(), id).pipe(
			notifyOnError(this.uiFacade),
			tap((disabled) => this.onCommandSuccess('softDelete', disabled)),
		);
	}

	public restoreMovement(id: string): Observable<MovementModel> {
		return this.api.restoreMovementById(this.selectedProjectId(), id).pipe(
			notifyOnError(this.uiFacade),
			tap((enabled) => this.onCommandSuccess('restore', enabled)),
		);
	}

	public hardDeleteMovement(movement: MovementModel): Observable<void> {
		return this.api.hardDeleteMovementById(undefined, movement.id).pipe(
			notifyOnError(this.uiFacade),
			tap(() => this.onCommandSuccess('hardDelete', movement)),
		);
	}

	private onCommandSuccess(command: CommandEvent, movement: MovementModel): void {
		const prefix = `movements.notifications.${command === 'update' ? 'edit' : command}.${movement.type.value}`;
		this.notifyMessage(
			SeverityEnum.SUCCESS,
			`${prefix}.title`,
			command === 'create'
				? this.pluralTranslationPipe.transform(`${prefix}.message`, movement.content)
				: `${prefix}.message`,
			{
				datetime: this.datePipe.transform(movement?.dateTime, 'datetime'),
				participants: movement.content?.length ?? 0,
			},
		);
		this.commandEvents.emit('movement', command);

		this.reloadMovementsPage();
	}

	public reloadMovementsPage(): void {
		this.store.fetchMovementsPage({
			projectId: this.selectedProjectId(),
			...CumulativePageHelper.reloadRequest(this.movementsPage()),
		});
	}
}
