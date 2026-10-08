import { Injectable } from '@angular/core'

/**
 * Purpose: Lets route-scoped stores reset together on a profile switch.
 * Scope: Keeps the registered reset callbacks and runs them all.
 * Limits: Does not decide when a profile switch happens.
 */
@Injectable( { providedIn: 'root' } )
export class ProfileResetService {
    private readonly resets: Set<() => void> = new Set<() => void>()

    public register (reset: () => void): () => void {
        this.resets.add( reset )
        return (): void => {
            this.resets.delete( reset )
        }
    }

    public resetAll (): void {
        this.resets.forEach( (reset: () => void): void => reset() )
    }
}
