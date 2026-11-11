import { ErrorModel } from '@shared/models/model/error.model';
import { GenericModel } from '@shared/models/model/generic.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model';

/**
 * Objectif: Construit et met à jour les blocs d'état de requête de page.
 * Périmètre: Crée le bloc initial d'une ressource paginée, lui attache une erreur et transforme une erreur du backend en la notification qu'affiche une section.
 * Limites: Fonctions pures ; les stores possèdent l'état.
 */
export const PageStateHelper = {
	initial<P, M extends GenericModel>(params: P): PageRequestInformationModel<P, M> {
		return { element: undefined, params: params, loading: false, silentLoading: false, error: undefined };
	},

	withError<P, M extends GenericModel>(
		block: PageRequestInformationModel<P, M>,
		error: ErrorModel,
	): PageRequestInformationModel<P, M> {
		return { ...block, error: PageStateHelper.toNotification(error) };
	},

	toNotification(error: ErrorModel): NotificationModel {
		return {
			severity: 'error',
			summary: error instanceof ErrorModel ? error.title : undefined,
			detail: error instanceof ErrorModel ? error.message : undefined,
			closable: true,
		};
	},
} as const;
