import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/tag'
import '@sgdf/ui/button'
import '@sgdf/ui/callout'
import '@sgdf/ui/drawer'
import '@sgdf/ui/skeleton'
import { StringHelper } from '@shared/helpers/string.helper';
import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { DateHelper } from '@shared/helpers/date.helper';
import { EventHelper } from '@shared/helpers/event.helper';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { RouteHelper } from '@shared/helpers/route.helper';
import { AlertCriticalityEnum } from '@shared/models/enumeration/alert-criticality.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { AlertModel } from '@shared/models/model/alert.model';
import { IntervalModel } from '@shared/models/model/interval.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';
import { AlertCommunicationsListComponent } from '@shared/ui/domain/alert-communications-list/alert-communications-list.component';
import { CommunicationFormComponent } from '@shared/ui/domain/communication-form/communication-form.component';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';

type AlertVariant = 'danger' | 'warning' | 'info'

const PAGE_SIZE: number = 6

interface AlertCard {
	alert: AlertModel
	variant: AlertVariant
	age: IntervalModel | undefined
}

const VARIANTS: Record<AlertCriticalityEnum, AlertVariant> = {
	[AlertCriticalityEnum.HIGH]: 'danger',
	[AlertCriticalityEnum.REINFORCED]: 'warning',
	[AlertCriticalityEnum.RECENT]: 'info',
}

/**
 * Purpose: Shows the open alerts of the project, the most critical first, with their automatic criticality.
 * Scope: Loads the first open alerts, displays each with its criticality, age and last communication, and opens the communications of an alert in a drawer.
 * Limits: Shows no more than a few alerts and counts the others; reads the selected project and alert facades only.
 */
@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		TranslocoPipe,
		PluralTranslationPipe,
		DateFormatPipe,
		IntervalPipe,
		RouterLink,
		SectionErrorComponent,
		AlertCommunicationsListComponent,
		CommunicationFormComponent
	],
	selector: 'app-project-active-alert',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-active-alert.component.css',
	templateUrl: './project-active-alert.component.html',
})
export class ProjectActiveAlertComponent implements OnInit {
	private readonly facade: SelectedProjectFacade = inject(SelectedProjectFacade)

	private readonly autoRefresh: void = injectAutoRefresh('project-home/alerts', 'live', (): void => this.facade.refreshCurrentAlertsPage())
	private readonly sessionFacade: SessionFacade = inject(SessionFacade)
	protected readonly alertFacade: AlertFacade = inject(AlertFacade)
	protected readonly uiFacade: UiFacade = inject(UiFacade)

	protected readonly canCommunicate: Signal<boolean> = this.sessionFacade.selectedProjectHasOption(ProjectOptionEnum.COMMUNICATION)

	protected readonly loading: Signal<boolean> = this.facade.currentAlertsPageLoading
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.currentAlertsPageError
	protected readonly total: Signal<number | undefined> = computed((): number | undefined => this.facade.currentAlertsPage()?.totalElements)
	protected untitled(alert: AlertModel): boolean {
		return StringHelper.isNullOrBlank(alert.title);
	}

	protected readonly cards: Signal<AlertCard[]> = computed((): AlertCard[] =>
		(this.facade.currentAlertsPage()?.content ?? []).map((alert: AlertModel): AlertCard => this.toCard(alert)),
	)
	protected readonly remaining: Signal<number> = computed((): number => Math.max(0, (this.total() ?? 0) - this.cards().length))
	protected readonly alertsLink: Signal<string> = computed((): string =>
		RouteHelper.absolute(RegistryRouteEnum.PROJECTS_ALERTS).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
	)
	protected readonly communicating: WritableSignal<AlertModel | undefined> = signal(undefined)
	protected readonly skeletonCards: readonly number[] = [1, 2, 3]

	public ngOnInit(): void {
		this.reload()
	}

	protected reload(): void {
		this.facade.fetchCurrentAlertsPage(0, PAGE_SIZE)
	}

	protected closeCommunications(event: Event): void {
		if (EventHelper.isFromHost(event)) {
			this.communicating.set(undefined)
		}
	}

	private toCard(alert: AlertModel): AlertCard {
		return {
			alert,
			variant: VARIANTS[alert.criticality?.value as AlertCriticalityEnum] ?? 'info',
			age: DateHelper.buildDateInterval(alert.dateTime, new Date()),
		}
	}
}
