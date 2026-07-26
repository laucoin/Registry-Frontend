/**
 * How long typing must settle before an auto-search fires. Long enough that a
 * word is not one request per letter, short enough that the list feels tied to
 * the keyboard. Shared with the eligibility pickers so every remote search in
 * the app reacts at the same pace.
 */
export const AUTO_SEARCH_DELAY_MS = 400

/**
 * Below this many characters a trigram search returns most of the table, so the
 * round trip costs more than it tells anyone. Clearing the field is exempt —
 * see ListSearchPanel.
 */
export const AUTO_SEARCH_MIN_LENGTH = 4
