import { Pipe, PipeTransform } from '@angular/core'

/**
 * Purpose: Donne la clé de traduction du bouton de soumission d'un formulaire.
 * Scope: Édition pour un élément existant, création sinon.
 * Limits: Renvoie une clé ; la traduction est faite par l'appelant.
 */
@Pipe( {
    name: 'formButton', standalone: true,
} )
export class FormButtonPipe implements PipeTransform {
    public transform (element: unknown | undefined): string {
        return `global.actions.${element ? 'edit' : 'create'}`
    }
}
