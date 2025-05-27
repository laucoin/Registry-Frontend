import { inject, Pipe, PipeTransform } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { IntervalModel } from '../../util-model/model/interval.model'
import { PluralTranslationPipe } from './plural-translation.pipe'
import { SelectItem } from 'primeng/api'
import { StringUtil } from '../util/string.util'

@Pipe( {
    name: 'intervalFormat', standalone: true,
} )
export class IntervalPipe implements PipeTransform {
    private readonly pluralTranslation: PluralTranslationPipe = inject( PluralTranslationPipe )
    private readonly translateService: TranslateService = inject( TranslateService )

    public transform (
        value: IntervalModel | undefined,
        translationKey: string = 'global.date-and-time-format',
    ): string | undefined {
        if (!value) return undefined

        switch (true) {
            case value.yearCount.value > 0:
                return this.buildLabel( value.yearCount, value.monthCount, translationKey )
            case value.monthCount.value > 0:
                return this.buildLabel( value.monthCount, value.dayCount, translationKey )
            case value.dayCount.value > 0:
                return this.buildLabel( value.dayCount, value.hourCount, translationKey )
            case value.hourCount.value > 0: {
                const formattedHourCount: string = StringUtil.formatDigits( value.hourCount.value, 2 )
                const formattedMinuteCount: string = StringUtil.formatDigits( value.minuteCount.value, 2 )
                const formattedSecondCount: string = StringUtil.formatDigits( value.secondCount.value, 2 )
                return `${formattedHourCount}:${formattedMinuteCount}:${formattedSecondCount}`
            }
            case value.secondCount.value > 0:
            case value.minuteCount.value > 0: {
                const formattedMinuteCount: string = StringUtil.formatDigits( value.minuteCount.value, 2 )
                const formattedSecondCount: string = StringUtil.formatDigits( value.secondCount.value, 2 )
                return `${formattedMinuteCount}:${formattedSecondCount}`
            }
            default:
                return undefined
        }
    }

    private buildLabel (first: SelectItem<number>, second: SelectItem<number>, translationKey: string): string {
        const firstKey: string = this.pluralTranslation.transform( `${translationKey}.${first.label}`, first.value )
        const secondKey: string = this.pluralTranslation.transform( `${translationKey}.${second.label}`, second.value )
        return this.translateService.instant(
            `${translationKey}.interval`,
            {
                first: this.translateService.instant( firstKey, { count: first.value } ),
                second: this.translateService.instant( secondKey, { count: second.value } ),
            },
        )
    }
}
