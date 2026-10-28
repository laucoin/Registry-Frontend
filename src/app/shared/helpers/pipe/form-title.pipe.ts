import { Pipe, PipeTransform } from '@angular/core'

/**
 * Purpose: Donne la clé de traduction du titre d'un formulaire.
 * Scope: Ajoute à une clé de base le suffixe edit ou create.
 * Limits: Renvoie une clé ; la traduction est faite par l'appelant.
 */
@Pipe( {
    name: 'formTitle', standalone: true,
} )
export class FormTitlePipe implements PipeTransform {
    public transform (value: string, element: unknown | undefined): string {
        return `${value}.${element ? 'edit' : 'create'}`
    }
}
