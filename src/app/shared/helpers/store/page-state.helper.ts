import { NotificationModel } from '@shared/models/model/notification.model'
import { GenericModel } from '@shared/models/model/generic.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'

/**
 * Purpose: Construit et met à jour les blocs d'état de requête de page.
 * Scope: Crée le bloc initial d'une ressource paginée, lui attache une erreur et transforme une erreur du backend en la notification qu'affiche une section.
 * Limits: Fonctions pures ; les stores possèdent l'état.
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
