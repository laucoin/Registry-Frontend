import { inject, Pipe, PipeTransform } from '@angular/core'
import {TranslocoService} from '@jsverse/transloco'
import { DatePipe } from '@angular/common'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { DateHelper } from '@shared/helpers/date.helper'

/**
 * Purpose: Formate une date-heure personnalisée en date, en heure ou les deux.
 * Scope: Choisit le motif traduit selon ce que contient la valeur.
 * Limits: Renvoie undefined pour une valeur vide.
 */
@Pipe( {
    name: 'customDateFormat', standalone: true, pure: false,
} )
export class CustomDateFormatPipe implements PipeTransform {
    private readonly datePipe: DatePipe = inject( DatePipe )
    private readonly translateService: TranslocoService = inject( TranslocoService )

    public transform (value: CustomDatetimeModel | undefined | null): string | undefined {
        const formattedValue: Date | undefined = DateHelper.toDate( value )

        if (GenericHelper.isNull( formattedValue )) return undefined

        let type: 'date' | 'time' | 'datetime' = 'datetime'
        if (GenericHelper.isNull( value?.date )) type = 'time'
        if (GenericHelper.isNull( value?.time )) type = 'date'
        const translationKey: string = `global.date-and-time-format.${type}`

        return this.datePipe.transform(
            formattedValue!.toString(),
            this.translateService.translate( translationKey ),
        ) ?? undefined
    }
}
