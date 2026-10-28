import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum'
import { ActionableItemModel } from '@shared/models/model/actionable-item.model'

export interface MenuItemModel extends ActionableItemModel {
	label: string
	/** Libellé affiché à la place de `label` quand l'utilisateur n'a pas l'autorité donnée. */
	fallbackLabel?: { unlessAuthority: UserAuthorityEnum; label: string }
	icon?: {
		library: string
		name: string
	}
	url?: RegistryRouteEnum | string | undefined
	items?: MenuItemModel[] | undefined
}
