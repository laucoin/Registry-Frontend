import { HistoryUserModel } from '@shared/models/model/history-user.model'

export interface HistoryModel {
    dateTime: Date,
    user: HistoryUserModel | undefined,
}
