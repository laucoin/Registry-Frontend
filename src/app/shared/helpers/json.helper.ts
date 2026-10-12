import { GenericHelper } from '@shared/helpers/generic.helper'

/**
 * Purpose: JSON detection utilities.
 * Scope: Tells whether a text is a JSON object and whether a value is an object.
 * Limits: Does not parse for callers.
 */
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
