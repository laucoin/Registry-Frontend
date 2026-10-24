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
 * Purpose: Recharge en arrière-plan les données à l'écran pour qu'elles ne soient jamais périmées.
 * Scope: Conserve les sources enregistrées, suit si l'élément hôte de chacune est à l'écran, les vérifie sur un tick global unique et recharge chacune de celles qui sont dues : au-delà de son intervalle pour son type (fixé par le mode de rafraîchissement de l'utilisateur) ou, pour les données journalières, après minuit. Ne fait rien pour une source hors écran, quand l'onglet est caché ou que le navigateur est hors ligne, et revérifie dès que l'une d'elles change.
 * Limits: Ne récupère rien lui-même (le `reload` enregistré le fait, en silence) et ignore les sources non enregistrées ; l'enregistrement passe par `injectAutoRefresh`.
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

    /** Enregistre une source qui vient d'être chargée et renvoie la fonction qui la désenregistre. */
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

    /** Recharge chaque source due et à l'écran ; appelé à chaque tick et quand la visibilité ou le réseau change. */
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
