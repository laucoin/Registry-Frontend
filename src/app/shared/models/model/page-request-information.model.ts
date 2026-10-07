import { GenericModel } from '@shared/models/model/generic.model'
import { PageModel } from '@shared/models/model/page.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { ToastMessageOptions } from 'primeng/api'

export interface PageRequestInformationModel<P, M extends GenericModel> extends ElementRequestInformationModel<PageModel<M>> {
    params: P
    silentLoading: boolean
    error: ToastMessageOptions | undefined
}
