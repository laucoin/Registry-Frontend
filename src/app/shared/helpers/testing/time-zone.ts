import { afterEach, beforeEach } from 'vitest'

interface NodeProcess {
    env: Record<string, string | undefined>
}

/**
 * Purpose: Runs the tests of the enclosing `describe` in a fixed time zone.
 * Scope: Sets the `TZ` variable of the test process before each test and restores it after.
 * Limits: Only for tests; it relies on the Node process of the test runner.
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
