import { SelectItem } from 'primeng/api'

export interface IntervalModel {
    yearCount: SelectItem<number>
    monthCount: SelectItem<number>
    dayCount: SelectItem<number>
    hourCount: SelectItem<number>
    minuteCount: SelectItem<number>
    secondCount: SelectItem<number>
}
