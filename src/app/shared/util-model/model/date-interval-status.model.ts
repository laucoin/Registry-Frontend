import { DateIntervalModel } from './date-interval.model'

export interface DateIntervalStatusModel {
    status: 'FINISHED' | 'IN_PROGRESS' | 'PLANNED',
    interval: DateIntervalModel | undefined
}
