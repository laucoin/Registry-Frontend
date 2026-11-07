import type { SgdfTimelineRange } from '@sgdf/ui/timeline';

import { DateHelper } from '@shared/helpers/date.helper';
import { StringHelper } from '@shared/helpers/string.helper';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { OutingModel } from '@shared/models/model/outing.model';
import { TimelineRangeModel } from '@shared/models/model/timeline-range.model';

export interface TimelineAxisModel {
	start: string;
	end: string;
}

function knownDates(planned: TimelineRangeModel[], actual: OutingModel[]): Date[] {
	const plannedDates = planned.flatMap((range) => [
		DateHelper.toDate(range.start, 'min'),
		DateHelper.toDate(range.end, 'max'),
	]);
	const outingDates = actual.flatMap((outing) => [outing.start, outing.end]);

	return [...plannedDates, ...outingDates].filter((date): date is Date => date !== undefined);
}

function boundaryOf(boundary: CustomDatetimeModel | undefined, mode: 'min' | 'max', fallback: string): string {
	const date = DateHelper.toDate(boundary, mode);
	return date ? TimelineHelper.toCivil(date) : fallback;
}

function edgeOf(edge: CustomDatetimeModel | undefined, mode: 'min' | 'max', times: number[]): Date | undefined {
	const known = DateHelper.toDate(edge, mode);
	if (known || !times.length) return known;
	return new Date(mode === 'min' ? Math.min(...times) : Math.max(...times));
}

/**
 * Purpose: Prépare les données d'une frise `sgdf-timeline` : son axe et ses plages, prévues ou réelles.
 * Scope: Convertit les dates du backend en dates-heures civiles locales (`AAAA-MM-JJTHH:mm`) et complète les bornes ouvertes avec l'axe.
 * Limits: Ne traduit aucun texte et n'affiche rien ; les libellés des sorties sont fournis par l'appelant.
 */
export const TimelineHelper = {
	toCivil(date: Date): string {
		const day = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
			.map((part, index) => StringHelper.formatDigits(part, index === 0 ? 4 : 2))
			.join('-');
		const time = [date.getHours(), date.getMinutes()].map((part) => StringHelper.formatDigits(part, 2)).join(':');

		return `${day}T${time}`;
	},

	axis(
		begin: CustomDatetimeModel | undefined,
		end: CustomDatetimeModel | undefined,
		planned: TimelineRangeModel[],
		actual: OutingModel[],
	): TimelineAxisModel | undefined {
		const times = knownDates(planned, actual).map((date) => date.getTime());
		const start = edgeOf(begin, 'min', times);
		const stop = edgeOf(end, 'max', times);

		return start && stop && stop > start
			? { start: TimelineHelper.toCivil(start), end: TimelineHelper.toCivil(stop) }
			: undefined;
	},

	plannedRanges(planned: TimelineRangeModel[], axis: TimelineAxisModel): SgdfTimelineRange[] {
		return planned.map((range): SgdfTimelineRange => ({
			start: boundaryOf(range.start, 'min', axis.start),
			end: boundaryOf(range.end, 'max', axis.end),
			variant: 'info',
		}));
	},

	outingRanges(actual: OutingModel[], ongoingLabel: (outing: OutingModel) => string): SgdfTimelineRange[] {
		return actual.map((outing): SgdfTimelineRange => ({
			start: TimelineHelper.toCivil(outing.start),
			end: TimelineHelper.toCivil(outing.end),
			variant: outing.ongoing ? 'danger' : 'warning',
			label: outing.ongoing ? ongoingLabel(outing) : undefined,
		}));
	},
} as const;
