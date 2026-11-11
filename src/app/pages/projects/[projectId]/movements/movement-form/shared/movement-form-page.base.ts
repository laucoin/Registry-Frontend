import { computed, inject, signal } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

import { Observable } from 'rxjs';

import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import {
	MovementFormContext,
	MovementInformationModel,
} from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { MovementPrefillService } from '@shared/helpers/movement-prefill.service';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementPrefillModel } from '@shared/models/model/movement-prefill.model';
import { BaseElementFormComponent } from '@shared/ui/base/base-element-form.component';

export interface MovementFormModelBase {
	information: MovementInformationModel;
}

/**
 * Objectif: Classe de base des pages de formulaire de mouvement, d'invités ou de participants inscrits.
 * Périmètre: Charge le mouvement édité (via la classe de base des formulaires d'élément) ou applique le préremplissage,
 * change le type, passe d'une étape à l'autre et donne la clé du titre.
 * Limites: Abstrait ; chaque page définit son modèle, ses conversions et sa soumission.
 */
export abstract class MovementFormPage<M extends MovementFormModelBase> extends BaseElementFormComponent<
	MovementModel,
	M
> {
	protected readonly idParamName: string = 'movementId';
	protected readonly facade = inject(MovementFacade);
	private readonly prefillService = inject(MovementPrefillService);

	protected readonly now = new Date();
	protected readonly activeTab = signal(1);
	protected readonly formContext: MovementFormContext = {
		...this.dateContext,
		editing: () => GenericHelper.nonNull(this.idParam),
	};

	protected readonly titleKey = computed(
		() => `movements.form.title.${this.element() ? 'edit' : 'create'}.${this.model().information.type || 'none'}`,
	);

	protected abstract withPrefill(model: M, prefill: MovementPrefillModel): M;

	protected abstract withType(model: M, type: string): M;

	protected abstract informationForm(): FieldTree<MovementInformationModel>;

	protected fetchElement(id: string): Observable<MovementModel> {
		return this.facade.fetchMovement(id);
	}

	protected override handleLoadedElement(): void {
		super.handleLoadedElement();
		if (GenericHelper.isNull(this.idParam)) this.applyPrefill();
	}

	protected handleTypeChange(type: string): void {
		this.model.update((current) => this.withType(current, type));
	}

	protected goTo(step: number): void {
		this.activeTab.set(step);
	}

	protected nextFromInformation(): void {
		if (this.isFormValid(this.informationForm())) this.goTo(2);
	}

	private applyPrefill(): void {
		const prefill = this.prefillService.read();
		if (!prefill) return;
		this.model.update((current) => this.withPrefill(current, prefill));
		this.goTo(2);
	}
}
