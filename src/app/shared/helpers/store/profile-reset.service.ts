import { Injectable } from '@angular/core'

/**
 * Purpose: Permet aux stores limités à une route de se réinitialiser ensemble lors d'un changement de profil.
 * Scope: Conserve les callbacks de réinitialisation enregistrés et les exécute tous.
 * Limits: Ne décide pas du moment où un changement de profil a lieu.
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
