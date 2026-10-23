/**
 * Purpose: Computes the age of a person.
 * Scope: Counts the full years between an ISO birth date and a given day.
 * Limits: Pure function; an invalid birth date gives no age.
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
