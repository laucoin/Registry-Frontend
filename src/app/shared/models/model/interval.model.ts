import { SelectOptionModel } from '@shared/models/model/select-option.model'

export interface IntervalModel {
    yearCount: SelectOptionModel<number>
    monthCount: SelectOptionModel<number>
    dayCount: SelectOptionModel<number>
    hourCount: SelectOptionModel<number>
    minuteCount: SelectOptionModel<number>
    secondCount: SelectOptionModel<number>
}
