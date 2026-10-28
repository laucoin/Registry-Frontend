import { Pipe, PipeTransform } from '@angular/core'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'

const optionIcons: Map<ProjectOptionEnum, string> = new Map<ProjectOptionEnum, string>( [
    [ ProjectOptionEnum.VEHICLE, 'car' ],
    [ ProjectOptionEnum.ACTIVITY, 'hammer' ],
    [ ProjectOptionEnum.COMMUNICATION, 'comment' ],
    [ ProjectOptionEnum.ALERT, 'triangle-exclamation' ],
] )

/**
 * Purpose: Donne l'icône d'une option de projet.
 * Scope: Mappe chaque option vers le nom de son icône solid `@sgdf/ui`.
 * Limits: Renvoie un texte vide pour une option inconnue.
 */
@Pipe( {
    name: 'optionIcon', standalone: true,
} )
export class ProjectOptionIconPipe implements PipeTransform {
    public transform (value: ProjectOptionEnum): string {
        return optionIcons.get( value ) ?? ''
    }
}
