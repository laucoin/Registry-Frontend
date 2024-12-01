import { Pipe, PipeTransform } from '@angular/core'

@Pipe( {
    name: 'isPast', standalone: true,
} )
export class DateIsPastPipe implements PipeTransform {
    public transform (value: Date | undefined): boolean {
        return !value ? false : new Date( value ) < new Date()
    }
}
