import { PageParamsModel } from '../../util-model/model/page-params.model'
import { GenericModel } from '../../util-model/model/generic.model'
import { PageRequestInformationModel } from '../../util-model/model/page-request-information.model'
import { PageModel } from '../../util-model/model/page.model'
import { ElementRequestInformationModel } from '../../util-model/model/element-request-information.model'
import { Message } from 'primeng/api'
import { AppConfig } from '../../../app.config'
import { GenericUtil } from '../util/generic.util'

export class StateUtil {
    public static updatePageLoader<P extends PageParamsModel, M extends GenericModel> (
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
        if (GenericUtil.isNull( page ) || page!.content?.length == 0) {
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

    public static updateElementLoader<M extends GenericModel> (
        requestInformation: ElementRequestInformationModel<M>,
        loading: boolean,
    ): ElementRequestInformationModel<M> {
        return {
            ...requestInformation,
            loading: loading,
        }
    }

    public static buildNotificationMessage (
        severity: 'info' | 'success' | 'warn' | 'error' | 'secondary' | 'contrast',
        summary: string | undefined,
        detail: string,
        icon: string | undefined = undefined,
        data: object | undefined = undefined,
    ): Message {
        const life: number | undefined = this.notificationLife( severity )
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

    private static notificationLife (severity: 'info' | 'success' | 'warn' | 'error' | 'secondary' | 'contrast'): number | undefined {
        const index: number = Object.keys( AppConfig.config.notification.duration ).findIndex( (key: string): boolean => key === severity )
        return Object.values( AppConfig.config.notification.duration )[index]
    }
}
