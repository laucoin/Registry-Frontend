export class StringUtils {
    public static addCacheBustingToUrl (url: string): string {
        const separator: string = url.includes( '?' ) ? '&' : '?'
        return `${url}${separator}cache-bust=${Math.random()}`
    }

    public static truncate (text: string, maxLength: number, tail: string): string {
        if (text.length > maxLength) return text.substring( 0, maxLength ) + tail
        return text
    }

    public static formatDigits (value: number, range: number): string {
        return value.toString().padStart( range, '0' )
    }
}
