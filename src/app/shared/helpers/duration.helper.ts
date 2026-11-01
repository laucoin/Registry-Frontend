const SECONDS_PER_MINUTE: number = 60
const SECONDS_PER_HOUR: number = 3600
const SECONDS_PER_DAY: number = 86400

/**
 * Purpose: Convertit une durée en secondes en durée ISO 8601 lisible par `sgdf-format-duration`.
 * Scope: Décompose les secondes en jours, heures et minutes, ou en heures et minutes sans jours, et arrondit à la minute dès qu'une minute est atteinte.
 * Limits: Ne formate pas le texte affiché ; la langue et les unités relèvent du composant d'affichage.
 */
export class DurationHelper {
    public static toIsoHours (seconds: number): string {
        if (seconds < SECONDS_PER_MINUTE) return DurationHelper.toIsoDuration( seconds )

        const totalMinutes: number = Math.round( seconds / SECONDS_PER_MINUTE )
        const hours: number = Math.floor( totalMinutes / 60 )
        const minutes: number = totalMinutes % 60

        return `PT${hours > 0 ? `${hours}H` : ''}${minutes > 0 ? `${minutes}M` : ''}`
    }

    public static toIsoDuration (seconds: number): string {
        const total: number = seconds < SECONDS_PER_MINUTE
            ? Math.max( 0, Math.round( seconds ) )
            : Math.round( seconds / SECONDS_PER_MINUTE ) * SECONDS_PER_MINUTE
        const days: number = Math.floor( total / SECONDS_PER_DAY )
        const hours: number = Math.floor( ( total % SECONDS_PER_DAY ) / SECONDS_PER_HOUR )
        const minutes: number = Math.floor( ( total % SECONDS_PER_HOUR ) / SECONDS_PER_MINUTE )
        const rest: number = total % SECONDS_PER_MINUTE
        const date: string = days > 0 ? `${days}D` : ''
        const time: string = `${hours > 0 ? `${hours}H` : ''}${minutes > 0 ? `${minutes}M` : ''}${rest > 0 ? `${rest}S` : ''}`

        return time || date ? `P${date}${time ? `T${time}` : ''}` : 'PT0S'
    }
}
