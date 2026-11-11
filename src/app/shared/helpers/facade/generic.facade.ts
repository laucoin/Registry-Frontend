import { computed, inject, Signal } from '@angular/core';

import { TranslocoService } from '@jsverse/transloco';

import { SelectOptionModel } from '@shared/models/model/select-option.model';

const EMPTY_OPTION_LABEL = '-';

/**
 * Objectif: Base des facades qui traduisent des libellés.
 * Périmètre: Fournit une traduction de libellés, et de listes d'options, qui laisse l'option vide telle quelle.
 * Limites: Abstrait ; ne détient aucun état.
 */
export abstract class GenericFacade {
	protected readonly translateService = inject(TranslocoService);

	protected translateLabel(label: string | undefined): string | undefined {
		if (label === undefined || label === EMPTY_OPTION_LABEL) return label;
		return this.translateService.translate(label);
	}

	protected translatedOptions<T>(options: Signal<SelectOptionModel<T>[]>): Signal<SelectOptionModel<T>[]> {
		return computed(() => options().map((option) => ({ ...option, label: this.translateLabel(option.label) })));
	}
}
