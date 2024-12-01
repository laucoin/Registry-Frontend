export class GenericUtil {
    public static isNull = (value: unknown | undefined | null): boolean => value == undefined
    public static nonNull = (value: unknown | undefined | null): boolean => !this.isNull( value )
}
