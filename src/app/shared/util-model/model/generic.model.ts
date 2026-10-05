import { BaseModel } from './base.model'
import { HistoryModel } from './history.model'

export interface GenericModel extends BaseModel {
	visible: boolean
	creation: HistoryModel
	lastEdition: HistoryModel
}
