import { fromBooleanChoice, toBooleanChoice, BooleanChoice } from '@shared/helpers/form/boolean-choice'

interface ProjectsListSearch {
    q: string | undefined
    at: Date | undefined
    isVisible: boolean | undefined
    isFavorite: boolean | undefined
}

export interface ProjectsListSearchModel {
    q: string
    at: Date | null
    isVisible: BooleanChoice
    isFavorite: BooleanChoice
}

/**
 * Purpose: Converts the projects list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toProjectsListSearchModel (params: ProjectsListSearch): ProjectsListSearchModel {
    return {
        q: params.q ?? '',
        at: params.at ?? null,
        isVisible: toBooleanChoice(params.isVisible),
        isFavorite: toBooleanChoice(params.isFavorite),
    }
}

/**
 * Purpose: Converts the search form values into the projects list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toProjectsListSearchParams (model: ProjectsListSearchModel): ProjectsListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        at: model.at ?? undefined,
        isVisible: fromBooleanChoice(model.isVisible),
        isFavorite: fromBooleanChoice(model.isFavorite),
    }
}
