import { Pipe, PipeTransform } from '@angular/core'

/**
 * Purpose: Gives the translation key of a form submit button.
 * Scope: Edit for an existing element, create otherwise.
 * Limits: Returns a key; translation is done by the caller.
 */
@Pipe( {
    name: 'formButton', standalone: true,
} )
export class FormButtonPipe implements PipeTransform {
    public transform (element: unknown | undefined): string {
        return `global.actions.${element ? 'edit' : 'create'}`
    }
}
