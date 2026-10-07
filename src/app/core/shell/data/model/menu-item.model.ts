import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { ActionableItemModel } from '@shared/models/model/actionable-item.model'

export interface MenuItemModel extends ActionableItemModel {
    label: string
    icon: string
    url?: RegistryRouteEnum | string | undefined
    items?: MenuItemModel[] | undefined
}
