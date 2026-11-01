import { OutingModel } from '@shared/models/model/outing.model'
import { TimelineRangeModel } from '@shared/models/model/timeline-range.model'

export interface VehicleTimelineModel {
    planned: TimelineRangeModel[]
    actual: OutingModel[]
    outSeconds: number
    usageRate: number | undefined
}
