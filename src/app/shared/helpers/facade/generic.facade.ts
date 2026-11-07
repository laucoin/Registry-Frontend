import { inject } from '@angular/core';

import { TranslocoService } from '@jsverse/transloco';

/**
 * Purpose: Base des facades qui traduisent des libellés.
 * Scope: Fournit une traduction de libellés qui laisse l'option vide telle quelle.
 * Limits: Abstrait ; ne détient aucun état.
 */
export abstract class GenericFacade {
	private static readonly EMPTY_OPTION_LABEL: string = '-';

	protected readonly translateService = inject(TranslocoService);

	protected translateLabel(label: string | undefined): string | undefined {
		if (label === undefined || label === GenericFacade.EMPTY_OPTION_LABEL) return label;
		return this.translateService.translate(label);
	}
}
