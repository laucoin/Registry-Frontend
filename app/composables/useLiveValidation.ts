import type { Ref } from 'vue'

export type FieldRule<T> = (value: T) => string | null

/**
 * Live field validation, deliberately small: a rule is a function from the
 * value to an error key (or null). No schema library — the rules Registry
 * needs are "required", "too long" and a couple of cross-field date checks,
 * and the API remains the authority for everything else. Adding Zod here would
 * buy a second source of truth for constraints the backend already owns.
 *
 * The behaviour that matters is WHEN the error shows:
 *  - never before the field has been touched, so a fresh form is not a wall of
 *    red;
 *  - from the first blur onward, live on every keystroke — once someone has
 *    seen the error, watching it clear as they fix it is the whole point;
 *  - and on demand (`touchAll`) when a step or a submit is attempted, so a
 *    field never silently blocks progress.
 */
export function useField<T>(source: Ref<T>, rules: FieldRule<T>[]) {
	const touched = ref(false)

	const error = computed<string | null>(() => {
		for (const rule of rules) {
			const failure = rule(source.value)
			if (failure) {
				return failure
			}
		}
		return null
	})

	const visibleError = computed(() => (touched.value ? error.value : null))

	return {
		touched,
		error,
		visibleError,
		valid: computed(() => error.value === null),
		touch: () => {
			touched.value = true
		},
	}
}

export interface ValidatedField {
	error: Readonly<Ref<string | null>>
	visibleError: Readonly<Ref<string | null>>
	valid: Readonly<Ref<boolean>>
	touch: () => void
}

/**
 * Groups fields so a step or a submit can ask one question ("is this valid?")
 * and, when it is not, reveal every offending field at once rather than one
 * per attempt.
 */
export function useValidationGroup(fields: ValidatedField[]) {
	return {
		valid: computed(() => fields.every(field => field.valid.value)),
		touchAll: () => fields.forEach(field => field.touch()),
	}
}

export const rules = {
	required: (message: string): FieldRule<string> => value => (value.trim() ? null : message),
	maxLength: (limit: number, message: (limit: number) => string): FieldRule<string> => value =>
		(value.length > limit ? message(limit) : null),
}
