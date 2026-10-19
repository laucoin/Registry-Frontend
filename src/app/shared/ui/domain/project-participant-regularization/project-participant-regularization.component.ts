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
import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';
import { OverdueParticipantsDialogComponent } from '@shared/ui/domain/overdue-participants-dialog/overdue-participants-dialog.component';
import { RegularizationRowComponent } from '@shared/ui/domain/regularization-row/regularization-row.component';

const PAGE_SIZE: number = 5

/**
 * Purpose: Lists the participants whose presence went past the planned end and needs regularizing.
 * Scope: Loads the first on-site participants in the overdue status, earliest planned end first, with how long they have been present, and counts the others.
 * Limits: Shows no more than a few rows and opens the dialog listing all of them; reads the selected project facade only.
 */
@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		TranslocoPipe,
		PluralTranslationPipe,
		SectionErrorComponent,
		RegularizationRowComponent,
		OverdueParticipantsDialogComponent,
	],
	selector: 'app-project-participant-regularization',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-participant-regularization.component.css',
	templateUrl: './project-participant-regularization.component.html',
})
export class ProjectParticipantRegularizationComponent implements OnInit {
	private readonly facade: SelectedProjectFacade = inject(SelectedProjectFacade)

	protected readonly loading: Signal<boolean> = this.facade.overdueParticipantsPageLoading
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.overdueParticipantsPageError
	protected readonly total: Signal<number | undefined> = computed((): number | undefined => this.facade.overdueParticipantsPage()?.totalElements)
	protected readonly participants: Signal<ParticipantModel[]> = computed((): ParticipantModel[] => this.facade.overdueParticipantsPage()?.content ?? [])
	protected readonly remaining: Signal<number> = computed((): number => Math.max(0, (this.total() ?? 0) - this.participants().length))
	protected readonly listOpen: WritableSignal<boolean> = signal(false)
	protected readonly skeletonRows: readonly number[] = [1, 2, 3]

	public ngOnInit(): void {
		this.reload()
	}

	protected reload(): void {
		this.facade.fetchOverdueParticipantsPage(0, PAGE_SIZE)
	}
}
