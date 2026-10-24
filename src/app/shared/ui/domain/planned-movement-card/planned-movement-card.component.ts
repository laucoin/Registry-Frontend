import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/tag'
import '@sgdf/ui/list'
import '@sgdf/ui/list-item'
import '@sgdf/ui/avatar'
import '@sgdf/ui/skeleton'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, output, OutputEmitterRef, Signal } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import { MovementPrefillService } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-prefill.service';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';

const MAX_DISPLAYED: number = 5

interface PlannedMovementRow {
	movement: PlannedMovementModel
	key: string
	title: string
	count: number
	detail: string | undefined
	time: CustomDatetimeModel | undefined
}

/**
 * Purpose: Card listing the movements planned for the day, used for the arrivals and for the departures.
 * Scope: Displays the first planned movements with who is concerned, how many people and at what time, plus the loading, error and empty states.
 * Limits: Holds no data and loads nothing; the parent feeds the movements and reacts to the retry. A click on a row opens the movement form prefilled with that movement.
 */
@Component({
	imports: [
		TranslocoPipe,
		PluralTranslationPipe,
		CustomDateFormatPipe,
		SectionErrorComponent
	],
	selector: 'app-planned-movement-card',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	templateUrl: './planned-movement-card.component.html',
})
export class PlannedMovementCardComponent {
	private readonly prefillService: MovementPrefillService = inject(MovementPrefillService)

	protected readonly clickable: Signal<boolean> = this.prefillService.canCreate
	public readonly movements: InputSignal<PlannedMovementModel[] | undefined> = input.required<PlannedMovementModel[] | undefined>()
	public readonly loading: InputSignal<boolean> = input.required<boolean>()
	public readonly error: InputSignal<NotificationModel | undefined> = input.required<NotificationModel | undefined>()
	public readonly titleKey: InputSignal<string> = input.required<string>()
	public readonly totalKey: InputSignal<string> = input.required<string>()
	public readonly emptyKey: InputSignal<string> = input.required<string>()
	public readonly icon: InputSignal<string> = input.required<string>()
	public readonly rowIcon: InputSignal<string> = input.required<string>()
	public readonly rowVariant: InputSignal<'success' | 'warning'> = input<'success' | 'warning'>('success')
	public readonly retry: OutputEmitterRef<void> = output<void>()

	protected readonly skeletonRows: readonly number[] = [1, 2, 3]
	protected readonly total: Signal<number | undefined> = computed((): number | undefined => this.movements()?.length)
	protected readonly rows: Signal<PlannedMovementRow[]> = computed((): PlannedMovementRow[] =>
		(this.movements() ?? []).slice(0, MAX_DISPLAYED).map((movement: PlannedMovementModel, index: number): PlannedMovementRow => this.toRow(movement, index)),
	)
	protected readonly remaining: Signal<number> = computed((): number => Math.max(0, (this.total() ?? 0) - MAX_DISPLAYED))

	protected open(movement: PlannedMovementModel): void {
		this.prefillService.openPlanned(movement)
	}

	private toRow(movement: PlannedMovementModel, index: number): PlannedMovementRow {
		const first: ParticipantModel | undefined = movement.participants[0]
		const single: boolean = !movement.poolName && movement.participants.length === 1 && !!first
		return {
			movement,
			key: `${index}-${movement.poolName || first?.id || ''}`,
			title: movement.poolName || (first ? MonitoringRowHelper.fullName(first) : ''),
			count: movement.participants.length,
			detail: single ? [movement.reason?.label, first!.type?.label].filter(Boolean).join(' · ') : movement.reason?.label,
			time: movement.plannedAt ? { date: undefined, time: movement.plannedAt.time } : undefined,
		}
	}
}
