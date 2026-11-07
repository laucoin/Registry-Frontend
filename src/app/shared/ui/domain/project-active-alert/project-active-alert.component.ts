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

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { DateHelper } from '@shared/helpers/date.helper';
import { EventHelper } from '@shared/helpers/event.helper';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { RouteHelper } from '@shared/helpers/route.helper';
import { StringHelper } from '@shared/helpers/string.helper';
import { AlertCriticalityEnum } from '@shared/models/enumeration/alert-criticality.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { AlertModel } from '@shared/models/model/alert.model';
import { IntervalModel } from '@shared/models/model/interval.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';
import { AlertCommunicationsListComponent } from '@shared/ui/domain/alert-communications-list/alert-communications-list.component';
import { CommunicationFormComponent } from '@shared/ui/domain/communication-form/communication-form.component';

import '@sgdf/ui/table';
import '@sgdf/ui/table-row';
import '@sgdf/ui/table-cell';
import '@sgdf/ui/icon';
import '@sgdf/ui/tag';
import '@sgdf/ui/button';
import '@sgdf/ui/callout';
import '@sgdf/ui/drawer';
import '@sgdf/ui/skeleton';

type AlertVariant = 'danger' | 'warning' | 'info';

const PAGE_SIZE = 6;

interface AlertCard {
	alert: AlertModel;
	variant: AlertVariant;
	age: IntervalModel | undefined;
}

const VARIANTS: Record<AlertCriticalityEnum, AlertVariant> = {
	[AlertCriticalityEnum.HIGH]: 'danger',
	[AlertCriticalityEnum.REINFORCED]: 'warning',
	[AlertCriticalityEnum.RECENT]: 'info',
};

/**
 * Purpose: Affiche les alertes ouvertes du projet, les plus critiques en premier, avec leur criticité automatique.
 * Scope: Charge les premières alertes ouvertes, affiche chacune avec sa criticité, son ancienneté et sa dernière communication, et ouvre les communications d'une alerte dans un tiroir.
 * Limits: N'affiche que quelques alertes et compte les autres ; lit uniquement les facades du projet sélectionné et des alertes.
 */
@Component({
	imports: [
		TranslocoPipe,
		PluralTranslationPipe,
		DateFormatPipe,
		IntervalPipe,
		RouterLink,
		SectionErrorComponent,
		AlertCommunicationsListComponent,
		CommunicationFormComponent,
	],
	selector: 'app-project-active-alert',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-active-alert.component.css',
	templateUrl: './project-active-alert.component.html',
})
export class ProjectActiveAlertComponent implements OnInit {
	private readonly facade = inject(SelectedProjectFacade);

	private readonly autoRefresh = injectAutoRefresh('project-home/alerts', 'live', () =>
		this.facade.refreshCurrentAlertsPage(),
	);
	private readonly sessionFacade = inject(SessionFacade);
	protected readonly alertFacade = inject(AlertFacade);
	protected readonly uiFacade = inject(UiFacade);

	protected readonly canCommunicate = this.sessionFacade.selectedProjectHasOption(ProjectOptionEnum.COMMUNICATION);

	protected readonly loading = this.facade.currentAlertsPageLoading;
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.currentAlertsPageError;
	protected readonly total = computed(() => this.facade.currentAlertsPage()?.totalElements);
	protected untitled(alert: AlertModel): boolean {
		return StringHelper.isNullOrBlank(alert.title);
	}

	protected readonly cards = computed(() =>
		(this.facade.currentAlertsPage()?.content ?? []).map((alert) => this.toCard(alert)),
	);
	protected readonly remaining = computed(() => Math.max(0, (this.total() ?? 0) - this.cards().length));
	protected readonly alertsLink = computed(() =>
		RouteHelper.absolute(RegistryRouteEnum.PROJECTS_ALERTS).replace(
			':projectId',
			this.sessionFacade.currentProjectId() ?? '',
		),
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
