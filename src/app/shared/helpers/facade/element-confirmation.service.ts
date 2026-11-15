import { inject, Injectable } from '@angular/core';

import { TranslocoService } from '@jsverse/transloco';
import { Observable } from 'rxjs';

import { UiFacade } from '@core/registry/state/ui.facade';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';

/**
 * Objectif: Demande à l'utilisateur de confirmer une commande sur un élément de liste.
 * Périmètre: Construit la confirmation à partir des traductions `<prefix>.title` et `<prefix>.message` de l'élément et la remet à l'UI ; une confirmation avec saisie porte aussi la `<prefix>.phrase` que l'utilisateur doit saisir.
 * Limites: N'exécute pas la commande lui-même ; le dialogue s'abonne à la commande renvoyée par le callback d'acceptation.
 */
@Injectable({ providedIn: 'root' })
export class ElementConfirmationService {
	private readonly uiFacade = inject(UiFacade);
	private readonly translateService = inject(TranslocoService);

	public confirm(
		prefix: string,
		element: unknown,
		severity: SeverityEnum,
		accept: () => Observable<unknown>,
		typed = false,
	): void {
		this.uiFacade.confirm({
			header: this.translateService.translate(`${prefix}.title`, { element: element }),
			message: this.translateService.translate(`${prefix}.message`, { element: element }),
			acceptSeverity: severity,
			accept: accept,
			...(typed && { phrase: this.translateService.translate(`${prefix}.phrase`, { element: element }) }),
		});
	}
}
