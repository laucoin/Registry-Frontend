import { ActionableItemModel } from '@shared/models/model/actionable-item.model'
import { ProjectCountsModel } from '@shared/models/model/project.model'

export interface ConfigurationTileModel extends ActionableItemModel {
	key: string
	icon: {
		library: string
		name: string
	}
	url: string
	count: keyof ProjectCountsModel
}
