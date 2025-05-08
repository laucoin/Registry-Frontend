import { Pipe, PipeTransform } from '@angular/core'
import { ProjectOptionEnum } from '../../util-model/enumeration/project-option.enum'

const optionIcons: Map<ProjectOptionEnum, string> = new Map<ProjectOptionEnum, string>( [
    [ ProjectOptionEnum.VEHICLE, 'pi pi-car' ],
    [ ProjectOptionEnum.ACTIVITY, 'pi pi-hammer' ],
    [ ProjectOptionEnum.COMMUNICATION, 'pi pi-phone' ],
] )

@Pipe( {
    name: 'optionIcon', standalone: true,
} )
export class ProjectOptionIconPipe implements PipeTransform {
    public transform (value: ProjectOptionEnum): string {
        return optionIcons.get( value ) ?? ''
    }
}
