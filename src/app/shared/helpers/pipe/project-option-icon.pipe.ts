import { Pipe, PipeTransform } from '@angular/core';

import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';

const optionIcons = new Map<ProjectOptionEnum, string>([
	[ProjectOptionEnum.VEHICLE, 'car'],
	[ProjectOptionEnum.ACTIVITY, 'hammer'],
	[ProjectOptionEnum.COMMUNICATION, 'comment'],
	[ProjectOptionEnum.ALERT, 'triangle-exclamation'],
]);

/**
 * Objectif: Donne l'icône d'une option de projet.
 * Périmètre: Mappe chaque option vers le nom de son icône solid `@sgdf/ui`.
 * Limites: Renvoie un texte vide pour une option inconnue.
 */
@Pipe({
	name: 'optionIcon',
})
export class ProjectOptionIconPipe implements PipeTransform {
	public transform(value: ProjectOptionEnum): string {
		return optionIcons.get(value) ?? '';
	}
}
