const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;

function roundedSeconds(seconds: number): number {
	if (seconds < SECONDS_PER_MINUTE) return Math.max(0, Math.round(seconds));
	return Math.round(seconds / SECONDS_PER_MINUTE) * SECONDS_PER_MINUTE;
}

function unitOf(count: number, suffix: string): string {
	return count > 0 ? `${count}${suffix}` : '';
}

/**
 * Purpose: Convertit une durée en secondes en durée ISO 8601 lisible par `sgdf-format-duration`.
 * Scope: Décompose les secondes en jours, heures et minutes, ou en heures et minutes sans jours, et arrondit à la minute dès qu'une minute est atteinte.
 * Limits: Ne formate pas le texte affiché ; la langue et les unités relèvent du composant d'affichage.
 */
export const DurationHelper = {
	toIsoHours(seconds: number): string {
		if (seconds < SECONDS_PER_MINUTE) return DurationHelper.toIsoDuration(seconds);

		const totalMinutes = Math.round(seconds / SECONDS_PER_MINUTE);
		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;

		return `PT${hours > 0 ? `${hours}H` : ''}${minutes > 0 ? `${minutes}M` : ''}`;
	},

	toIsoDuration(seconds: number): string {
		const total = roundedSeconds(seconds);
		const date = unitOf(Math.floor(total / SECONDS_PER_DAY), 'D');
		const time =
			unitOf(Math.floor((total % SECONDS_PER_DAY) / SECONDS_PER_HOUR), 'H') +
			unitOf(Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE), 'M') +
			unitOf(total % SECONDS_PER_MINUTE, 'S');

		if (!time && !date) return 'PT0S';
		return `P${date}${time ? `T${time}` : ''}`;
	},
} as const;
