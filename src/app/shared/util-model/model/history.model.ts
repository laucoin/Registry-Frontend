import { HistoryUserModel } from './history-user.model'

export interface HistoryModel {
    dateTime: Date,
    user: HistoryUserModel | undefined,
}
