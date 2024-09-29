import { GenericUtil } from './generic.util'

export class Utils {
    public static isJson (item: string | null): boolean {
        let value: string = item || ''

        try {
            value = JSON.parse( value )
        } catch {
            return false
        }

        return typeof value === 'object' && GenericUtil.nonNull( value )
    }

    public static isObject (item: unknown): boolean {
        return typeof item === 'object' && GenericUtil.nonNull( item )
    }
}
