import { HistoryModel } from '@shared/models/model/history.model'
import { BaseModel } from '@shared/models/model/base.model'

export interface GenericModel extends BaseModel {
    visible: boolean
    creation: HistoryModel | undefined
    lastEdition: HistoryModel | undefined
}
