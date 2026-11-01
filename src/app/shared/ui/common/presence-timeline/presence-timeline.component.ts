import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, output, OutputEmitterRef, Signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import type { SgdfTimelineRange } from '@sgdf/ui/timeline'
import '@sgdf/ui/skeleton'
import '@sgdf/ui/timeline'
import { TimelineAxisModel, TimelineHelper } from '@shared/helpers/timeline.helper'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { OutingModel } from '@shared/models/model/outing.model'
import { TimelineRangeModel } from '@shared/models/model/timeline-range.model'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'

/**
 * Purpose: Affiche la frise prévue et la frise réelle d'une entité (participant, véhicule) sur la durée du projet.
 * Scope: Dessine deux `sgdf-timeline` sur l'axe du projet (ou, à défaut, sur l'étendue des données), gère le chargement et l'échec, et relaie la demande de nouvel essai.
 * Limits: Ne détient aucun état et ne charge rien ; la page fournit les données et décide de ce que fait un nouvel essai.
 */
@Component({
	selector: 'app-presence-timeline',
	imports: [TranslocoPipe, SectionErrorComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './presence-timeline.component.html',
})
export class PresenceTimelineComponent {
	public readonly planned: InputSignal<TimelineRangeModel[]> = input<TimelineRangeModel[]>([])
	public readonly actual: InputSignal<OutingModel[]> = input<OutingModel[]>([])
	public readonly projectBegin: InputSignal<CustomDatetimeModel | undefined> = input<CustomDatetimeModel | undefined>(undefined)
	public readonly projectEnd: InputSignal<CustomDatetimeModel | undefined> = input<CustomDatetimeModel | undefined>(undefined)
	public readonly loading: InputSignal<boolean> = input(false)
	public readonly error: InputSignal<NotificationModel | undefined> = input<NotificationModel | undefined>(undefined)

	public readonly retry: OutputEmitterRef<void> = output()

	private readonly transloco: TranslocoService = inject(TranslocoService)
	private readonly language: Signal<string> = toSignal(this.transloco.langChanges$, { initialValue: this.transloco.getActiveLang() })

	protected readonly axis: Signal<TimelineAxisModel | undefined> = computed((): TimelineAxisModel | undefined =>
		TimelineHelper.axis(this.projectBegin(), this.projectEnd(), this.planned(), this.actual()))

	protected readonly plannedRanges: Signal<SgdfTimelineRange[]> = computed((): SgdfTimelineRange[] => {
		const axis: TimelineAxisModel | undefined = this.axis()
		return axis ? TimelineHelper.plannedRanges(this.planned(), axis) : []
	})

	protected readonly actualRanges: Signal<SgdfTimelineRange[]> = computed((): SgdfTimelineRange[] =>
		TimelineHelper.outingRanges(this.actual(), (outing: OutingModel): string => this.ongoingLabel(outing)))

	private ongoingLabel(outing: OutingModel): string {
		const since: string = outing.start.toLocaleString(this.language(), { dateStyle: 'medium', timeStyle: 'short' })
		return this.transloco.translate('timeline.ongoing', { since })
	}
}
