import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, output } from '@angular/core';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import type { SgdfStatusVariant } from '@sgdf/ui';

import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper';
import { MovementPrefillService } from '@shared/helpers/movement-prefill.service';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { WidgetStateHelper } from '@shared/helpers/widget-state.helper';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model';
import { WidgetCardComponent } from '@shared/ui/common/widget-card/widget-card.component';

import '@sgdf/ui/icon';
import '@sgdf/ui/list';
import '@sgdf/ui/list-item';
import '@sgdf/ui/avatar';

const MAX_DISPLAYED = 5;

interface PlannedMovementRow {
	movement: PlannedMovementModel;
	key: string;
	title: string;
	count: number;
	detail: string | undefined;
	time: CustomDatetimeModel | undefined;
	href: string | undefined;
}

interface PlannedMovementView {
	rows: PlannedMovementRow[];
	remaining: number;
}

function titleOf(movement: PlannedMovementModel, first: ParticipantModel | undefined): string {
	return movement.poolName || (first ? MonitoringRowHelper.fullName(first) : '');
}

function detailOf(movement: PlannedMovementModel, first: ParticipantModel | undefined): string | undefined {
	const reason = movement.reason?.label;
	if (movement.poolName || movement.participants.length !== 1 || !first) return reason;
	return [reason, first.type?.label].filter(Boolean).join(' · ');
}

function timeOf(movement: PlannedMovementModel): CustomDatetimeModel | undefined {
	return movement.plannedAt ? { date: undefined, time: movement.plannedAt.time } : undefined;
}

/**
 * Objectif: Carte listant les mouvements prévus pour la journée, utilisée pour les arrivées et pour les départs.
 * Périmètre: Affiche les premiers mouvements prévus avec les personnes concernées, leur nombre et l'heure, ainsi que les états de chargement, d'erreur et de vide.
 * Limites: Ne détient aucune donnée et ne charge rien ; le parent fournit les mouvements et réagit au nouvel essai. Un clic sur une ligne ouvre le formulaire de mouvement prérempli avec ce mouvement.
 */
@Component({
	imports: [WidgetCardComponent, TranslocoPipe, PluralTranslationPipe, CustomDateFormatPipe],
	selector: 'app-planned-movement-card',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	templateUrl: './planned-movement-card.component.html',
})
export class PlannedMovementCardComponent {
	private readonly prefillService = inject(MovementPrefillService);

	public readonly movements = input.required<PlannedMovementModel[] | undefined>();
	public readonly loading = input.required<boolean>();
	public readonly error = input.required<NotificationModel | undefined>();
	public readonly titleKey = input.required<string>();
	public readonly totalKey = input.required<string>();
	public readonly emptyKey = input.required<string>();
	public readonly icon = input.required<string>();
	public readonly rowIcon = input.required<string>();
	public readonly rowVariant: InputSignal<SgdfStatusVariant> = input<SgdfStatusVariant>('success');
	public readonly retry = output();

	protected readonly total = computed(() => this.movements()?.length);
	protected readonly state = computed(() => WidgetStateHelper.of(this.loading(), this.total()));
	protected readonly view = computed(() => this.buildView());

	protected navigate(event: Event, movement: PlannedMovementModel): void {
		event.preventDefault();
		this.prefillService.openPlanned(movement);
	}

	private buildView(): PlannedMovementView | undefined {
		const movements = this.movements();
		if (!movements) return undefined;
		return {
			rows: movements.slice(0, MAX_DISPLAYED).map((movement, index) => this.toRow(movement, index)),
			remaining: Math.max(0, movements.length - MAX_DISPLAYED),
		};
	}

	private toRow(movement: PlannedMovementModel, index: number): PlannedMovementRow {
		const first: ParticipantModel | undefined = movement.participants[0];
		return {
			movement,
			key: `${index}-${movement.poolName || first?.id || ''}`,
			title: titleOf(movement, first),
			count: movement.participants.length,
			detail: detailOf(movement, first),
			time: timeOf(movement),
			href: this.prefillService.creationUrl(movement.contentType),
		};
	}
}
