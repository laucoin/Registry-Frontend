import { Pipe, PipeTransform } from '@angular/core'

@Pipe( {
    name: 'formButton', standalone: true,
} )
export class FormButtonPipe implements PipeTransform {
    public transform (element: unknown | undefined): string {
        return `global.actions.${element ? 'edit' : 'create'}`
    }
}
