import { Pipe, PipeTransform } from '@angular/core'
import { toBooleanChoice, BooleanChoice } from '@shared/helpers/form/boolean-choice'

/**
 * Purpose: Gives the value of the select option of a boolean filter.
 * Scope: Turns the optional boolean of a choice into its string.
 * Limits: Pure mapping; the select and its labels belong to the caller.
 */
@Pipe({ name: 'booleanChoice', standalone: true })
export class BooleanChoicePipe implements PipeTransform {
    public transform(value: boolean | undefined): BooleanChoice {
        return toBooleanChoice(value)
    }
}
