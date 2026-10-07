import {GenericModel} from '@shared/models/model/generic.model'
import {PageRequestInformationModel} from '@shared/models/model/page-request-information.model'
import {PageModel} from '@shared/models/model/page.model'
import {ElementRequestInformationModel} from '@shared/models/model/element-request-information.model'
import {ToastMessageOptions} from 'primeng/api'
import {RegistryConfig} from '@core/config/registry.config'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {SeverityEnum} from '@shared/models/enumeration/severity.enum'

export class StateHelper {
    public static updatePageLoader<P, M extends GenericModel>(
        requestInformation: PageRequestInformationModel<P, M>,
        loading: boolean,
    ): PageRequestInformationModel<P, M> {
        if (!loading) {
            return {
                ...requestInformation,
                loading: loading,
                silentLoading: loading,
            }
        }

        const page: PageModel<M> | undefined = requestInformation.element
        if (GenericHelper.isNull(page) || page!.content?.length == 0) {
            return {
                ...requestInformation,
                loading: loading,
            }
        } else {
            return {
                ...requestInformation,
                silentLoading: loading,
            }
        }
    }

    public static updateElementLoader<M extends GenericModel>(
        requestInformation: ElementRequestInformationModel<M>,
        loading: boolean,
    ): ElementRequestInformationModel<M> {
        return {
            ...requestInformation,
            loading: loading,
        }
    }

    public static buildNotificationMessage(
        severity: SeverityEnum,
        summary: string | undefined,
        detail: string,
        icon: string | undefined = undefined,
        data: object | undefined = undefined,
    ): ToastMessageOptions {
        const life: number | undefined = this.notificationLife(severity)
        return {
            severity: severity,
            summary: summary,
            detail: detail,
            data: data,
            icon: icon,
            closable: true,
            life: life,
            sticky: !life,
        }
    }

    private static notificationLife(severity: SeverityEnum): number | undefined {
        const index: number = Object.keys(RegistryConfig.config.notification.duration).findIndex((key: string): boolean => key === severity)
        return Object.values(RegistryConfig.config.notification.duration)[index]
    }
}
