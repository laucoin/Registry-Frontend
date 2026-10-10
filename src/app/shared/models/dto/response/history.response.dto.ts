import { HistoryUserResponseDto } from '@shared/models/dto/response/history-user.response.dto'

export interface HistoryResponseDto {
    dateTime: Date
    user: HistoryUserResponseDto | undefined
}
