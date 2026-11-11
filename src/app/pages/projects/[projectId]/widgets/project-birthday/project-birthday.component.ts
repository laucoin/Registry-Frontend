import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { AgeHelper } from '@shared/helpers/age.helper';
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { WidgetStateHelper } from '@shared/helpers/widget-state.helper';
import { RefreshKindEnum } from '@shared/models/enumeration/refresh-kind.enum';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { WidgetCardComponent } from '@shared/ui/common/widget-card/widget-card.component';

import '@sgdf/ui/list';
import '@sgdf/ui/list-item';
import '@sgdf/ui/avatar';

const MAX_DISPLAYED = 5;

interface BirthdayView {
	total: number;
	rows: BirthdayRow[];
	remaining: number;
}

interface BirthdayRow {
	id: string;
	name: string;
	age: number | undefined;
	detail: string | undefined;
}

/**
 * Objectif: Affiche les participants dont c'est l'anniversaire aujourd'hui.
 * Périmètre: Charge les anniversaires du projet sélectionné, liste les premiers avec leur âge et leur groupe, et dit combien il y en a d'autres.
 * Limites: Lit uniquement la facade du projet sélectionné ; n'affiche que quelques lignes et ne renvoie vers aucune page.
 */
@Component({
	imports: [WidgetCardComponent, TranslocoPipe, PluralTranslationPipe],
	selector: 'app-project-birthday',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-birthday.component.css',
	templateUrl: './project-birthday.component.html',
})
export class ProjectBirthdayComponent implements OnInit {
	private readonly facade = inject(SelectedProjectFacade);

	private readonly autoRefresh = injectAutoRefresh('project-home/birthdays', RefreshKindEnum.DAY_BOUND, () =>
		this.facade.refreshParticipantsBirthdays(),
	);

	protected readonly loading = this.facade.participantsBirthdaysLoading;
	protected readonly state = computed(() => WidgetStateHelper.of(this.loading(), this.view()?.total));
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.participantsBirthdaysError;
	protected readonly view = computed(() => this.buildView(this.facade.participantsBirthdays()));

	public ngOnInit(): void {
		this.reload();
	}

	protected reload(): void {
		this.facade.fetchParticipantsBirthdays();
	}

	private buildView(birthdays: ParticipantModel[] | undefined): BirthdayView | undefined {
		if (!birthdays) return undefined;
		return {
			total: birthdays.length,
			rows: birthdays.slice(0, MAX_DISPLAYED).map((participant) => this.toRow(participant)),
			remaining: Math.max(0, birthdays.length - MAX_DISPLAYED),
		};
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
