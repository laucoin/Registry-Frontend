import { StringUtils } from './string.util'

export class DateUtil {
    public static getDate (date: Date): string {
        const toFormat: Date = new Date( date )
        return `${toFormat.getFullYear()}-${StringUtils.formatDigits(
            toFormat.getMonth() + 1,
            2,
        )}-${StringUtils.formatDigits( toFormat.getDate(), 2 )}`
    }

    public static get startDateExample (): Date {
        const now: Date = new Date()

        if (now.getMonth() > 6) {
            now.setFullYear( now.getFullYear() + 1 )
        }

        now.setMonth( 6, 20 )
        return now
    }

    public static get endDateExample (): Date {
        const now: Date = this.startDateExample
        now.setMonth( 7, 2 )
        return now
    }
}
