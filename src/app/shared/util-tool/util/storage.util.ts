import { GenericUtil } from './generic.util'
import { Utils } from './json.util'

export class StorageUtils {
    public static get (storage: Storage, key: string): unknown {
        const item: string | null = storage.getItem( key )
        return Utils.isJson( item ) ? JSON.parse( item! ) : item
    }

    public static check (storage: Storage, key: string): boolean {
        return GenericUtil.nonNull( this.get( storage, key ) )
    }

    public static set (storage: Storage, key: string, value: unknown): void {
        storage.setItem(
            key,
            Utils.isObject( value ) ? JSON.stringify( value ) : typeof value == 'string' ? value : '',
        )
    }

    public static delete (storage: Storage, key: string): void {
        storage.removeItem( key )
    }

    public static clear (storage: Storage, except?: string[]): void {
        const keep: unknown[] = []
        if (except && except.length > 0) {
            keep.push( ...except.map( (key: string) => this.get( storage, key ) ) )
        }

        storage.clear()

        if (except && except?.length > 0) {
            except.forEach( (key: string, index: number): void => {
                const value: unknown = keep[index]
                if (value) {
                    this.set( storage, key, value )
                }
            } )
        }
    }
}
