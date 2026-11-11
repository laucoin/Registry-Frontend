import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TranslocoPipe } from '@jsverse/transloco';

import { UiFacade } from '@core/registry/state/ui.facade';
import { EventHelper } from '@shared/helpers/event.helper';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ConfirmationModel } from '@shared/models/model/confirmation.model';

import '@sgdf/ui/button';
import '@sgdf/ui/dialog';
import '@sgdf/ui/input';

const DEFAULT_VARIANT = 'primary';
const VARIANTS: Record<string, string> = {
	[SeverityEnum.INFO]: 'info',
	[SeverityEnum.SUCCESS]: 'success',
	[SeverityEnum.WARNING]: 'warning',
	[SeverityEnum.ERROR]: 'danger',
	[SeverityEnum.DANGER]: 'danger',
};

/**
 * Objectif: Demande à l'utilisateur de confirmer une commande avant son exécution.
 * Périmètre: Ouvre un dialogue modal pour chaque demande de confirmation de la facade UI, coloré selon sa sévérité ; n'exécute l'`accept` de la demande que si l'utilisateur confirme, après avoir saisi sa phrase quand elle en a une.
 * Limites: Affiche une seule demande à la fois (une nouvelle remplace celle en attente) et ne construit pas la requête : les actions de l'élément le font.
 */
@Component({
	selector: 'app-confirmation-dialog',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './confirmation-dialog.component.html',
})
export class ConfirmationDialogComponent {
	private readonly uiFacade = inject(UiFacade);

	protected readonly pending: WritableSignal<ConfirmationModel | undefined> = signal(undefined);
	protected readonly variant: Signal<string> = computed(
		(): string => VARIANTS[this.pending()?.acceptSeverity ?? ''] ?? DEFAULT_VARIANT,
	);
	protected readonly typed = signal('');
	protected readonly phraseTyped = computed(() => this.buildPhraseTyped());

	constructor() {
		this.uiFacade.confirmation.pipe(takeUntilDestroyed()).subscribe((confirmation) => this.open(confirmation));
	}

	protected onInput(event: Event): void {
		this.typed.set((event.target as HTMLInputElement).value);
	}

	protected confirm(): void {
		const confirmation: ConfirmationModel | undefined = this.pending();
		this.close();
		confirmation?.accept();
	}

	protected cancel(event?: Event): void {
		if (!event || EventHelper.isFromHost(event)) this.close();
	}

	private open(confirmation: ConfirmationModel): void {
		this.typed.set('');
		this.pending.set(confirmation);
	}

	private close(): void {
		this.typed.set('');
		this.pending.set(undefined);
	}

	private buildPhraseTyped(): boolean {
		const phrase: string | undefined = this.pending()?.phrase;
		return phrase === undefined || this.typed().trim().toLowerCase() === phrase.trim().toLowerCase();
	}
}
