/**
 * `LIVE` : données opérationnelles qui changent toute la journée (mouvements, alertes, statuts).
 * `COUNTS` : chiffres affichés sur la page d'accueil et la liste des projets.
 * `DAY_BOUND` : données valables uniquement pour la journée en cours (arrivées, départs, anniversaires, participants en dépassement).
 */
export enum RefreshKindEnum {
	LIVE = 'live',
	COUNTS = 'counts',
	DAY_BOUND = 'dayBound',
}
