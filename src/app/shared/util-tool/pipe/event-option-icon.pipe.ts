import { Pipe, PipeTransform } from '@angular/core'
import { EventOptionEnum } from '../../util-model/enumeration/event-option.enum'
import { AppConfig } from '../../../app.config'

@Pipe( {
    name: 'optionIcon', standalone: true,
} )
export class EventOptionIconPipe implements PipeTransform {
    public transform (value: EventOptionEnum): string {
        return AppConfig.config.event.optionIcons.get( value ) ?? ''
    }
}
