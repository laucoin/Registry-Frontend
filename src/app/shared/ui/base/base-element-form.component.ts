import { signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FieldTree } from '@angular/forms/signals';

import { Observable } from 'rxjs';

import { ETagHelper } from '@shared/helpers/etag.helper';
import { ProjectDateContext } from '@shared/helpers/form/registry.schemas';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { withLoading } from '@shared/helpers/rx.helper';
import { GenericModel } from '@shared/models/model/generic.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { BaseFormComponent } from '@shared/ui/base/base-form.component';

/**
 * Objectif: Classe de base des formulaires qui créent un élément ou modifient celui désigné par la route.
 * Périmètre: Charge l'élément édité, applique le projet sélectionné aux règles de dates, remplit le modèle et choisit
 * entre création et mise à jour, avec la version de l'élément.
 * Limites: Abstrait ; chaque formulaire définit son modèle, ses conversions et ses appels à la facade. La sous-classe
 * appelle `loadData` et `handleLoadedElement` dans son constructeur, une fois son modèle construit.
 */
export abstract class BaseElementFormComponent<E extends GenericModel, M> extends BaseFormComponent {
	protected readonly element: WritableSignal<E | undefined> = signal(undefined);
	private readonly contextProject: WritableSignal<ProjectModel | undefined> = signal(undefined);
	protected readonly dateContext: ProjectDateContext = {
		project: this.contextProject,
		formatDate: (date) => this.datePipe.transform(date),
	};

	protected abstract readonly idParamName: string;
	protected abstract readonly model: WritableSignal<M>;
	protected abstract readonly form: FieldTree<M>;

	protected abstract fetchElement(id: string): Observable<E>;

	protected abstract toFormModel(element: E): M;

	protected abstract create(model: M): Observable<unknown>;

	protected abstract update(element: E, model: M, ifMatch: string | undefined): Observable<unknown>;

	protected override loadData(): void {
		if (GenericHelper.isNull(this.idParam)) return;
		this.fetchElement(this.idParam)
			.pipe(withLoading(this.loading), takeUntilDestroyed(this.destroyRef))
			.subscribe((element) => {
				this.element.set(element);
				this.applyElement(element);
			});
	}

	protected handleLoadedElement(): void {
		if (GenericHelper.isNull(this.idParam)) this.contextProject.set(this.sessionFacade.selectedProject());
	}

	protected applyElement(element: E): void {
		this.contextProject.set(this.sessionFacade.selectedProject());
		this.model.set(this.toFormModel(element));
	}

	protected submit(): void {
		const element = this.element();
		if (!this.canSubmit(element, () => this.isValid())) return;
		this.save(
			element ? this.update(element, this.model(), ETagHelper.ifMatch(element)) : this.create(this.model()),
			this.redirectsAfterSave(),
		);
	}

	protected isValid(): boolean {
		return this.isFormValid(this.form);
	}

	protected redirectsAfterSave(): boolean {
		return true;
	}

	protected get idParam(): string | undefined {
		return this.route.snapshot.params[this.idParamName];
	}
}
