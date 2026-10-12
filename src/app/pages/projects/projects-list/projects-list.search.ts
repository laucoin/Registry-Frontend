import { fromBooleanChoice, toBooleanChoice, BooleanChoice } from '@shared/helpers/form/boolean-choice'

interface ProjectsListSearch {
    textSearched: string | undefined
    dateTimeSearched: Date | undefined
    visibilitySearched: boolean | undefined
}

export interface ProjectsListSearchModel {
    textSearched: string
    dateTimeSearched: Date | null
    visibilitySearched: BooleanChoice
}

/**
 * Purpose: Converts the projects list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toProjectsListSearchModel (params: ProjectsListSearch): ProjectsListSearchModel {
    return {
        textSearched: params.textSearched ?? '',
        dateTimeSearched: params.dateTimeSearched ?? null,
        visibilitySearched: toBooleanChoice(params.visibilitySearched),
    }
}

/**
 * Purpose: Converts the search form values into the projects list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toProjectsListSearchParams (model: ProjectsListSearchModel): ProjectsListSearch {
    return {
        textSearched: model.textSearched === '' ? undefined : model.textSearched,
        dateTimeSearched: model.dateTimeSearched ?? undefined,
        visibilitySearched: fromBooleanChoice(model.visibilitySearched),
    }
}
