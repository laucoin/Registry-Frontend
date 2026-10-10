export interface ProjectsListSearch {
    textSearched: string | undefined
    dateTimeSearched: Date | undefined
    withProfile: boolean | undefined
    visibilitySearched: boolean | undefined
}

export type VisibilityChoice = '' | 'true' | 'false'

export interface ProjectsListSearchModel {
    textSearched: string
    dateTimeSearched: Date | null
    withProfile: boolean
    visibilitySearched: VisibilityChoice
}

export function toProjectsListSearchModel (params: ProjectsListSearch): ProjectsListSearchModel {
    return {
        textSearched: params.textSearched ?? '',
        dateTimeSearched: params.dateTimeSearched ?? null,
        withProfile: params.withProfile ?? false,
        visibilitySearched: params.visibilitySearched === undefined ? '' : params.visibilitySearched ? 'true' : 'false',
    }
}

export function toProjectsListSearchParams (model: ProjectsListSearchModel): ProjectsListSearch {
    return {
        textSearched: model.textSearched === '' ? undefined : model.textSearched,
        dateTimeSearched: model.dateTimeSearched ?? undefined,
        withProfile: model.withProfile,
        visibilitySearched: model.visibilitySearched === '' ? undefined : model.visibilitySearched === 'true',
    }
}
