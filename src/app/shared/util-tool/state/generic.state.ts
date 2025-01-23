import { ToastMessageOptions } from 'primeng/api'
import { ErrorModel } from '../../util-model/model/error.model'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { inject } from '@angular/core'
import { StateUtil } from './state.util'
import { PageRequestInformationModel } from '../../util-model/model/page-request-information.model'
import { PageParamsModel } from '../../util-model/model/page-params.model'
import { GenericModel } from '../../util-model/model/generic.model'

export abstract class GenericState {
    protected readonly registryFacade: RegistryFacade = inject( RegistryFacade )

    protected buildErrorMessage<P extends PageParamsModel, M extends GenericModel> (
        requestInformation: PageRequestInformationModel<P, M>,
        error: ErrorModel,
    ): PageRequestInformationModel<P, M> {
        return {
            ...requestInformation,
            error: {
                severity: 'error',
                summary: error.title,
                detail: error.message,
                icon: 'pi pi-exclamation-triangle',
                closable: true,
            },
        }
    }

    protected buildMessageAndNotify (
        severity: 'info' | 'success' | 'warn' | 'error' | 'secondary' | 'contrast',
        summary: string,
        detail: string,
        icon: string | undefined = undefined,
        data: object | undefined = undefined,
    ): void {
        const message: ToastMessageOptions = StateUtil.buildNotificationMessage(
            severity,
            summary,
            detail,
            icon,
            data,
        )

        this.registryFacade.notify( message )
    }
}
