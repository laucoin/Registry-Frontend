import type { SgdfTimelineRange } from '@sgdf/ui/timeline'
import { DateHelper } from '@shared/helpers/date.helper'
import { StringHelper } from '@shared/helpers/string.helper'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { OutingModel } from '@shared/models/model/outing.model'
import { TimelineRangeModel } from '@shared/models/model/timeline-range.model'

export interface TimelineAxisModel {
    start: string
    end: string
}

/**
 * Purpose: Prépare les données d'une frise `sgdf-timeline` : son axe et ses plages, prévues ou réelles.
 * Scope: Convertit les dates du backend en dates-heures civiles locales (`AAAA-MM-JJTHH:mm`) et complète les bornes ouvertes avec l'axe.
 * Limits: Ne traduit aucun texte et n'affiche rien ; les libellés des sorties sont fournis par l'appelant.
 */
export class TimelineHelper {
    public static toCivil (date: Date): string {
        const day: string = [ date.getFullYear(), date.getMonth() + 1, date.getDate() ]
            .map( (part: number, index: number): string => StringHelper.formatDigits( part, index === 0 ? 4 : 2 ) ).join( '-' )
        const time: string = [ date.getHours(), date.getMinutes() ].map( (part: number): string => StringHelper.formatDigits( part, 2 ) ).join( ':' )

        return `${day}T${time}`
    }

    public static axis (
        begin: CustomDatetimeModel | undefined,
        end: CustomDatetimeModel | undefined,
        planned: TimelineRangeModel[],
        actual: OutingModel[],
    ): TimelineAxisModel | undefined {
        const times: number[] = TimelineHelper.knownDates( planned, actual ).map( (date: Date): number => date.getTime() )
        const start: Date | undefined = DateHelper.toDate( begin, 'min' ) ?? ( times.length ? new Date( Math.min( ...times ) ) : undefined )
        const stop: Date | undefined = DateHelper.toDate( end, 'max' ) ?? ( times.length ? new Date( Math.max( ...times ) ) : undefined )

        return start && stop && stop > start ? { start: TimelineHelper.toCivil( start ), end: TimelineHelper.toCivil( stop ) } : undefined
    }

    public static plannedRanges (planned: TimelineRangeModel[], axis: TimelineAxisModel): SgdfTimelineRange[] {
        return planned.map( (range: TimelineRangeModel): SgdfTimelineRange => ({
            start: range.start ? TimelineHelper.toCivil( DateHelper.toDate( range.start, 'min' )! ) : axis.start,
            end: range.end ? TimelineHelper.toCivil( DateHelper.toDate( range.end, 'max' )! ) : axis.end,
            variant: 'info',
        }) )
    }

    public static outingRanges (actual: OutingModel[], ongoingLabel: (outing: OutingModel) => string): SgdfTimelineRange[] {
        return actual.map( (outing: OutingModel): SgdfTimelineRange => ({
            start: TimelineHelper.toCivil( outing.start ),
            end: TimelineHelper.toCivil( outing.end ),
            variant: outing.ongoing ? 'danger' : 'warning',
            label: outing.ongoing ? ongoingLabel( outing ) : undefined,
        }) )
    }

    private static knownDates (planned: TimelineRangeModel[], actual: OutingModel[]): Date[] {
        const plannedDates: (Date | undefined)[] = planned.flatMap( (range: TimelineRangeModel): (Date | undefined)[] => [
            DateHelper.toDate( range.start, 'min' ),
            DateHelper.toDate( range.end, 'max' ),
        ] )
        const outingDates: Date[] = actual.flatMap( (outing: OutingModel): Date[] => [ outing.start, outing.end ] )

        return [ ...plannedDates, ...outingDates ].filter( (date: Date | undefined): date is Date => date !== undefined )
    }
}
