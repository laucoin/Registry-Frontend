import {
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	inject,
	OnInit,
	Signal,
	signal,
	WritableSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import type { SgdfStatusVariant } from '@sgdf/ui';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import {
	ActiveAlertCardComponent,
	AlertCard,
} from '@pages/projects/[projectId]/widgets/project-active-alert/active-alert-card/active-alert-card.component';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { DateHelper } from '@shared/helpers/date.helper';
import { EventHelper } from '@shared/helpers/event.helper';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { RouteHelper } from '@shared/helpers/route.helper';
import { WidgetStateHelper } from '@shared/helpers/widget-state.helper';
import { AlertCriticalityEnum } from '@shared/models/enumeration/alert-criticality.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { RefreshKindEnum } from '@shared/models/enumeration/refresh-kind.enum';
import { AlertModel } from '@shared/models/model/alert.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { WidgetCardComponent } from '@shared/ui/common/widget-card/widget-card.component';
import { AlertCommunicationsListComponent } from '@shared/ui/domain/alert-communications-list/alert-communications-list.component';
import { CommunicationFormComponent } from '@shared/ui/domain/communication-form/communication-form.component';

import '@sgdf/ui/table-row';
import '@sgdf/ui/table-cell';
import '@sgdf/ui/button';
import '@sgdf/ui/drawer';
import '@sgdf/ui/skeleton';

const PAGE_SIZE = 6;

const VARIANTS: Record<AlertCriticalityEnum, SgdfStatusVariant> = {
	[AlertCriticalityEnum.HIGH]: 'danger',
	[AlertCriticalityEnum.REINFORCED]: 'warning',
	[AlertCriticalityEnum.RECENT]: 'info',
};

/**
 * Objectif: Affiche les alertes ouvertes du projet, les plus critiques en premier, avec leur criticité automatique.
 * Périmètre: Charge les premières alertes ouvertes, affiche chacune avec sa criticité, son ancienneté et sa dernière communication, et ouvre les communications d'une alerte dans un tiroir.
 * Limites: N'affiche que quelques alertes et compte les autres ; lit uniquement les facades du projet sélectionné et des alertes.
 */
@Component({
	imports: [
		TranslocoPipe,
		PluralTranslationPipe,
		ActiveAlertCardComponent,
		RouterLink,
		WidgetCardComponent,
		AlertCommunicationsListComponent,
		CommunicationFormComponent,
	],
	selector: 'app-project-active-alert',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	templateUrl: './project-active-alert.component.html',
})
export class ProjectActiveAlertComponent implements OnInit {
	private readonly facade = inject(SelectedProjectFacade);

	private readonly autoRefresh = injectAutoRefresh('project-home/alerts', RefreshKindEnum.LIVE, () =>
		this.facade.refreshCurrentAlertsPage(),
	);
	private readonly sessionFacade = inject(SessionFacade);
	protected readonly alertFacade = inject(AlertFacade);
	protected readonly uiFacade = inject(UiFacade);

	protected readonly canCommunicate = this.sessionFacade.selectedProjectHasOption(ProjectOptionEnum.COMMUNICATION);

	protected readonly loading = this.facade.currentAlertsPageLoading;
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.currentAlertsPageError;
	protected readonly total = computed(() => this.facade.currentAlertsPage()?.totalElements);
	protected readonly state = computed(() => WidgetStateHelper.of(this.loading(), this.total()));
	protected readonly cards = computed(() =>
		(this.facade.currentAlertsPage()?.content ?? []).map((alert) => this.toCard(alert)),
	);
	protected readonly remaining = computed(() => Math.max(0, (this.total() ?? 0) - this.cards().length));
	protected readonly alertsLink = computed(
		() => `/${RouteHelper.withProjectId(RegistryRouteEnum.PROJECTS_ALERTS, this.sessionFacade.currentProjectId())}`,
	);
	protected readonly communicating: WritableSignal<AlertModel | undefined> = signal(undefined);
	protected readonly skeletonCards: readonly number[] = [1, 2, 3];

	public ngOnInit(): void {
		this.reload();
	}

	protected reload(): void {
		this.facade.fetchCurrentAlertsPage(0, PAGE_SIZE);
	}

	protected closeCommunications(event: Event): void {
		if (EventHelper.isFromHost(event)) {
			this.communicating.set(undefined);
		}
	}

	private toCard(alert: AlertModel): AlertCard {
		return {
			alert,
			variant: VARIANTS[alert.criticality?.value as AlertCriticalityEnum] ?? 'info',
			age: DateHelper.buildDateInterval(alert.dateTime, new Date()),
		};
	}
}
