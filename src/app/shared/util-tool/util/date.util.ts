import { StringUtils } from './string.util'

export class DateUtil {
    public static getDate (date: Date): string {
        const toFormat: Date = new Date( date )
        return `${toFormat.getFullYear()}-${StringUtils.formatDigits(
            toFormat.getMonth() + 1,
            2,
        )}-${StringUtils.formatDigits( toFormat.getDate(), 2 )}`
    }
}
