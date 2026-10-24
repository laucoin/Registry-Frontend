import { DestroyRef, inject, Injectable, Signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { timer } from 'rxjs'
import { BrowserService } from '@core/browser/browser.service'
import { UiFacade } from '@core/registry/state/ui.facade'
import { REFRESH_INTERVALS, REFRESH_TICK_MS, RefreshKind } from '@shared/helpers/refresh/refresh.config'
import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum'

interface RefreshSourceModel {
    key: string
    kind: RefreshKind
    reload: () => void
    host: Element
}

interface RefreshEntry extends RefreshSourceModel {
    lastRunAt: number
    lastRunDay: string
    visible: boolean
}

const dayOf = (time: number): string => {
    const date: Date = new Date( time )
    return `${ date.getFullYear() }-${ date.getMonth() }-${ date.getDate() }`
}

/**
 * Purpose: Reloads on-screen data in the background so it never stays stale.
 * Scope: Keeps the registered sources, follows whether the host element of each one is on screen, checks them on one global tick and reloads each one that is due: past its interval for its kind (set by the user's refresh mode) or, for day-bound data, past midnight. Does nothing for a source off screen, while the tab is hidden or the browser is offline, and checks again as soon as one of them changes.
 * Limits: Does not fetch anything itself (the registered `reload` does, silently) and ignores sources that are not registered; registration is done through `injectAutoRefresh`.
 */
@Injectable( { providedIn: 'root' } )
export class RefreshService {
    private readonly browser: BrowserService = inject( BrowserService )
    private readonly mode: Signal<RefreshModeEnum> = inject( UiFacade ).refreshMode
    private readonly entries: Set<RefreshEntry> = new Set<RefreshEntry>()
    private tabVisible: boolean = true

    public constructor () {
        timer( REFRESH_TICK_MS, REFRESH_TICK_MS ).pipe( takeUntilDestroyed( inject( DestroyRef ) ) ).subscribe( (): void => this.check() )
        this.browser.onVisibilityChange( (visible: boolean): void => {
            this.tabVisible = visible
            this.check()
        } )
    }

    /** Registers a source that was just loaded and returns the function that unregisters it. */
    public register (source: RefreshSourceModel): () => void {
        const now: number = Date.now()
        const entry: RefreshEntry = { ...source, lastRunAt: now, lastRunDay: dayOf( now ), visible: true }
        const stopObserving: () => void = this.browser.observeIntersection( source.host, (visible: boolean): void => {
            entry.visible = visible
            if (visible) this.check()
        } )
        this.entries.add( entry )
        return (): void => {
            stopObserving()
            this.entries.delete( entry )
        }
    }

    /** Reloads every source that is due and on screen; called on each tick and when visibility or the network changes. */
    public check (): void {
        if (!this.tabVisible || !this.browser.online) return

        const now: number = Date.now()
        this.entries.forEach( (entry: RefreshEntry): void => {
            if (entry.visible && this.isDue( entry, now )) {
                entry.lastRunAt = now
                entry.lastRunDay = dayOf( now )
                entry.reload()
            }
        } )
    }

    private isDue (entry: RefreshEntry, now: number): boolean {
        if (entry.kind === 'dayBound' && entry.lastRunDay !== dayOf( now )) return true

        const interval: number | undefined = REFRESH_INTERVALS[ this.mode() ][ entry.kind ]
        return interval !== undefined && now - entry.lastRunAt >= interval
    }
}
