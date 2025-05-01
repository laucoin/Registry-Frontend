import { Pipe, PipeTransform } from '@angular/core'
import { ProjectOptionEnum } from '../../util-model/enumeration/project-option.enum'

const optionIcons: Map<ProjectOptionEnum, string> = new Map<ProjectOptionEnum, string>( [
    [ ProjectOptionEnum.TICKETING, 'pi pi-ticket' ],
    [ ProjectOptionEnum.VEHICLE, 'pi pi-car' ],
    [ ProjectOptionEnum.ACTIVITY, 'pi pi-hammer' ],
    [ ProjectOptionEnum.PHONE_COMMUNICATION, 'pi pi-phone' ],
    [ ProjectOptionEnum.ACTIVITY_COMMUNICATION, 'pi pi-microphone' ],
    [ ProjectOptionEnum.FIRE_RISK, 'pi pi-exclamation-triangle' ],
    [ ProjectOptionEnum.SMOKE_REPORT, 'pi pi-cloud' ],
    [ ProjectOptionEnum.MOVEMENT_REPORT, 'pi pi-sort-alt-slash' ],
] )

@Pipe( {
    name: 'optionIcon', standalone: true,
} )
export class ProjectOptionIconPipe implements PipeTransform {
    public transform (value: ProjectOptionEnum): string {
        return optionIcons.get( value ) ?? ''
    }
}
