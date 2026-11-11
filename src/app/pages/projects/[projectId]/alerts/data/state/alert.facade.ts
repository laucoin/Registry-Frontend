import { computed, inject, Injectable, Signal } from '@angular/core';

import { Observable, tap } from 'rxjs';

import { AlertApi } from '@pages/projects/[projectId]/alerts/data/state/alert.api';
import { AlertStore } from '@pages/projects/[projectId]/alerts/data/state/alert.store';
import { DateHelper } from '@shared/helpers/date.helper';
import { CommandEvent } from '@shared/helpers/facade/command-event.service';
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade';
import { notifyOnError } from '@shared/helpers/rx.helper';
import { SearchParamsHelper } from '@shared/helpers/search/search-params.helper';
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper';
import { AlertDto } from '@shared/models/dto/alert.dto';
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum';
import { AlertModel } from '@shared/models/model/alert.model';
import { AlertStatisticsModel } from '@shared/models/model/alert-statistics.model';
import { CommunicationModel } from '@shared/models/model/communication.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

/**
 * Objectif: Point d'entrée public du domaine des alertes pour les pages, composants et guards.
 * Périmètre: Expose le store des alertes sous forme de signals, relaie ses requêtes et exécute les commandes d'alerte avec leurs notifications.
 * Limites: Ne détient aucun état propre et ne construit aucune requête HTTP lui-même.
 */
@Injectable()
export class AlertFacade extends GenericProjectElementFacade {
	private readonly store: InstanceType<typeof AlertStore> = inject(AlertStore);

	private readonly api = inject(AlertApi);

	public readonly alertsPage: Signal<PageModel<AlertModel> | undefined> = this.store.alerts.element;

	public readonly alertsPageLoading = this.store.alerts.loading;

	public readonly alertsPageSilentLoading = this.store.alerts.silentLoading;

	public readonly alertsPageError: Signal<NotificationModel | undefined> = this.store.alerts.error;

	private readonly alertsPageResetSearch = this.store.alerts.params.resetSearch;

	public readonly alertsPageQueryParam = this.store.alerts.params.q;

	public readonly alertsPageStatusParam = this.store.alerts.params.status;

	public readonly alertsPageIsVisibleParam = this.store.alerts.params.isVisible;

	public readonly alertsPageFromParam = computed(() => DateHelper.buildDate(this.store.alerts.params.from()));

	public readonly alertsPageToParam = computed(() => DateHelper.buildDate(this.store.alerts.params.to()));

	public readonly alertStatistics: Signal<AlertStatisticsModel | undefined> = this.store.statistics.element;

	public readonly alertStatisticsLoading = this.store.statistics.loading;

	public readonly alertStatisticsError: Signal<NotificationModel | undefined> = this.store.statistics.error;

	public readonly alertCommunicationsPage: Signal<PageModel<CommunicationModel> | undefined> =
		this.store.communications.element;

	public readonly alertCommunicationsPageLoading = this.store.communications.loading;

	public readonly alertCommunicationsPageSilentLoading = this.store.communications.silentLoading;

	public readonly visibilitiesMetadata: Signal<SelectOptionModel<boolean | undefined>[]> = computed(() =>
		this.store.metadata.visibilities().map((status) => ({
			...status,
			label: this.translateLabel(status.label),
		})),
	);

	public readonly alertCriticalityRule = computed(() => this.store.metadata.criticality()?.rule);

	public readonly alertStatusMetadata = this.store.metadata.status;

	public fetchAlertStatistics(): void {
		this.store.fetchAlertStatistics({ projectId: this.selectedProjectId() });
	}

	public reloadAlertStatistics(): void {
		this.store.reloadAlertStatistics({ projectId: this.selectedProjectId() });
	}

	public fetchAlertsPage(page: number | undefined, size: number | undefined): void {
		const index = this.alertsPageResetSearch() ? 0 : page;
		this.store.fetchAlertsPage({ projectId: this.selectedProjectId(), page: index, size: size });
	}

	public inputPageSearchParameters(
		q: string | undefined,
		status: string | undefined,
		isVisible: boolean | undefined,
		from: Date | undefined,
		to: Date | undefined,
		sort: string | undefined = undefined,
	): void {
		const next = {
			q,
			status,
			isVisible,
			from: DateHelper.toIsoInstant(from),
			to: DateHelper.toIsoInstant(to),
			sort,
		};
		if (!SearchParamsHelper.hasChanged(this.store.alerts.params(), next)) return;
		this.store.updateAlertsPageSearchParams({ ...next, resetSearch: true });
	}

	public fetchAlertCommunicationsPage(id: string, page: number | undefined, size: number | undefined): void {
		this.store.fetchAlertCommunicationsPage({
			projectId: this.selectedProjectId(),
			id: id,
			page: page,
			size: size,
		});
	}

	public loadOlderAlertCommunications(id: string): void {
		const shown = this.alertCommunicationsPage();
		if (shown?.hasNext) {
			this.store.fetchAlertCommunicationsPage({
				projectId: this.selectedProjectId(),
				id: id,
				page: shown.page + 1,
				size: shown.size,
			});
		}
	}

	public reloadAlertCommunications(id: string): void {
		this.store.fetchAlertCommunicationsPage({
			projectId: this.selectedProjectId(),
			id: id,
			...CumulativePageHelper.reloadRequest(this.alertCommunicationsPage()),
		});
	}

	public handleAlertCreation(): Observable<unknown> {
		return this.commandEvents.on('alert', 'create');
	}

	public createAlert(alert: AlertDto): Observable<AlertModel> {
		return this.api
			.createAlert(this.selectedProjectId(), alert)
			.pipe(tap((created) => this.onCommandSuccess('create', created)));
	}

	public softDeleteAlert(id: string): Observable<AlertModel> {
		return this.api.softDeleteAlertById(this.selectedProjectId(), id).pipe(
			notifyOnError(this.uiFacade),
			tap((disabled) => this.onCommandSuccess('softDelete', disabled)),
		);
	}

	public restoreAlert(id: string): Observable<AlertModel> {
		return this.api.restoreAlertById(this.selectedProjectId(), id).pipe(
			notifyOnError(this.uiFacade),
			tap((enabled) => this.onCommandSuccess('restore', enabled)),
		);
	}

	public hardDeleteAlert(alert: AlertModel): Observable<void> {
		return this.api.hardDeleteAlertById(undefined, alert.id).pipe(
			notifyOnError(this.uiFacade),
			tap(() => this.onCommandSuccess('hardDelete', alert)),
		);
	}

	public updateAlertStatus(id: string, status: AlertStatusEnum): Observable<AlertModel> {
		return this.api.updateAlertStatusById(this.selectedProjectId(), id, status).pipe(
			notifyOnError(this.uiFacade),
			tap((updated) => this.onCommandSuccess('status', updated)),
		);
	}

	private onCommandSuccess(command: CommandEvent, alert: AlertModel): void {
		this.onCommandSucceeded('alert', command, 'alerts.notifications', {
			title: alert?.title,
			status: alert?.status?.label,
		});

		this.reloadAlertsPage();
		if (this.alertStatistics()) {
			this.reloadAlertStatistics();
		}
	}

	public reloadAlertsPage(): void {
		this.store.fetchAlertsPage({
			projectId: this.selectedProjectId(),
			...CumulativePageHelper.reloadRequest(this.alertsPage()),
		});
	}
}
