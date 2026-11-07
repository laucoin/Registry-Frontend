import { Location } from '@angular/common';
import { DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

import { Observable } from 'rxjs';

import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { withLoading } from '@shared/helpers/rx.helper';
import { ErrorModel } from '@shared/models/model/error.model';
import { GenericComponent } from '@shared/ui/base/generic.component';

/**
 * Purpose: Classe de base des formulaires de création et d'édition construits sur les signal forms.
 * Scope: Gère la validation, l'état d'enregistrement, l'affichage des erreurs et la navigation après la soumission.
 * Limits: Abstrait ; chaque formulaire définit son modèle, son schéma et ses appels à la facade.
 */
export abstract class BaseFormComponent extends GenericComponent {
	protected readonly datePipe = inject(CustomDateFormatPipe);
	private readonly location = inject(Location);
	protected readonly destroyRef = inject(DestroyRef);

	protected readonly closesToParentRoute: boolean = false;

	protected readonly loading = signal(false);
	protected readonly saving = signal(false);
	protected readonly error: WritableSignal<ErrorModel | undefined> = signal(undefined);

	private destroyed = false;

	protected constructor() {
		super();
		this.destroyRef.onDestroy(() => {
			this.destroyed = true;
		});
	}

	// Volontairement non lié à la durée de vie du composant : une fois envoyée, une sauvegarde doit aboutir (toast, rafraîchissement de la liste)
	// même si l'utilisateur navigue ailleurs ; seule la redirection est omise.
	protected save<T>(command: Observable<T>, redirect = true): void {
		this.error.set(undefined);
		command.pipe(withLoading(this.saving)).subscribe({
			next: () => {
				if (redirect && !this.destroyed) this.navigateToRedirectUri();
			},
			error: (error: ErrorModel) => this.error.set(error),
		});
	}

	protected abstract loadData(): void;

	protected abstract handleLoadedElement(): void;

	protected abstract submit(): void;

	protected canSubmit(loaded: unknown, isValid: () => boolean): boolean {
		if (this.saving() || this.loading()) return false;
		if (GenericHelper.nonNull(this.idParam) && !loaded) return false;
		return isValid();
	}

	protected isFormValid<T>(form: FieldTree<T>): boolean {
		form().markAsTouched();
		return !form().invalid();
	}

	protected navigateToRedirectUri(route: RegistryRouteEnum | undefined = undefined): void {
		if (GenericHelper.nonNull(route)) this.router.navigateByUrl(route).catch(() => this.location.back());
		else if (this.closesToParentRoute)
			this.router
				.navigate(this.parentRouteCommands(), { relativeTo: this.route, queryParamsHandling: 'preserve' })
				.catch((): void => undefined);
		else this.location.back();
	}

	private parentRouteCommands(): string[] {
		return [Array.from({ length: Math.max(1, this.route.snapshot.url.length) }, () => '..').join('/')];
	}

	protected abstract get idParam(): string | undefined;
}
