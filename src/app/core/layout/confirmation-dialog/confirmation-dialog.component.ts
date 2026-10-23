import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal } from '@angular/core'
import { UiFacade } from '@core/registry/state/ui.facade'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/dialog'
import { EventHelper } from '@shared/helpers/event.helper'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ConfirmationModel } from '@shared/models/model/confirmation.model'

const DEFAULT_VARIANT: string = 'primary'
const VARIANTS: Record<string, string> = {
	[SeverityEnum.INFO]: 'info',
	[SeverityEnum.SUCCESS]: 'success',
	[SeverityEnum.WARNING]: 'warning',
	[SeverityEnum.ERROR]: 'danger',
	[SeverityEnum.DANGER]: 'danger',
}

/**
 * Purpose: Asks the user to confirm a command before it runs.
 * Scope: Opens a modal dialog for each confirmation request of the UI facade, colored by its severity; runs the request's `accept` only when the user confirms.
 * Limits: Shows one request at a time (a new one replaces the pending one) and does not build the request: the element actions do.
 */
@Component({
	selector: 'app-confirmation-dialog',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './confirmation-dialog.component.html',
})
export class ConfirmationDialogComponent {
	private readonly uiFacade: UiFacade = inject(UiFacade)

	protected readonly pending: WritableSignal<ConfirmationModel | undefined> = signal(undefined)
	protected readonly variant: Signal<string> = computed((): string => VARIANTS[this.pending()?.acceptSeverity ?? ''] ?? DEFAULT_VARIANT)

	public constructor() {
		this.uiFacade.confirmation.pipe(takeUntilDestroyed()).subscribe((confirmation: ConfirmationModel): void => this.pending.set(confirmation))
	}

	protected confirm(): void {
		const confirmation: ConfirmationModel | undefined = this.pending()
		this.pending.set(undefined)
		confirmation?.accept()
	}

	protected cancel(event?: Event): void {
		if (!event || EventHelper.isFromHost(event)) this.pending.set(undefined)
	}
}
