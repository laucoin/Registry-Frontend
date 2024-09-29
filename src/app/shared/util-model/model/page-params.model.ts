import { OrderEnum } from '../enumeration/order.enum'

export interface PageParamsModel {
    order: OrderEnum
    onlyVisible: boolean
    searched: string | undefined
}
