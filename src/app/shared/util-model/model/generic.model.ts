import { HistoryModel } from './history.model'
import { BaseModel } from './base.model'

export interface GenericModel extends BaseModel {
    visible: boolean
    creation: HistoryModel
    lastEdition: HistoryModel
}
