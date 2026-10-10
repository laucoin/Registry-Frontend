/**
 * Purpose: Null checks shared across the application.
 * Scope: Provides isNull and nonNull.
 * Limits: Nothing else; browser access lives in the browser service.
 */
export class GenericHelper {
    public static isNull = (value: unknown | undefined | null): boolean => value == undefined
    public static nonNull = (value: unknown | undefined | null): boolean => !this.isNull( value )
}
