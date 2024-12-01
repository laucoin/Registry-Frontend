import { GenericUtil } from './generic.util'
import { Utils } from './json.util'

export class SessionStorageUtils {
    public static get (key: string): unknown {
        const item: string | null = sessionStorage.getItem( key )
        return Utils.isJson( item ) ? JSON.parse( item! ) : item
    }

    public static check (key: string): boolean {
        return GenericUtil.nonNull( this.get( key ) )
    }

    public static set (key: string, value: unknown): void {
        sessionStorage.setItem(
            key,
            Utils.isObject( value ) ? JSON.stringify( value ) : typeof value == 'string' ? value : '',
        )
    }

    public static delete (key: string): void {
        sessionStorage.removeItem( key )
    }

    public static clear (except?: string[]): void {
        const keep: unknown[] = []
        if (except && except.length > 0) {
            keep.push( ...except.map( (key: string) => this.get( key ) ) )
        }

        sessionStorage.clear()

        if (except && except?.length > 0) {
            except.forEach( (key: string, index: number): void => {
                const value: unknown = keep[index]
                if (value) {
                    this.set( key, value )
                }
            } )
        }
    }
}
