import { HistoryModel } from './history.model'

export interface GenericModel {
    id: string | undefined
    visible: boolean | undefined
    creation: HistoryModel | undefined
    edition: HistoryModel | undefined
}
