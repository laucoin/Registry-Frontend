import { DateIntervalModel } from './date-interval.model'
import { IntervalStatusEnum } from '../enumeration/interval-status.enum'

export interface DateIntervalStatusModel {
    status: IntervalStatusEnum,
    interval: DateIntervalModel | undefined
}
