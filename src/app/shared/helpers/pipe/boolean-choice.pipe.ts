import { Pipe, PipeTransform } from '@angular/core';

import { BooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice';

/**
 * Objectif: Donne la valeur de l'option de select d'un filtre booléen.
 * Périmètre: Transforme le booléen optionnel d'un choix en sa chaîne.
 * Limites: Mapping pur ; le select et ses libellés appartiennent à l'appelant.
 */
@Pipe({ name: 'booleanChoice' })
export class BooleanChoicePipe implements PipeTransform {
	public transform(value: boolean | undefined): BooleanChoice {
		return toBooleanChoice(value);
	}
}
