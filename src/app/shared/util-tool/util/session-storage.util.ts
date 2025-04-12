import { StorageUtils } from './storage.util'

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
