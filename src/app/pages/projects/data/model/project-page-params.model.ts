export interface ProjectPageParamsModel {
    resetSearch: boolean
    isVisible: boolean | undefined
    q: string | undefined
    at: string | undefined
    isFavorite: boolean | undefined
    withProfile: boolean | undefined
    sort?: string
}
