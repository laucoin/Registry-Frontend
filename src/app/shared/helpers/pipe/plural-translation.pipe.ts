import { inject, Pipe, PipeTransform } from '@angular/core'
import {TranslocoService} from '@jsverse/transloco'

@Pipe( {
    name: 'pluralTranslation', standalone: true, pure: false,
} )
export class PluralTranslationPipe implements PipeTransform {
    private translateService: TranslocoService = inject( TranslocoService )

    public transform (key: string, number: number | unknown[] | undefined = undefined): string {
        const size: number | undefined = number instanceof Array ? number.length : number
        const zeroKey: string = `${key}.zero`
        const twoKey: string = `${key}.two`

        switch (true) {
            case size === 0 && this.hasTranslation( zeroKey ):
                return zeroKey
            case size === 0 || size === 1:
                return `${key}.one`
            case size === 2 && this.hasTranslation( twoKey ):
                return twoKey
            default:
                return `${key}.few`
        }
    }

    private hasTranslation (key: string): boolean {
        return key in this.translateService.getTranslation( this.translateService.getActiveLang() )
    }
}
