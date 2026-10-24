import { afterEach, beforeEach } from 'vitest'

interface NodeProcess {
    env: Record<string, string | undefined>
}

/**
 * Purpose: Exécute les tests du `describe` englobant dans un fuseau horaire fixe.
 * Scope: Positionne la variable `TZ` du processus de test avant chaque test et la restaure après.
 * Limits: Uniquement pour les tests ; s'appuie sur le processus Node du lanceur de tests.
 */
export function useTimeZone (zone: string): void {
    const env: Record<string, string | undefined> = (globalThis as unknown as { process: NodeProcess }).process.env
    let previous: string | undefined

    beforeEach( () => {
        previous = env[ 'TZ' ]
        env[ 'TZ' ] = zone
    } )

    afterEach( () => {
        if (previous === undefined) delete env[ 'TZ' ]
        else env[ 'TZ' ] = previous
    } )
}
