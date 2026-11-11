import { computed, inject, Injectable, Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

import { Observable, tap } from 'rxjs';

import { CommunicationApi } from '@pages/projects/[projectId]/movements/communication/data/state/communication.api';
import { CommunicationStore } from '@pages/projects/[projectId]/movements/communication/data/state/communication.store';
import { AlertHelper } from '@shared/helpers/alert.helper';
import { CommandEvent } from '@shared/helpers/facade/command-event.service';
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade';
import { MovementHelper } from '@shared/helpers/movement.helper';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { notifyOnError } from '@shared/helpers/rx.helper';
import { SectionErrorsHelper } from '@shared/helpers/store/section-errors.helper';
import { CommunicationDto } from '@shared/models/dto/communication.dto';
import { DateFormatTypeEnum } from '@shared/models/enumeration/date-format-type.enum';
import { CommunicationModel } from '@shared/models/model/communication.model';
import { NotificationModel } from '@shared/models/model/notification.model';

/**
 * Objectif: Point d'entrée public du domaine des communications pour les pages, composants et guards.
 * Périmètre: Expose le store des communications sous forme de signals, relaie ses requêtes et exécute les commandes de communication avec leurs notifications.
 * Limites: Ne détient aucun état propre et ne construit aucune requête HTTP lui-même.
 */
@Injectable()
export class CommunicationFacade extends GenericProjectElementFacade {
	private readonly store: InstanceType<typeof CommunicationStore> = inject(CommunicationStore);

	private readonly api = inject(CommunicationApi);
	private readonly datePipe = inject(DateFormatPipe);

	public readonly metadataErrors: Signal<Record<string, NotificationModel | undefined>> =
		SectionErrorsHelper.metadata(this.store.sectionErrors);

	public readonly communicationError: Signal<NotificationModel | undefined> = this.store.communication.error;

	public readonly communication: Signal<CommunicationModel | undefined> = this.store.communication.element;

	public readonly communication$ = toObservable(this.communication);

	public readonly communicationLoading = this.store.communication.loading;

	public readonly searchedMovementsMetadata = computed(() =>
		this.store.metadata
			.searchedMovements()
			.map((movement) => MovementHelper.toActivitySelectItem(movement, this.datePipe)),
	);

	public readonly searchedAlertsMetadata = computed(() =>
		this.store.metadata.searchedAlerts().map((alert) => AlertHelper.toSelectItem(alert, this.datePipe)),
	);

	public fetchCommunication(id: string): void {
		this.store.fetchCommunication({ projectId: this.selectedProjectId(), id: id });
	}

	public searchMovements(q: string | undefined = undefined): void {
		this.store.searchMovements({ projectId: this.selectedProjectId(), q: q });
	}

	public searchAlerts(q: string | undefined = undefined): void {
		this.store.searchAlerts({ projectId: this.selectedProjectId(), q: q });
	}

	public resetCommunication(): void {
		this.store.resetCommunication();
	}

	public handleCommunicationFirstPageReload(): Observable<unknown> {
		return this.commandEvents.on('communication', 'create', 'hardDelete');
	}

	public handleCommunicationCurrentPageReload(): Observable<unknown> {
		return this.commandEvents.on('communication', 'update', 'softDelete', 'restore');
	}

	public createCommunication(communication: CommunicationDto): Observable<CommunicationModel> {
		return this.api
			.createCommunication(this.selectedProjectId(), communication)
			.pipe(tap((created) => this.onCommandSuccess('create', created)));
	}

	public updateCommunication(
		id: string,
		communication: CommunicationDto,
		ifMatch?: string,
	): Observable<CommunicationModel> {
		return this.api
			.updateCommunicationById(this.selectedProjectId(), id, communication, ifMatch)
			.pipe(tap((updated) => this.onCommandSuccess('update', updated)));
	}

	public softDeleteCommunication(id: string): Observable<CommunicationModel> {
		return this.api.softDeleteCommunicationById(this.selectedProjectId(), id).pipe(
			notifyOnError(this.uiFacade),
			tap((disabled) => this.onCommandSuccess('softDelete', disabled)),
		);
	}

	public restoreCommunication(id: string): Observable<CommunicationModel> {
		return this.api.restoreCommunicationById(this.selectedProjectId(), id).pipe(
			notifyOnError(this.uiFacade),
			tap((enabled) => this.onCommandSuccess('restore', enabled)),
		);
	}

	public hardDeleteCommunication(communication: CommunicationModel): Observable<void> {
		return this.api.hardDeleteCommunicationById(undefined, communication.id).pipe(
			notifyOnError(this.uiFacade),
			tap(() => this.onCommandSuccess('hardDelete', communication)),
		);
	}

	// Créer ou modifier une communication est silencieux (le formulaire se réinitialise de lui-même) ; les autres commandes notifient.
	private onCommandSuccess(command: CommandEvent, communication: CommunicationModel): void {
		if (command !== 'create' && command !== 'update') {
			this.onCommandSucceeded('communication', command, 'communications.notifications', {
				datetime: this.datePipe.transform(communication?.dateTime, DateFormatTypeEnum.DATETIME),
			});
		} else {
			this.commandEvents.emit('communication', command);
		}
	}
}
