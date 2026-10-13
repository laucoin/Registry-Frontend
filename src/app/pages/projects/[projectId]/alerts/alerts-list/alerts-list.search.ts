import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface AlertsListSearch {
    q: string | undefined
    status: string | undefined
    isVisible: boolean | undefined
    from: Date | undefined
    to: Date | undefined
}

export interface AlertsListSearchModel {
    q: string
    status: string
    isVisible: BooleanChoice
    from: Date | null
    to: Date | null
}

/**
 * Purpose: Converts the alerts list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toAlertsListSearchModel (params: AlertsListSearch): AlertsListSearchModel {
    return {
        q: params.q ?? '',
        status: params.status ?? '',
        isVisible: toBooleanChoice( params.isVisible ),
        from: params.from ?? null,
        to: params.to ?? null,
    }
}

/**
 * Purpose: Converts the search form values into the alerts list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toAlertsListSearchParams (model: AlertsListSearchModel): AlertsListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        status: model.status === '' ? undefined : model.status,
        isVisible: fromBooleanChoice( model.isVisible ),
        from: model.from ?? undefined,
        to: model.to ?? undefined,
    }
}
