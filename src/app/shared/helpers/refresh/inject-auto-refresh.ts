import { DestroyRef, ElementRef, inject } from '@angular/core'
import { RefreshKind } from '@shared/helpers/refresh/refresh.config'
import { RefreshService } from '@shared/helpers/refresh/refresh.service'

/**
 * Purpose: Garde les données d'un composant à jour avec une seule ligne dans le composant.
 * Scope: Enregistre l'élément hôte du composant dans le service de rafraîchissement pour la durée de vie du composant.
 * Limits: Doit être appelé dans un contexte d'injection de composant ; `reload` doit être un rechargement silencieux (ni loader, ni état d'erreur).
 */
export function injectAutoRefresh (key: string, kind: RefreshKind, reload: () => void): void {
    const host: Element = inject<ElementRef<Element>>( ElementRef ).nativeElement
    const unregister: () => void = inject( RefreshService ).register( { key, kind, reload, host } )
    inject( DestroyRef ).onDestroy( unregister )
}
