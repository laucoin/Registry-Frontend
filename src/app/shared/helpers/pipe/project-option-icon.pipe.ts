import { Pipe, PipeTransform } from '@angular/core'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'

const optionIcons: Map<ProjectOptionEnum, string> = new Map<ProjectOptionEnum, string>( [
    [ ProjectOptionEnum.VEHICLE, 'pi pi-car' ],
    [ ProjectOptionEnum.ACTIVITY, 'pi pi-hammer' ],
    [ ProjectOptionEnum.COMMUNICATION, 'pi pi-comment' ],
    [ ProjectOptionEnum.ALERT, 'pi pi-exclamation-triangle' ],
] )

const sgdfOptionIcons: Map<ProjectOptionEnum, string> = new Map<ProjectOptionEnum, string>( [
    [ ProjectOptionEnum.VEHICLE, 'car' ],
    [ ProjectOptionEnum.ACTIVITY, 'hammer' ],
    [ ProjectOptionEnum.COMMUNICATION, 'comment' ],
    [ ProjectOptionEnum.ALERT, 'triangle-exclamation' ],
] )

/**
 * Purpose: Gives the icon of a project option.
 * Scope: Maps each option to its PrimeNG icon class, or to its `@sgdf/ui` solid icon name with the `sgdf` library.
 * Limits: Returns an empty text for an unknown option.
 */
@Pipe( {
    name: 'optionIcon', standalone: true,
} )
export class ProjectOptionIconPipe implements PipeTransform {
    public transform (value: ProjectOptionEnum, library: 'primeng' | 'sgdf' = 'primeng'): string {
        return (library === 'sgdf' ? sgdfOptionIcons : optionIcons).get( value ) ?? ''
    }
}
