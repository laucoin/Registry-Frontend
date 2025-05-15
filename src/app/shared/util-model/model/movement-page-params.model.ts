export interface MovementPageParamsModel {
    resetSearch: boolean
    currentMovements: boolean
    linkedToActivity: boolean | undefined
    visibilitySearched: boolean | undefined
    typeSearched: string | undefined
    startDateTimeSearched: string | undefined
    endDateTimeSearched: string | undefined
}
