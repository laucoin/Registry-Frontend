export type BooleanChoice = '' | 'true' | 'false'

/**
 * Purpose: Convertit un filtre booléen optionnel en la chaîne détenue par une option de select.
 * Scope: Mappe undefined vers le choix vide, true vers 'true' et false vers 'false'.
 * Limits: Mapping pur ; ne connaît rien des listes qui l'utilisent.
 */
export function toBooleanChoice (value: boolean | undefined): BooleanChoice {
    return value === undefined ? '' : value ? 'true' : 'false'
}

/**
 * Purpose: Convertit la chaîne détenue par un select booléen en filtre booléen optionnel.
 * Scope: Mappe le choix vide vers undefined, 'true' vers true et 'false' vers false.
 * Limits: Mapping pur ; ne connaît rien des listes qui l'utilisent.
 */
export function fromBooleanChoice (choice: BooleanChoice): boolean | undefined {
    return choice === '' ? undefined : choice === 'true'
}
