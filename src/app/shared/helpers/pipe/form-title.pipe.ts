import { Pipe, PipeTransform } from '@angular/core'

@Pipe( {
    name: 'formTitle', standalone: true,
} )
export class FormTitlePipe implements PipeTransform {
    public transform (value: string, element: unknown | undefined): string {
        return `${value}.${element ? 'edit' : 'create'}`
    }
}
