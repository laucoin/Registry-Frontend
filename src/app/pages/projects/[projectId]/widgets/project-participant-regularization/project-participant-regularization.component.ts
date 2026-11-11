import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal, signal } from '@angular/core';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { OverdueParticipantsDialogComponent } from '@pages/projects/[projectId]/widgets/overdue-participants-dialog/overdue-participants-dialog.component';
import { RegularizationRowComponent } from '@pages/projects/[projectId]/widgets/regularization-row/regularization-row.component';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { WidgetStateHelper } from '@shared/helpers/widget-state.helper';
import { RefreshKindEnum } from '@shared/models/enumeration/refresh-kind.enum';
import { NotificationModel } from '@shared/models/model/notification.model';
import { WidgetCardComponent } from '@shared/ui/common/widget-card/widget-card.component';

import '@sgdf/ui/table-cell';
import '@sgdf/ui/table-row';
import '@sgdf/ui/button';
import '@sgdf/ui/list';
import '@sgdf/ui/list-item';
import '@sgdf/ui/avatar';

const PAGE_SIZE = 5;

/**
 * Objectif: Liste les participants dont la présence a dépassé la fin prévue et doit être régularisée.
 * Périmètre: Charge les premiers participants sur site au statut en dépassement, fin prévue la plus ancienne en premier, avec la durée de leur présence, et compte les autres.
 * Limites: N'affiche que quelques lignes et ouvre le dialogue qui les liste toutes ; lit uniquement la facade du projet sélectionné.
 */
@Component({
	imports: [
		WidgetCardComponent,
		TranslocoPipe,
		PluralTranslationPipe,
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
	private readonly facade = inject(SelectedProjectFacade);

	private readonly autoRefresh = injectAutoRefresh('project-home/overdue', RefreshKindEnum.DAY_BOUND, () =>
		this.facade.refreshOverdueParticipantsPage(),
	);

	protected readonly loading = this.facade.overdueParticipantsPageLoading;
	protected readonly state = computed(() => WidgetStateHelper.of(this.loading(), this.total()));
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.overdueParticipantsPageError;
	protected readonly total = computed(() => this.facade.overdueParticipantsPage()?.totalElements);
	protected readonly participants = computed(() => this.facade.overdueParticipantsPage()?.content ?? []);
	protected readonly remaining = computed(() => Math.max(0, (this.total() ?? 0) - this.participants().length));
	protected readonly listOpen = signal(false);

	public ngOnInit(): void {
		this.reload();
	}

	protected reload(): void {
		this.facade.fetchOverdueParticipantsPage(0, PAGE_SIZE);
	}
}
