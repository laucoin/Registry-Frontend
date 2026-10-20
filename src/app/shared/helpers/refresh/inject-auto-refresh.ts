import { DestroyRef, ElementRef, inject } from '@angular/core'
import { RefreshKind } from '@shared/helpers/refresh/refresh.config'
import { RefreshService } from '@shared/helpers/refresh/refresh.service'

/**
 * Purpose: Keeps a component's data fresh with one line in the component.
 * Scope: Registers the component's host element in the refresh service for the lifetime of the component.
 * Limits: Must be called in an injection context of a component; `reload` must be a silent reload (no loader, no error state).
 */
export function injectAutoRefresh (key: string, kind: RefreshKind, reload: () => void): void {
    const host: Element = inject<ElementRef<Element>>( ElementRef ).nativeElement
    const unregister: () => void = inject( RefreshService ).register( { key, kind, reload, host } )
    inject( DestroyRef ).onDestroy( unregister )
}
