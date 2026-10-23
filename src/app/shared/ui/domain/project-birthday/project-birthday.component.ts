import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/tag'
import '@sgdf/ui/list'
import '@sgdf/ui/list-item'
import '@sgdf/ui/avatar'
import '@sgdf/ui/skeleton'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { AgeHelper } from '@shared/helpers/age.helper';
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';

const MAX_DISPLAYED: number = 5

interface BirthdayRow {
	id: string
	name: string
	age: number | undefined
	detail: string | undefined
}

/**
 * Purpose: Shows the participants whose birthday is today.
 * Scope: Loads the birthdays of the selected project, lists the first ones with their age and group, and says how many more there are.
 * Limits: Reads the selected project facade only; it shows no more than a few rows and links to no page.
 */
@Component({
	imports: [
		TranslocoPipe,
		PluralTranslationPipe,
		SectionErrorComponent
	],
	selector: 'app-project-birthday',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-birthday.component.css',
	templateUrl: './project-birthday.component.html',
})
export class ProjectBirthdayComponent implements OnInit {
	private readonly facade: SelectedProjectFacade = inject(SelectedProjectFacade)

	private readonly autoRefresh: void = injectAutoRefresh('project-home/birthdays', 'dayBound', (): void => this.facade.refreshParticipantsBirthdays())

	protected readonly loading: Signal<boolean> = this.facade.participantsBirthdaysLoading
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.participantsBirthdaysError
	protected readonly total: Signal<number | undefined> = computed((): number | undefined => this.facade.participantsBirthdays()?.length)
	protected readonly rows: Signal<BirthdayRow[]> = computed((): BirthdayRow[] =>
		(this.facade.participantsBirthdays() ?? []).slice(0, MAX_DISPLAYED).map((participant: ParticipantModel): BirthdayRow => this.toRow(participant)),
	)
	protected readonly remaining: Signal<number> = computed((): number => Math.max(0, (this.total() ?? 0) - MAX_DISPLAYED))
	protected readonly skeletonRows: readonly number[] = [1, 2, 3]

	public ngOnInit(): void {
		this.reload()
	}

	protected reload(): void {
		this.facade.fetchParticipantsBirthdays()
	}

	private toRow(participant: ParticipantModel): BirthdayRow {
		return {
			id: participant.id,
			name: MonitoringRowHelper.fullName(participant),
			age: AgeHelper.ageOn(participant.birthday, new Date()),
			detail: MonitoringRowHelper.participantDetail(participant),
		}
	}
}
