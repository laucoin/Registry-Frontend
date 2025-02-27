import { inject, Pipe, PipeTransform } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { GenericUtil } from '../util/generic.util'

@Pipe( {
    name: 'pluralTranslation', standalone: true, pure: false,
} )
export class PluralTranslationPipe implements PipeTransform {
    private translateService: TranslateService = inject( TranslateService )

    public transform (key: string, number: number | unknown[] | undefined = undefined): string {
        const size: number | undefined = number instanceof Array ? number.length : number
        const zeroKey: string = `${key}.zero`
        const twoKey: string = `${key}.two`

        switch (true) {
            case size === 0 && this.translateService.instant( zeroKey ) !== zeroKey:
                return `${key}.zero`
            case size === 0 || size === 1:
                return `${key}.one`
            case size === 2 && this.translateService.instant( twoKey ) !== twoKey: {
                return twoKey
            }
            case GenericUtil.nonNull( size ) && size! >= 2: {
                return `${key}.few`
            }
            default:
                return `${key}.other`
        }
    }
}
