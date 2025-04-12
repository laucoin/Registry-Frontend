import { StorageUtils } from './storage.util'

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
