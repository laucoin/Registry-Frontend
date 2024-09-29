import { Pipe, PipeTransform } from '@angular/core'

@Pipe( {
    name: 'pluralTranslation', standalone: true, pure: false,
} )
export class PluralTranslationPipe implements PipeTransform {
    public transform (key: string, number: number): string {
        return `${key}.${number <= 1 ? 'singular' : 'plural'}`
    }
}
