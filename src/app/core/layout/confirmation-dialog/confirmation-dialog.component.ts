import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal } from '@angular/core'
import { UiFacade } from '@core/registry/state/ui.facade'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/dialog'
import '@sgdf/ui/input'
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
 * Scope: Opens a modal dialog for each confirmation request of the UI facade, colored by its severity; runs the request's `accept` only when the user confirms, after typing its phrase when it has one.
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
	protected readonly typed: WritableSignal<string> = signal('')
	protected readonly phraseTyped: Signal<boolean> = computed((): boolean => {
		const phrase: string | undefined = this.pending()?.phrase
		return phrase === undefined || this.typed().trim().toLowerCase() === phrase.trim().toLowerCase()
	})

	public constructor() {
		this.uiFacade.confirmation.pipe(takeUntilDestroyed()).subscribe((confirmation: ConfirmationModel): void => this.open(confirmation))
	}

	protected onInput(event: Event): void {
		this.typed.set((event.target as HTMLInputElement).value)
	}

	protected confirm(): void {
		const confirmation: ConfirmationModel | undefined = this.pending()
		if (!this.phraseTyped()) return
		this.close()
		confirmation?.accept()
	}

	protected cancel(event?: Event): void {
		if (!event || EventHelper.isFromHost(event)) this.close()
	}

	private open(confirmation: ConfirmationModel): void {
		this.typed.set('')
		this.pending.set(confirmation)
	}

	private close(): void {
		this.typed.set('')
		this.pending.set(undefined)
	}
}
