import { Pipe, PipeTransform } from '@angular/core'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'

const optionIcons: Map<ProjectOptionEnum, string> = new Map<ProjectOptionEnum, string>( [
    [ ProjectOptionEnum.VEHICLE, 'pi pi-car' ],
    [ ProjectOptionEnum.ACTIVITY, 'pi pi-hammer' ],
    [ ProjectOptionEnum.COMMUNICATION, 'pi pi-comment' ],
    [ ProjectOptionEnum.ALERT, 'pi pi-exclamation-triangle' ],
] )

/**
 * Purpose: Gives the icon of a project option.
 * Scope: Maps each option to its icon class.
 * Limits: Returns an empty text for an unknown option.
 */
@Pipe( {
    name: 'optionIcon', standalone: true,
} )
export class ProjectOptionIconPipe implements PipeTransform {
    public transform (value: ProjectOptionEnum): string {
        return optionIcons.get( value ) ?? ''
    }
}
