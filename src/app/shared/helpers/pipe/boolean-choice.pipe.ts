import { Pipe, PipeTransform } from '@angular/core'
import { toBooleanChoice, BooleanChoice } from '@shared/helpers/form/boolean-choice'

/**
 * Purpose: Donne la valeur de l'option de select d'un filtre booléen.
 * Scope: Transforme le booléen optionnel d'un choix en sa chaîne.
 * Limits: Mapping pur ; le select et ses libellés appartiennent à l'appelant.
 */
@Pipe({ name: 'booleanChoice', standalone: true })
export class BooleanChoicePipe implements PipeTransform {
    public transform(value: boolean | undefined): BooleanChoice {
        return toBooleanChoice(value)
    }
}
