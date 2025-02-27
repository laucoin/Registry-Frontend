import { inject, Pipe, PipeTransform } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { DatePipe } from '@angular/common'
import { CustomDatetimeModel } from '../../util-model/model/custom-datetime.model'
import { GenericUtil } from '../util/generic.util'
import { DateUtil } from '../util/date.util'

@Pipe( {
    name: 'customDateFormat', standalone: true,
} )
export class CustomDateFormatPipe implements PipeTransform {
    private readonly datePipe: DatePipe = inject( DatePipe )
    private readonly translateService: TranslateService = inject( TranslateService )

    public transform (value: CustomDatetimeModel | undefined | null): string | undefined {
        const formattedValue: Date | undefined = DateUtil.toDate( value )

        if (GenericUtil.isNull( formattedValue )) return undefined

        let type: 'date' | 'time' | 'datetime' = 'datetime'
        if (GenericUtil.isNull( value?.date )) type = 'time'
        if (GenericUtil.isNull( value?.time )) type = 'date'
        const translationKey: string = `global.date-and-time-format.${type}`

        return this.datePipe.transform(
            formattedValue!.toString(),
            this.translateService.instant( translationKey ),
        ) ?? undefined
    }
}
