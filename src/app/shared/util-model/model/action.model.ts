import { ConfirmationModel } from './confirmation.model'
import { ActionableItemModel } from './actionable-item.model'

export interface ActionModel<A> extends ActionableItemModel {
    id: A
    name: string
    icon: string | undefined
    disabled: boolean | undefined
    confirmation: ConfirmationModel | undefined
}
