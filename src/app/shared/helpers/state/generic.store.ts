import { ToastMessageOptions } from 'primeng/api'
import { ErrorModel } from '@shared/models/model/error.model'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { inject } from '@angular/core'
import { StateUtil } from '@shared/helpers/state/state.util'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { GenericModel } from '@shared/models/model/generic.model'
import { TranslateService } from '@ngx-translate/core'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'

export abstract class GenericStore {
    protected readonly registryFacade: RegistryFacade = inject( RegistryFacade )
    protected readonly translateService: TranslateService = inject( TranslateService )

    protected buildErrorMessage<P, M extends GenericModel> (
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
        severity: SeverityEnum,
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
