import { StorageUtils } from '@shared/helpers/storage.helper'

/**
 * Purpose: Typed access to the session storage.
 * Scope: Wraps the storage utilities on sessionStorage.
 * Limits: Not for sensitive data; values live until the tab closes.
 */
export class SessionStorageUtils {
    public static get (key: string): unknown {
        return StorageUtils.get( sessionStorage, key )
    }

    public static check (key: string): boolean {
        return StorageUtils.check( sessionStorage, key )
    }

    public static set (key: string, value: unknown): void {
        StorageUtils.set( sessionStorage, key, value )
    }

    public static delete (key: string): void {
        StorageUtils.delete( sessionStorage, key )
    }

    public static clear (except?: string[]): void {
        StorageUtils.clear( sessionStorage, except )
    }
}
