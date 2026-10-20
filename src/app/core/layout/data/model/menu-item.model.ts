import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum'
import { ActionableItemModel } from '@shared/models/model/actionable-item.model'

export interface MenuItemModel extends ActionableItemModel {
	label: string
	/** Label shown instead of `label` when the user lacks the given authority. */
	fallbackLabel?: { unlessAuthority: UserAuthorityEnum; label: string }
	icon?: {
		library: string
		name: string
	}
	url?: RegistryRouteEnum | string | undefined
	items?: MenuItemModel[] | undefined
}
