import { Pipe, PipeTransform } from '@angular/core'

/**
 * Purpose: Gives the icon of a form action.
 * Scope: Pen for an existing element, plus otherwise.
 * Limits: Returns a class name only.
 */
@Pipe( {
    name: 'formIcon', standalone: true,
} )
export class FormIconPipe implements PipeTransform {
    public transform (element: unknown | undefined): string {
        return element ? 'pi pi-pen-to-square' : 'pi pi-plus'
    }
}
