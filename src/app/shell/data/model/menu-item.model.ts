import { AppRouteEnum } from '../../../app-route.enum'
import { ActionableItemModel } from '../../../shared/util-model/model/actionable-item.model'

export interface MenuItemModel extends ActionableItemModel {
    label: string
    icon: string
    url?: AppRouteEnum | string | undefined
    items?: MenuItemModel[] | undefined
}
