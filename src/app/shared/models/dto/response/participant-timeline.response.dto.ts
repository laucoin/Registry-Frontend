import { OutingResponseDto } from '@shared/models/dto/response/outing.response.dto'
import { TimelineRangeResponseDto } from '@shared/models/dto/response/timeline-range.response.dto'

export interface ParticipantTimelineResponseDto {
    planned: TimelineRangeResponseDto[]
    actual: OutingResponseDto[]
}
