import { Pipe, PipeTransform } from '@angular/core'

@Pipe( {
    name: 'formIcon', standalone: true,
} )
export class FormIconPipe implements PipeTransform {
    public transform (element: unknown | undefined): string {
        return element ? 'pi pi-pen-to-square' : 'pi pi-plus'
    }
}
