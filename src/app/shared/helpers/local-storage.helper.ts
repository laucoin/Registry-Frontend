import { StorageUtils } from '@shared/helpers/storage.helper'

/**
 * Purpose: Typed access to the local storage.
 * Scope: Wraps the storage utilities on localStorage.
 * Limits: Not for sensitive data; it does not expire values.
 */
export class LocalStorageUtils {
    public static get (key: string): unknown {
        return StorageUtils.get( localStorage, key )
    }

    public static check (key: string): boolean {
        return StorageUtils.check( localStorage, key )
    }

    public static set (key: string, value: unknown): void {
        StorageUtils.set( localStorage, key, value )
    }

    public static delete (key: string): void {
        StorageUtils.delete( localStorage, key )
    }

    public static clear (except?: string[]): void {
        StorageUtils.clear( localStorage, except )
    }
}
