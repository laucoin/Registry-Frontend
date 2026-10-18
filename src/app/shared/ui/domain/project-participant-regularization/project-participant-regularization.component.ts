import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/tag'
import '@sgdf/ui/button'
import '@sgdf/ui/list'
import '@sgdf/ui/list-item'
import '@sgdf/ui/avatar'
import '@sgdf/ui/skeleton'
import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionFacade } from '@core/registry/state/session.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { DateHelper } from '@shared/helpers/date.helper';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper';
import { RouteHelper } from '@shared/helpers/route.helper';
import { IntervalModel } from '@shared/models/model/interval.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';

const PAGE_SIZE: number = 5

interface RegularizationRow {
	participant: ParticipantModel
	name: string
	since: IntervalModel | undefined
}

/**
 * Purpose: Lists the participants whose presence went past the planned end and needs regularizing.
 * Scope: Loads the first on-site participants in the overdue status, earliest planned end first, with how long they have been present, and counts the others.
 * Limits: Shows no more than a few rows; reads the selected project facade only.
 */
@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		TranslocoPipe,
		PluralTranslationPipe,
		CustomDateFormatPipe,
		IntervalPipe,
		RouterLink,
		SectionErrorComponent
	],
	selector: 'app-project-participant-regularization',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-participant-regularization.component.css',
	templateUrl: './project-participant-regularization.component.html',
})
export class ProjectParticipantRegularizationComponent implements OnInit {
	private readonly facade: SelectedProjectFacade = inject(SelectedProjectFacade)
	private readonly sessionFacade: SessionFacade = inject(SessionFacade)

	protected readonly loading: Signal<boolean> = this.facade.overdueParticipantsPageLoading
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.overdueParticipantsPageError
	protected readonly total: Signal<number | undefined> = computed((): number | undefined => this.facade.overdueParticipantsPage()?.totalElements)
	protected readonly rows: Signal<RegularizationRow[]> = computed((): RegularizationRow[] =>
		(this.facade.overdueParticipantsPage()?.content ?? []).map((participant: ParticipantModel): RegularizationRow => this.toRow(participant)),
	)
	protected readonly remaining: Signal<number> = computed((): number => Math.max(0, (this.total() ?? 0) - this.rows().length))
	protected readonly participantsLink: Signal<string> = computed((): string =>
		RouteHelper.absolute(RegistryRouteEnum.PROJECTS_PARTICIPANTS).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
	)
	protected readonly skeletonRows: readonly number[] = [1, 2, 3]

	public ngOnInit(): void {
		this.reload()
	}

	protected reload(): void {
		this.facade.fetchOverdueParticipantsPage(0, PAGE_SIZE)
	}

	private toRow(participant: ParticipantModel): RegularizationRow {
		return {
			participant,
			name: MonitoringRowHelper.fullName(participant),
			since: DateHelper.buildDateInterval(participant.effectiveArrival, new Date()),
		}
	}
}
