import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'

export interface TimelineRangeModel {
    start: CustomDatetimeModel | undefined
    end: CustomDatetimeModel | undefined
}
