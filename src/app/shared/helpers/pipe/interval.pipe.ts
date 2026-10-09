import { inject, Pipe, PipeTransform } from '@angular/core'
import {TranslocoService} from '@jsverse/transloco'
import { IntervalModel } from '@shared/models/model/interval.model'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { StringHelper } from '@shared/helpers/string.helper'

/**
 * Purpose: Formats a duration interval for display.
 * Scope: Shows the two largest units from days up and a clock format below.
 * Limits: Returns undefined for an empty interval.
 */
@Pipe( {
    name: 'intervalFormat', standalone: true,
} )
export class IntervalPipe implements PipeTransform {
    private readonly pluralTranslation: PluralTranslationPipe = inject( PluralTranslationPipe )
    private readonly translateService: TranslocoService = inject( TranslocoService )

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
            case value.hourCount.value > 0:
                return this.formatClock( [ value.hourCount, value.minuteCount, value.secondCount ] )
            case value.secondCount.value > 0:
            case value.minuteCount.value > 0:
                return this.formatClock( [ value.minuteCount, value.secondCount ] )
            default:
                return undefined
        }
    }

    private formatClock (units: SelectOptionModel<number>[]): string {
        return units.map( (unit: SelectOptionModel<number>): string => StringHelper.formatDigits( unit.value, 2 ) ).join( ':' )
    }

    private buildLabel (first: SelectOptionModel<number>, second: SelectOptionModel<number>, translationKey: string): string {
        const firstKey: string = this.pluralTranslation.transform( `${translationKey}.${first.label}`, first.value )
        const secondKey: string = this.pluralTranslation.transform( `${translationKey}.${second.label}`, second.value )
        return this.translateService.translate(
            `${translationKey}.interval`,
            {
                first: this.translateService.translate( firstKey, { count: first.value } ),
                second: this.translateService.translate( secondKey, { count: second.value } ),
            },
        )
    }
}
