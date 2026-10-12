import { inject, Pipe, PipeTransform } from '@angular/core'
import {TranslocoService} from '@jsverse/transloco'
import { DatePipe } from '@angular/common'

/**
 * Purpose: Formats a date with the translated pattern of a type.
 * Scope: Supports date, time and datetime.
 * Limits: Returns undefined for an empty value.
 */
@Pipe( {
    name: 'dateFormat', standalone: true,
} )
export class DateFormatPipe implements PipeTransform {
    private readonly datePipe: DatePipe = inject( DatePipe )
    private readonly translateService: TranslocoService = inject( TranslocoService )

    public transform (value: Date | string | undefined | null, type: 'date' | 'time' | 'datetime'): string | undefined {
        const translationKey: string = `global.date-and-time-format.${type}`
        return this.datePipe.transform(
            value?.toString(),
            this.translateService.translate( translationKey ),
        ) ?? undefined
    }
}
