import { Pipe, PipeTransform } from '@angular/core'
import { GenericUtil } from '../util/generic.util'
import { DateIntervalStatusModel } from '../../util-model/model/date-interval-status.model'

@Pipe( {
    name: 'intervalFormat', standalone: true,
} )
export class IntervalFormatPipe implements PipeTransform {
    public transform (value: DateIntervalStatusModel | undefined, prefix: string | undefined): string {
        let formattedPrefix: string = GenericUtil.nonNull( prefix ) ? `${prefix}.` : ''
        if (GenericUtil.nonNull( value?.interval )) {
            formattedPrefix += 'interval.'
        }
        return formattedPrefix + (value?.status ?? '')
    }
}
