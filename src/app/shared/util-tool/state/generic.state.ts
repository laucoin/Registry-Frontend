import { inject } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { ToastMessageOptions } from 'primeng/api'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'
import { ErrorModel } from '../../util-model/model/error.model'
import { GenericModel } from '../../util-model/model/generic.model'
import { PageRequestInformationModel } from '../../util-model/model/page-request-information.model'
import { StateUtil } from './state.util'

export abstract class GenericState {
	protected readonly registryFacade: RegistryFacade = inject(RegistryFacade)
	protected readonly translateService: TranslateService = inject(TranslateService)

	protected buildErrorMessage<P, M extends GenericModel>(
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

	protected buildMessageAndNotify(
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

		this.registryFacade.notify(message)
	}
}
