export type BooleanChoice = '' | 'true' | 'false'

/**
 * Purpose: Converts an optional boolean filter into the string held by a select option.
 * Scope: Maps undefined to the empty choice, true to 'true' and false to 'false'.
 * Limits: Pure mapping; it knows nothing about the lists using it.
 */
export function toBooleanChoice (value: boolean | undefined): BooleanChoice {
    return value === undefined ? '' : value ? 'true' : 'false'
}

/**
 * Purpose: Converts the string held by a boolean select back into an optional boolean filter.
 * Scope: Maps the empty choice to undefined, 'true' to true and 'false' to false.
 * Limits: Pure mapping; it knows nothing about the lists using it.
 */
export function fromBooleanChoice (choice: BooleanChoice): boolean | undefined {
    return choice === '' ? undefined : choice === 'true'
}
