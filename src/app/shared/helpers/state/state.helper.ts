import { ConfigModel } from '@core/config/model/config.model';
import { RegistryConfig } from '@core/config/registry.config';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model';
import { GenericModel } from '@shared/models/model/generic.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model';

function notificationLife(severity: SeverityEnum): number | undefined {
	return RegistryConfig.config.notification.duration[severity as keyof ConfigModel['notification']['duration']];
}

/**
 * Objectif: Construit les états de loader et les messages de notification.
 * Périmètre: Calcule les drapeaux de chargement de page et d'élément et les options de notification avec leur durée de vie configurée.
 * Limites: Ne détient aucun état propre.
 */
export const StateHelper = {
	updatePageLoader<P, M extends GenericModel>(
		requestInformation: PageRequestInformationModel<P, M>,
		loading: boolean,
	): PageRequestInformationModel<P, M> {
		if (!loading) {
			return {
				...requestInformation,
				loading: loading,
				silentLoading: loading,
			};
		}

		const page = requestInformation.element;
		if (GenericHelper.isNull(page) || page.content?.length == 0) {
			return {
				...requestInformation,
				loading: loading,
			};
		} else {
			return {
				...requestInformation,
				silentLoading: loading,
			};
		}
	},

	updateElementLoader<M extends GenericModel>(
		requestInformation: ElementRequestInformationModel<M>,
		loading: boolean,
	): ElementRequestInformationModel<M> {
		return {
			...requestInformation,
			loading: loading,
		};
	},

	buildNotificationMessage(
		severity: SeverityEnum,
		summary: string | undefined,
		detail: string,
		data: object | undefined = undefined,
	): NotificationModel {
		const life = notificationLife(severity);
		return {
			severity: severity,
			summary: summary,
			detail: detail,
			data: data,
			closable: true,
			life: life,
			sticky: !life,
		};
	},
} as const;
