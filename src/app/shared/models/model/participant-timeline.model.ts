import { OutingModel } from '@shared/models/model/outing.model'
import { TimelineRangeModel } from '@shared/models/model/timeline-range.model'

export interface ParticipantTimelineModel {
    planned: TimelineRangeModel[]
    actual: OutingModel[]
}
