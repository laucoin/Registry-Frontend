import { DestroyRef, ElementRef, inject } from '@angular/core';

import { BrowserService } from '@core/browser/browser.service';
import { RefreshService } from '@shared/helpers/refresh/refresh.service';
import { RefreshKindEnum } from '@shared/models/enumeration/refresh-kind.enum';

/**
 * Objectif: Garde les données d'un composant à jour avec une seule ligne dans le composant.
 * Périmètre: Enregistre l'élément hôte du composant dans le service de rafraîchissement pour la durée de vie du composant.
 * Limites: Doit être appelé dans un contexte d'injection de composant ; `reload` doit être un rechargement silencieux (ni loader, ni état d'erreur).
 */
export function injectAutoRefresh(key: string, kind: RefreshKindEnum, reload: () => void): void {
	const host = inject(BrowserService).elementOf(inject<ElementRef<Element>>(ElementRef));
	const unregister = inject(RefreshService).register({ key, kind, reload, host });
	inject(DestroyRef).onDestroy(unregister);
}
