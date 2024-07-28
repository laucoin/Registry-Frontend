export class Utils {
    public static isJson (item: string | null): boolean {
        let value: string = item || ''

        try {
            value = JSON.parse( value )
        } catch {
            return false
        }

        return typeof value === 'object' && value !== null
    }

    public static isObject (item: unknown): boolean {
        return typeof item === 'object' && item !== null
    }
}
