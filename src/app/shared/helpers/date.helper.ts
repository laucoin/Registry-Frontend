import { GenericHelper } from '@shared/helpers/generic.helper';
import { StringHelper } from '@shared/helpers/string.helper';
import { DateBoundEnum } from '@shared/models/enumeration/date-bound.enum';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { IntervalModel } from '@shared/models/model/interval.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 12 * MONTH_MS;

// Rien à comparer ne correspond jamais ; une valeur manquante correspond toujours.
function compareWith<T>(
	actual: T | undefined,
	other: T | undefined,
	matches: (actual: T, other: T) => boolean,
): boolean {
	if (GenericHelper.isNull(other)) return false;
	return GenericHelper.isNull(actual) || matches(actual, other);
}

function timeUnitsOf(time: string): [number, number, number, number] {
	const [hours, minutes, secondsWithMs]: string[] = time.split(':');
	const [seconds, milliseconds]: string[] = (secondsWithMs ?? '0').split('.');
	return [
		parseInt(hours),
		parseInt(minutes ?? '0'),
		parseInt(seconds),
		parseInt(StringHelper.truncate(milliseconds ?? '0', 3)),
	];
}

function applyDatePart(target: Date, isoDate: string | undefined): void {
	const date = DateHelper.fromIsoDate(isoDate);
	if (date) target.setFullYear(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
	else target.setFullYear(1970, 0, 1);
}

function applyTimePart(target: Date, dateTime: CustomDatetimeModel, mode: DateBoundEnum): void {
	const time = DateHelper.fromIsoTime(dateTime.time, dateTime.date);
	if (time) target.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
	else if (mode === DateBoundEnum.MIN) target.setHours(0, 0, 0, 0);
	else target.setHours(23, 59, 59, 999);
}

function countUnit(
	difference: number,
	unitMs: number,
	modulo: number | undefined,
	label: string,
): SelectOptionModel<number> {
	const count = Math.floor(difference / unitMs);
	return { value: modulo ? count % modulo : count, label };
}

/**
 * Objectif: Utilitaires de date, d'heure et de durée partagés par les formulaires, les filtres et les pipes.
 * Périmètre: Convertit entre dates, date ISO, heure et chaînes de durée et dates-heures personnalisées, les compare et les trie, et découpe un intervalle en unités.
 * Limites: Travaille sur l'horloge locale pour l'affichage et en UTC pour le transport ; ne formate pas pour l'utilisateur.
 */
export const DateHelper = {
	elapsedDays(from: Date | string, now: number): number {
		return Math.floor(Math.max(0, now - new Date(from).getTime()) / DAY_MS);
	},

	formatElapsed(from: Date | string, now: number): string {
		const totalSeconds = Math.max(0, Math.floor((now - new Date(from).getTime()) / SECOND_MS));
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;
		return [hours, minutes, seconds].map((unit) => StringHelper.formatDigits(unit, 2)).join(':');
	},

	getDate(date: Date): string {
		const toFormat = new Date(date);
		return `${toFormat.getFullYear()}-${StringHelper.formatDigits(
			toFormat.getMonth() + 1,
			2,
		)}-${StringHelper.formatDigits(toFormat.getDate(), 2)}`;
	},

	buildDate(date: string | Date | undefined): Date | undefined {
		if (!date) {
			return undefined;
		}

		return new Date(date);
	},

	isCustomBefore(actual: CustomDatetimeModel | undefined, other: CustomDatetimeModel | undefined): boolean {
		return this.isBefore(DateHelper.toDate(actual), DateHelper.toDate(other));
	},

	isBefore(actual: Date | undefined, other: Date | undefined): boolean {
		return compareWith(actual, other, (own, bound) => new Date(own).getTime() < new Date(bound).getTime());
	},

	isCustomDateAfter(actual: CustomDatetimeModel | undefined, other: CustomDatetimeModel | undefined): boolean {
		return this.isAfter(DateHelper.toDate(actual), DateHelper.toDate(other));
	},

	isAfter(actual: Date | undefined, other: Date | undefined): boolean {
		return compareWith(actual, other, (own, bound) => new Date(own).getTime() > new Date(bound).getTime());
	},

	isAfterOrEqual(actual: CustomDatetimeModel | undefined, other: CustomDatetimeModel | undefined): boolean {
		return compareWith(
			actual,
			other,
			(own, bound) => (DateHelper.toDate(own)?.getTime() ?? NaN) >= (DateHelper.toDate(bound)?.getTime() ?? NaN),
		);
	},

	toCustomDateTime(date: Date | undefined): CustomDatetimeModel | undefined {
		if (!date) return undefined;
		const formattedDate = new Date(date);
		return {
			date: DateHelper.toIsoDate(formattedDate),
			time: DateHelper.toIsoTime(formattedDate),
		};
	},

	toIsoDate(date: Date | undefined): string | undefined {
		if (!date) return undefined;
		return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10);
	},

	toIsoTime(time: Date | undefined): string | undefined {
		if (!time) return undefined;
		const dateString = new Date(time).toISOString();
		return dateString.slice(11, dateString.length);
	},

	toIsoInstant(date: Date | undefined): string | undefined {
		return date?.toISOString();
	},

	fromIsoDate(date: string | undefined): Date | undefined {
		if (!date) return undefined;
		return new Date(`${date}T00:00:00Z`);
	},

	fromIsoTime(time: string | undefined, date?: string): Date | undefined {
		if (!time) return undefined;

		const formattedValue = DateHelper.fromIsoDate(date) ?? new Date();
		const [hours, minutes, seconds, milliseconds]: number[] = timeUnitsOf(time);

		formattedValue.setUTCHours(hours, minutes, seconds, milliseconds);

		return formattedValue;
	},

	toDate(
		dateTime: CustomDatetimeModel | undefined | null,
		mode: DateBoundEnum = DateBoundEnum.MIN,
	): Date | undefined {
		if (
			GenericHelper.isNull(dateTime) ||
			(GenericHelper.isNull(dateTime.date) && GenericHelper.isNull(dateTime.time))
		)
			return undefined;

		const formattedValue = new Date();
		applyDatePart(formattedValue, dateTime.date);
		applyTimePart(formattedValue, dateTime, mode);

		return formattedValue;
	},

	buildDateInterval(start: Date | undefined, end: Date | undefined): IntervalModel | undefined {
		if (GenericHelper.isNull(start) || GenericHelper.isNull(end)) return undefined;

		const difference = new Date(end).getTime() - new Date(start).getTime();
		if (difference < 0) return undefined;

		return {
			yearCount: countUnit(difference, YEAR_MS, undefined, 'year'),
			monthCount: countUnit(difference, MONTH_MS, 12, 'month'),
			dayCount: countUnit(difference, DAY_MS, 30, 'day'),
			hourCount: countUnit(difference, HOUR_MS, 24, 'hour'),
			minuteCount: countUnit(difference, MINUTE_MS, 60, 'minute'),
			secondCount: countUnit(difference, SECOND_MS, 60, 'second'),
		};
	},
} as const;
