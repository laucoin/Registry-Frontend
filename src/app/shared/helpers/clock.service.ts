import { DestroyRef, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core'

/**
 * Purpose: Shared one-second clock for live counters.
 * Scope: Exposes the current timestamp as a signal refreshed every second, with one timer for the whole application.
 * Limits: Second precision only; the timer lives as long as the application.
 */
@Injectable( { providedIn: 'root' } )
export class ClockService {
    private readonly nowState: WritableSignal<number> = signal( Date.now() )

    public readonly now: Signal<number> = this.nowState.asReadonly()

    public constructor () {
        const timer: ReturnType<typeof setInterval> = setInterval( (): void => this.nowState.set( Date.now() ), 1000 )
        inject( DestroyRef ).onDestroy( (): void => clearInterval( timer ) )
    }
}
