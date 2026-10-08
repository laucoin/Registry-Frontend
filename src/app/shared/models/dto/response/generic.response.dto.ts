import { HistoryResponseDto } from '@shared/models/dto/response/history.response.dto'

export interface GenericResponseDto {
    id: string
    visible: boolean
    creation: HistoryResponseDto
    lastEdition: HistoryResponseDto
}
