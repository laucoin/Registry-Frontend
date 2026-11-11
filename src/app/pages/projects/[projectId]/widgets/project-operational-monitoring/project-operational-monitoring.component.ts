import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { SessionFacade } from '@core/registry/state/session.facade';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { MonitoringTabEnum } from '@shared/models/enumeration/monitoring-tab.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { RefreshKindEnum } from '@shared/models/enumeration/refresh-kind.enum';
import { MovementModel } from '@shared/models/model/movement.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component';

import '@sgdf/ui/table';
import '@sgdf/ui/table-row';
import '@sgdf/ui/table-cell';
import '@sgdf/ui/icon';
import '@sgdf/ui/tab-group';
import '@sgdf/ui/badge';
import '@sgdf/ui/list-item';

interface MonitoringTab {
	key: MonitoringTabEnum;
	page: Signal<PageModel<MovementModel> | undefined>;
	loading: Signal<boolean>;
	silentLoading: Signal<boolean>;
	error: Signal<NotificationModel | undefined>;
	fetch: (page: number | undefined, size: number | undefined) => void;
	refresh: () => void;
}

/**
 * Objectif: Suit ce qui se passe sur le projet via les mouvements en cours avec une activité et les autres.
 * Périmètre: Charge d'un coup le premier lot de chaque onglet pour que les compteurs et les listes soient prêts à l'affichage d'un onglet, puis laisse la liste en charger davantage. Sans l'option activité, seuls restent les autres mouvements, affichés comme une seule liste au lieu d'un onglet.
 * Limites: Les statuts des participants, des groupes et des véhicules vivent dans leurs propres pages ; lit uniquement la facade du projet sélectionné.
 */
@Component({
	imports: [TranslocoPipe, NgTemplateOutlet, ListComponent, RegistryTemplateDirective, MovementElementComponent],
	selector: 'app-project-operational-monitoring',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-operational-monitoring.component.css',
	templateUrl: './project-operational-monitoring.component.html',
})
export class ProjectOperationalMonitoringComponent {
	private static readonly PAGE_SIZE: number = 10;

	private readonly facade = inject(SelectedProjectFacade);

	private readonly sessionFacade = inject(SessionFacade);

	private readonly hasActivityOption = this.sessionFacade.selectedProjectHasOption(ProjectOptionEnum.ACTIVITY);

	private readonly activitiesTab: MonitoringTab = {
		key: MonitoringTabEnum.ACTIVITIES,
		page: this.facade.currentMovementsPageWithActivity,
		loading: this.facade.currentMovementsPageWithActivityLoading,
		silentLoading: this.facade.currentMovementsPageWithActivitySilentLoading,
		error: this.facade.currentMovementsPageWithActivityError,
		fetch: (page: number | undefined, size: number | undefined) =>
			this.facade.fetchCurrentMovementsPageWithActivity(page, size),
		refresh: () => this.facade.refreshCurrentMovementsPageWithActivity(),
	};

	private readonly otherMovementsTab: MonitoringTab = {
		key: MonitoringTabEnum.OTHER_MOVEMENTS,
		page: this.facade.currentMovementsPageWithoutActivity,
		loading: this.facade.currentMovementsPageWithoutActivityLoading,
		silentLoading: this.facade.currentMovementsPageWithoutActivitySilentLoading,
		error: this.facade.currentMovementsPageWithoutActivityError,
		fetch: (page: number | undefined, size: number | undefined) =>
			this.facade.fetchCurrentMovementsPageWithoutActivity(page, size),
		refresh: () => this.facade.refreshCurrentMovementsPageWithoutActivity(),
	};

	protected readonly tabs: Signal<MonitoringTab[]> = computed((): MonitoringTab[] =>
		this.hasActivityOption() ? [this.activitiesTab, this.otherMovementsTab] : [this.otherMovementsTab],
	);

	private readonly autoRefresh = injectAutoRefresh('project-home/movements', RefreshKindEnum.LIVE, () =>
		this.tabs().forEach((tab: MonitoringTab) => tab.refresh()),
	);

	constructor() {
		toObservable(this.tabs)
			.pipe(takeUntilDestroyed())
			.subscribe((tabs: MonitoringTab[]) =>
				tabs.forEach((tab: MonitoringTab) =>
					tab.fetch(undefined, ProjectOperationalMonitoringComponent.PAGE_SIZE),
				),
			);
	}

	protected loadBatch(tab: MonitoringTab, event: PageEventModel): void {
		tab.fetch(event.page, event.size);
	}
}
