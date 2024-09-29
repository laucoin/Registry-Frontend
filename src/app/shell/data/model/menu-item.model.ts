import { AppRouteEnum } from '../../../app-route.enum'
import { ActionableItemModel } from '../../../shared/util-model/model/actionable-item.model'

export interface MenuItemModel extends ActionableItemModel {
    name: string
    icon: string
    route: AppRouteEnum
    enabled: boolean
}
