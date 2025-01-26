import { Pipe, PipeTransform } from '@angular/core'
import { AppConfig } from '../../../app.config'

@Pipe( {
    name: 'optionIcon', standalone: true,
} )
export class EventOptionIconPipe implements PipeTransform {
    public transform (value: string): string {
        return AppConfig.config.event.optionIcons.get( value ) ?? ''
    }
}
