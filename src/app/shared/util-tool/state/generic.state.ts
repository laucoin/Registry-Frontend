import { HttpErrorResponse } from '@angular/common/http'
import { Message } from 'primeng/api'
import { AppConfig } from '../../../app.config'
import { ErrorModel } from '../../util-model/model/error.model'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { inject } from '@angular/core'
import { StateUtil } from './state.util'
import { ElementRequestInformationModel } from '../../util-model/model/element-request-information.model'

export abstract class GenericState {
    protected readonly registryFacade: RegistryFacade = inject( RegistryFacade )

    protected buildError (error: HttpErrorResponse): Message {
        const registryError: ErrorModel | undefined = error.error
        let title: string
        let message: string

        switch (true) {
            case [ undefined, 0, 503 ].includes( registryError?.status ):
                title = 'error.title.503'
                message = 'error.message.503'
                break
            case registryError?.message.trim().length === registryError?.message.length:
                title = `error.title.${registryError?.status}`
                message = `error.message.${registryError?.message}`
                break
            default:
                title = `error.title.${error.status}`
                message = `error.message.${error.status}`
                break
        }

        return StateUtil.buildNotificationMessage(
            'error',
            title,
            message,
            'pi pi-exclamation-triangle',
            {
                ...registryError?.args ?? [],
                maintainerEmail: AppConfig.config.maintainerEmail,
            },
        )
    }

    protected buildErrorMessageAndNotify<M, I extends ElementRequestInformationModel<M>> (
        requestInformation: I,
        error: HttpErrorResponse,
    ): I {
        const message: Message = this.buildError( error )
        this.registryFacade.notify( message )
        return {
            ...requestInformation,
            error: message,
        }
    }

    protected buildMessageAndNotify (
        severity: 'info' | 'success' | 'warn' | 'error' | 'secondary' | 'contrast',
        summary: string,
        detail: string,
        icon: string | undefined = undefined,
        data: object | undefined = undefined,
    ): void {
        const message: Message = StateUtil.buildNotificationMessage(
            severity,
            summary,
            detail,
            icon,
            data,
        )

        this.registryFacade.notify( message )
    }
}
