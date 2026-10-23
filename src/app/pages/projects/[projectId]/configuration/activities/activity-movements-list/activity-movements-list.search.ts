import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface ActivityMovementsListSearch {
    type: string | undefined
    from: Date | undefined
    to: Date | undefined
    isVisible: boolean | undefined
}

export interface ActivityMovementsListSearchModel {
    type: string
    from: Date | null
    to: Date | null
    isVisible: BooleanChoice
}

/**
 * Purpose: Converts the movements search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toActivityMovementsListSearchModel (params: ActivityMovementsListSearch): ActivityMovementsListSearchModel {
    return {
        type: params.type ?? '',
        from: params.from ?? null,
        to: params.to ?? null,
        isVisible: toBooleanChoice( params.isVisible ),
    }
}

/**
 * Purpose: Converts the search form values into the movements search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toActivityMovementsListSearchParams (model: ActivityMovementsListSearchModel): ActivityMovementsListSearch {
    return {
        type: model.type === '' ? undefined : model.type,
        from: model.from ?? undefined,
        to: model.to ?? undefined,
        isVisible: fromBooleanChoice( model.isVisible ),
    }
}
