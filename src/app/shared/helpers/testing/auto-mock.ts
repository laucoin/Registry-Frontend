import { of } from 'rxjs'
import { vi, Mock } from 'vitest'

/**
 * Builds a stand-in for a facade whose members are created on first use.
 * Every member is a spy that returns an observable emitting an empty object, which suits both commands and signals read as functions.
 */
export function autoMock (): Record<string, Mock> {
    const members: Record<string, Mock> = {}
    return new Proxy( members, {
        get: (target: Record<string, Mock>, key: string | symbol): Mock | undefined => {
            if (typeof key !== 'string' || key === 'then') return undefined
            return target[ key ] ??= vi.fn( () => of( {} ) )
        },
    } )
}
