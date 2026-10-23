import { GenericHelper } from '@shared/helpers/generic.helper'

export class Utils {
    public static isJson (item: string | null): boolean {
        let value: string = item || ''

        try {
            value = JSON.parse( value )
        } catch {
            return false
        }

        return typeof value === 'object' && GenericHelper.nonNull( value )
    }

    public static isObject (item: unknown): boolean {
        return typeof item === 'object' && GenericHelper.nonNull( item )
    }
}
