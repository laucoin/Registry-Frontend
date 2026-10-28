import { NotificationModel } from '@shared/models/model/notification.model'

export interface ElementRequestInformationModel<M> {
    element: M | undefined
    loading: boolean
    error: NotificationModel | undefined
}
