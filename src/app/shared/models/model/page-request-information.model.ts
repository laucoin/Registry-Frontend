import { GenericModel } from '@shared/models/model/generic.model'
import { PageModel } from '@shared/models/model/page.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { NotificationModel } from '@shared/models/model/notification.model'

export interface PageRequestInformationModel<P, M extends GenericModel> extends ElementRequestInformationModel<PageModel<M>> {
    params: P
    silentLoading: boolean
    error: NotificationModel | undefined
}
