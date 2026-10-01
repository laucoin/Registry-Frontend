interface CustomDateTimeLike {
	date: string;
	time: string | null;
}

/**
 * Purpose: Static formatting helpers for dates and date ranges, in the app's fixed `fr-FR` locale.
 * Scope: Pure, stateless formatting functions; usable from any layer (component, facade, store, api).
 * Limits: Locale is hardcoded to `fr-FR` — not i18n-aware.
 */
export class DateTimeHelper {
	private static readonly _locale: string = 'fr-FR';
	private static readonly _dayMonthFormat: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
	private static readonly _dayMonthYearFormat: Intl.DateTimeFormatOptions = {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	};

	public static formatDateRange(
		begin: CustomDateTimeLike | null | undefined,
		end: CustomDateTimeLike | null | undefined,
	): string {
		if (!begin && !end) {
			return '';
		}
		if (!end || !begin) {
			return DateTimeHelper._formatDate(new Date((begin ?? end)!.date), DateTimeHelper._dayMonthYearFormat);
		}

		const beginDate: Date = new Date(begin.date);
		const endDate: Date = new Date(end.date);

		return `${DateTimeHelper._formatDate(beginDate, DateTimeHelper._dayMonthFormat)} – ${DateTimeHelper._formatDate(endDate, DateTimeHelper._dayMonthYearFormat)}`;
	}

	public static formatDate(isoDateTime: string | null | undefined): string {
		if (!isoDateTime) {
			return '';
		}
		return DateTimeHelper._formatDate(new Date(isoDateTime), DateTimeHelper._dayMonthYearFormat);
	}

	private static _formatDate(date: Date, format: Intl.DateTimeFormatOptions): string {
		return new Intl.DateTimeFormat(DateTimeHelper._locale, format).format(date);
	}
}
