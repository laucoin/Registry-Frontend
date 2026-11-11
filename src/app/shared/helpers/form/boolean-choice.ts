export type BooleanChoice = '' | 'true' | 'false';

/**
 * Objectif: Convertit un filtre booléen optionnel en la chaîne détenue par une option de select.
 * Périmètre: Mappe undefined vers le choix vide, true vers 'true' et false vers 'false'.
 * Limites: Mapping pur ; ne connaît rien des listes qui l'utilisent.
 */
export function toBooleanChoice(value: boolean | undefined): BooleanChoice {
	return value === undefined ? '' : `${value}`;
}

/**
 * Objectif: Convertit la chaîne détenue par un select booléen en filtre booléen optionnel.
 * Périmètre: Mappe le choix vide vers undefined, 'true' vers true et 'false' vers false.
 * Limites: Mapping pur ; ne connaît rien des listes qui l'utilisent.
 */
export function fromBooleanChoice(choice: BooleanChoice): boolean | undefined {
	return choice === '' ? undefined : choice === 'true';
}
