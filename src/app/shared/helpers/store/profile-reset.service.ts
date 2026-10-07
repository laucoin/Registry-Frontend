import { Injectable } from '@angular/core'

// Route-scoped signal stores register here so a profile switch can reset them all synchronously.
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
