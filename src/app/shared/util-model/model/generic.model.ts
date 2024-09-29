import { HistoryModel } from './history.model'

export interface GenericModel {
    id: string
    visible: boolean
    creation: HistoryModel
    lastEdition: HistoryModel
}
