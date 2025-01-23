import { GenericModel } from './generic.model'
import { PageParamsModel } from './page-params.model'
import { PageModel } from './page.model'
import { ElementRequestInformationModel } from './element-request-information.model'
import { ToastMessageOptions } from 'primeng/api'

export interface PageRequestInformationModel<P extends PageParamsModel, M extends GenericModel> extends ElementRequestInformationModel<PageModel<M>> {
    params: P
    silentLoading: boolean
    error: ToastMessageOptions | undefined
}
