import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface AlertsListSearch {
    textSearched: string | undefined
    statusSearched: string | undefined
    visibilitySearched: boolean | undefined
    startDateTimeSearched: Date | undefined
    endDateTimeSearched: Date | undefined
}

export interface AlertsListSearchModel {
    textSearched: string
    statusSearched: string
    visibilitySearched: BooleanChoice
    startDateTimeSearched: Date | null
    endDateTimeSearched: Date | null
}

/**
 * Purpose: Converts the alerts list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toAlertsListSearchModel (params: AlertsListSearch): AlertsListSearchModel {
    return {
        textSearched: params.textSearched ?? '',
        statusSearched: params.statusSearched ?? '',
        visibilitySearched: toBooleanChoice( params.visibilitySearched ),
        startDateTimeSearched: params.startDateTimeSearched ?? null,
        endDateTimeSearched: params.endDateTimeSearched ?? null,
    }
}

/**
 * Purpose: Converts the search form values into the alerts list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toAlertsListSearchParams (model: AlertsListSearchModel): AlertsListSearch {
    return {
        textSearched: model.textSearched === '' ? undefined : model.textSearched,
        statusSearched: model.statusSearched === '' ? undefined : model.statusSearched,
        visibilitySearched: fromBooleanChoice( model.visibilitySearched ),
        startDateTimeSearched: model.startDateTimeSearched ?? undefined,
        endDateTimeSearched: model.endDateTimeSearched ?? undefined,
    }
}
