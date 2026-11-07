import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { AgeHelper } from '@shared/helpers/age.helper';
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';
import { SkeletonListComponent } from '@shared/ui/common/skeleton-list/skeleton-list.component';

import '@sgdf/ui/table';
import '@sgdf/ui/table-row';
import '@sgdf/ui/table-cell';
import '@sgdf/ui/icon';
import '@sgdf/ui/tag';
import '@sgdf/ui/list';
import '@sgdf/ui/list-item';
import '@sgdf/ui/avatar';

const MAX_DISPLAYED = 5;

interface BirthdayRow {
	id: string;
	name: string;
	age: number | undefined;
	detail: string | undefined;
}

/**
 * Purpose: Affiche les participants dont c'est l'anniversaire aujourd'hui.
 * Scope: Charge les anniversaires du projet sélectionné, liste les premiers avec leur âge et leur groupe, et dit combien il y en a d'autres.
 * Limits: Lit uniquement la facade du projet sélectionné ; n'affiche que quelques lignes et ne renvoie vers aucune page.
 */
@Component({
	imports: [SkeletonListComponent, TranslocoPipe, PluralTranslationPipe, SectionErrorComponent],
	selector: 'app-project-birthday',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-birthday.component.css',
	templateUrl: './project-birthday.component.html',
})
export class ProjectBirthdayComponent implements OnInit {
	private readonly facade = inject(SelectedProjectFacade);

	private readonly autoRefresh = injectAutoRefresh('project-home/birthdays', 'dayBound', () =>
		this.facade.refreshParticipantsBirthdays(),
	);

	protected readonly loading = this.facade.participantsBirthdaysLoading;
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.participantsBirthdaysError;
	protected readonly total = computed(() => this.facade.participantsBirthdays()?.length);
	protected readonly rows = computed(() =>
		(this.facade.participantsBirthdays() ?? [])
			.slice(0, MAX_DISPLAYED)
			.map((participant) => this.toRow(participant)),
	);
	protected readonly remaining = computed(() => Math.max(0, (this.total() ?? 0) - MAX_DISPLAYED));

	public ngOnInit(): void {
		this.reload();
	}

	protected reload(): void {
		this.facade.fetchParticipantsBirthdays();
	}

	private toRow(participant: ParticipantModel): BirthdayRow {
		return {
			id: participant.id,
			name: MonitoringRowHelper.fullName(participant),
			age: AgeHelper.ageOn(participant.birthday, new Date()),
			detail: MonitoringRowHelper.participantDetail(participant),
		};
	}
}
