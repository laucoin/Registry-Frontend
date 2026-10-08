import { inject, Pipe, PipeTransform } from '@angular/core'
import {TranslocoService} from '@jsverse/transloco'
import { GenericHelper } from '@shared/helpers/generic.helper'

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
            case size === 0 && this.translateService.translate( zeroKey ) !== zeroKey:
                return `${key}.zero`
            case size === 0 || size === 1:
                return `${key}.one`
            case size === 2 && this.translateService.translate( twoKey ) !== twoKey: {
                return twoKey
            }
            case GenericHelper.nonNull( size ) && size! >= 2: {
                return `${key}.few`
            }
            default:
                return `${key}.other`
        }
    }
}
