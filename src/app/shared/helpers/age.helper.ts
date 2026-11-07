function hadBirthdayThisYear(today: Date, month: number, day: number): boolean {
	const currentMonth = today.getMonth() + 1;
	return currentMonth > month || (currentMonth === month && today.getDate() >= day);
}

/**
 * Purpose: Calcule l'âge d'une personne.
 * Scope: Compte les années pleines entre une date de naissance ISO et un jour donné.
 * Limits: Fonction pure ; une date de naissance invalide ne donne aucun âge.
 */
export const AgeHelper = {
	ageOn(birthday: string, today: Date): number | undefined {
		const [year, month, day]: number[] = birthday.split('-').map(Number);
		if (!year || !month || !day) {
			return undefined;
		}

		return today.getFullYear() - year - (hadBirthdayThisYear(today, month, day) ? 0 : 1);
	},
} as const;
