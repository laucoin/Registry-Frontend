/**
 * Purpose: Calcule l'âge d'une personne.
 * Scope: Compte les années pleines entre une date de naissance ISO et un jour donné.
 * Limits: Fonction pure ; une date de naissance invalide ne donne aucun âge.
 */
export class AgeHelper {
    public static ageOn (birthday: string, today: Date): number | undefined {
        const [ year, month, day ]: number[] = birthday.split( '-' ).map( Number )
        if (!year || !month || !day) {
            return undefined
        }

        const hadBirthday: boolean = today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day)
        return today.getFullYear() - year - (hadBirthday ? 0 : 1)
    }
}
