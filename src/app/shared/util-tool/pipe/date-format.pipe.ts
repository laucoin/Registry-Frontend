import { inject, Pipe, PipeTransform } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { DatePipe } from '@angular/common'

@Pipe( {
    name: 'dateFormat', standalone: true,
} )
export class DateFormatPipe implements PipeTransform {
    private readonly datePipe: DatePipe = inject( DatePipe )
    private readonly translateService: TranslateService = inject( TranslateService )

    public transform (value: Date | string | undefined | null, type: 'date' | 'time' | 'datetime'): string | undefined {
        const translationKey: string = `global.date-and-time-format.${type}`
        return this.datePipe.transform(
            value?.toString(),
            this.translateService.instant( translationKey ),
        ) ?? undefined
    }
}
