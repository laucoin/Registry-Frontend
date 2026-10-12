import { Pipe, PipeTransform } from '@angular/core'

/**
 * Purpose: Gives the translation key of a form title.
 * Scope: Suffixes a base key with edit or create.
 * Limits: Returns a key; translation is done by the caller.
 */
@Pipe( {
    name: 'formTitle', standalone: true,
} )
export class FormTitlePipe implements PipeTransform {
    public transform (value: string, element: unknown | undefined): string {
        return `${value}.${element ? 'edit' : 'create'}`
    }
}
