/**
 * Maximum lengths, mirrored from the backend's Bean Validation `@Size(max=…)`
 * which in turn mirrors the column widths. Kept in ONE place because the value
 * has to appear twice in the UI — as the input's `maxlength` (so the field
 * simply stops accepting characters) and as the counter that tells the user how
 * much room is left — and a form that lets someone type 200 characters only to
 * have the API refuse the save is the failure mode this exists to prevent.
 *
 * Changing a column width means changing the backend annotation AND this table;
 * `tests/shared/field-limits.test.ts` states the pairing so the drift is at
 * least visible.
 */
export const FIELD_LIMIT = {
	projectName: 150,
	participantFirstName: 150,
	participantLastName: 150,
	groupName: 150,
	activityName: 150,
	activityDescription: 2000,
	vehicleLicensePlate: 20,
	vehicleBrand: 150,
	vehicleModel: 150,
	alertTitle: 50,
	communicationMessage: 250,
} as const

export type FieldLimitName = keyof typeof FIELD_LIMIT
