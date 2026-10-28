import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum'

/**
 * `live` : données opérationnelles qui changent toute la journée (mouvements, alertes, statuts).
 * `counts` : chiffres affichés sur la page d'accueil et la liste des projets.
 * `dayBound` : données valables uniquement pour la journée en cours (arrivées, départs, anniversaires, participants en dépassement).
 */
export type RefreshKind = 'live' | 'counts' | 'dayBound'

const SECOND: number = 1000

/** Délai minimal entre deux rechargements automatiques d'une source, par mode. `undefined` signifie aucun rechargement périodique. */
export const REFRESH_INTERVALS: Readonly<Record<RefreshModeEnum, Readonly<Record<RefreshKind, number | undefined>>>> = {
    [ RefreshModeEnum.OFF ]: { live: undefined, counts: undefined, dayBound: undefined },
    [ RefreshModeEnum.ECO ]: { live: 180 * SECOND, counts: 300 * SECOND, dayBound: undefined },
    [ RefreshModeEnum.NORMAL ]: { live: 60 * SECOND, counts: 120 * SECOND, dayBound: undefined },
    [ RefreshModeEnum.FAST ]: { live: 30 * SECOND, counts: 60 * SECOND, dayBound: undefined },
}

/** Période de la vérification globale ; le plus court intervalle ci-dessus doit rester un multiple de celle-ci. */
export const REFRESH_TICK_MS: number = 5 * SECOND
