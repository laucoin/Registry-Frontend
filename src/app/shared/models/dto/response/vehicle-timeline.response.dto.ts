import { OutingResponseDto } from '@shared/models/dto/response/outing.response.dto'
import { TimelineRangeResponseDto } from '@shared/models/dto/response/timeline-range.response.dto'

export interface VehicleTimelineResponseDto {
    planned: TimelineRangeResponseDto[]
    actual: OutingResponseDto[]
    outSeconds: number
    usageRate: number | null
}
