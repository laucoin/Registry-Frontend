import {
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	inject,
	Signal,
	signal,
	WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TranslocoPipe } from '@jsverse/transloco';
import { Subscription } from 'rxjs';

import { UiFacade } from '@core/registry/state/ui.facade';
import { EventHelper } from '@shared/helpers/event.helper';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ConfirmationModel } from '@shared/models/model/confirmation.model';
import { ErrorModel } from '@shared/models/model/error.model';
import { FormErrorComponent } from '@shared/ui/common/form-error/form-error.component';

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
 * Périmètre: Ouvre un dialogue modal pour chaque demande de confirmation de la facade UI, coloré selon sa sévérité ; n'exécute l'`accept` de la demande que si l'utilisateur confirme, après avoir saisi sa phrase quand elle en a une. Pendant l'exécution, le bouton de confirmation montre le chargement ; le dialogue se ferme au succès et reste ouvert à l'échec, avec l'erreur à l'intérieur, effacée au nouvel envoi ou à la fermeture. Fermer pendant l'exécution l'annule.
 * Limites: Affiche une seule demande à la fois (une nouvelle remplace celle en attente) et ne construit pas la requête : les actions de l'élément le font.
 */
@Component({
	selector: 'app-confirmation-dialog',
	imports: [TranslocoPipe, FormErrorComponent],
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
	protected readonly saving = signal(false);
	protected readonly error: WritableSignal<ErrorModel | undefined> = signal(undefined);

	private running: Subscription | undefined;

	constructor() {
		this.uiFacade.confirmation.pipe(takeUntilDestroyed()).subscribe((confirmation) => this.open(confirmation));
		inject(DestroyRef).onDestroy(() => this.running?.unsubscribe());
	}

	protected onInput(event: Event): void {
		this.typed.set((event.target as HTMLInputElement).value);
	}

	protected confirm(): void {
		const confirmation: ConfirmationModel | undefined = this.pending();
		if (!confirmation || this.saving()) return;
		this.error.set(undefined);
		this.saving.set(true);
		this.running = confirmation.accept().subscribe({
			error: (error: ErrorModel) => this.fail(error),
			complete: () => this.close(),
		});
	}

	protected cancel(event?: Event): void {
		if (!event || EventHelper.isFromHost(event)) this.close();
	}

	private open(confirmation: ConfirmationModel): void {
		this.close();
		this.pending.set(confirmation);
	}

	private fail(error: ErrorModel): void {
		this.saving.set(false);
		this.error.set(error);
	}

	private close(): void {
		this.running?.unsubscribe();
		this.running = undefined;
		this.saving.set(false);
		this.error.set(undefined);
		this.typed.set('');
		this.pending.set(undefined);
	}

	private buildPhraseTyped(): boolean {
		const phrase: string | undefined = this.pending()?.phrase;
		return phrase === undefined || this.typed().trim().toLowerCase() === phrase.trim().toLowerCase();
	}
}
