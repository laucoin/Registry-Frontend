import { NotificationModel } from '@shared/models/model/notification.model'

export interface SectionErrorsState {
    sectionErrors: Record<string, NotificationModel | undefined>
}
