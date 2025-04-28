import { ConfirmationModel } from './confirmation.model'
import { ActionableItemModel } from './actionable-item.model'
import { ElementActionEnum } from '../enumeration/element-action.enum'

export interface ActionModel extends ActionableItemModel {
    id: ElementActionEnum
    label: string
    icon: string | undefined
    disabled: boolean | undefined
    confirmation?: ConfirmationModel | undefined
}
