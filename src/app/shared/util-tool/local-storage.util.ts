import { Utils } from './json.util'

export class LocalStorageUtils {
    public static get (key: string): unknown {
        const item: string | null = localStorage.getItem( key )
        return Utils.isJson( item ) && item !== null ? JSON.parse( item ) : item
    }

    public static check (key: string): boolean {
        return this.get( key ) !== null
    }

    public static set (key: string, value: unknown): void {
        localStorage.setItem(
            key,
            Utils.isObject( value ) ? JSON.stringify( value ) : typeof value == 'string' ? value : '',
        )
    }

    public static delete (key: string): void {
        localStorage.removeItem( key )
    }

    public static clear (): void {
        localStorage.clear()
    }
}
