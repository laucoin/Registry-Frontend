export class ArrayUtil {
    public static includes (array: unknown[], value: unknown, strict: boolean = false): boolean {
        if (!strict) {
            if (!value && !strict) return true
            else if (!array || array.length === 0) return !value
        }
        return array.includes( value )
    }

    public static isNullOrEmpty (array: unknown[] | undefined): boolean {
        return !array || array.length === 0
    }
}
