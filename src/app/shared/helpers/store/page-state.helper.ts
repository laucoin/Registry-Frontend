import { NotificationModel } from '@shared/models/model/notification.model'
import { GenericModel } from '@shared/models/model/generic.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'

/**
 * Purpose: Builds and updates page request state blocks.
 * Scope: Creates the initial block of a paged resource, attaches an error to it and turns a backend error into the notification a section shows.
 * Limits: Pure functions; stores own the state.
 */
export class PageStateHelper {
    public static initial<P, M extends GenericModel> (params: P): PageRequestInformationModel<P, M> {
        return { element: undefined, params: params, loading: false, silentLoading: false, error: undefined }
    }

    public static withError<P, M extends GenericModel> (
        block: PageRequestInformationModel<P, M>,
        error: ErrorModel,
    ): PageRequestInformationModel<P, M> {
        return { ...block, error: PageStateHelper.toNotification( error ) }
    }

    public static toNotification (error: ErrorModel): NotificationModel {
        return {
            severity: 'error',
            summary: error.title,
            detail: error.message,
            closable: true,
        }
    }
}
