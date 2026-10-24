import { Pipe, PipeTransform } from '@angular/core'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'

const optionIcons: Map<ProjectOptionEnum, string> = new Map<ProjectOptionEnum, string>( [
    [ ProjectOptionEnum.VEHICLE, 'car' ],
    [ ProjectOptionEnum.ACTIVITY, 'hammer' ],
    [ ProjectOptionEnum.COMMUNICATION, 'comment' ],
    [ ProjectOptionEnum.ALERT, 'triangle-exclamation' ],
] )

/**
 * Purpose: Gives the icon of a project option.
 * Scope: Maps each option to its `@sgdf/ui` solid icon name.
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
