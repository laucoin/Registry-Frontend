import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum'
import { RefreshChoiceModel } from '@shared/models/model/refresh-choice.model'

export const REFRESH_CHOICES: readonly RefreshChoiceModel[] = [
	{ mode: RefreshModeEnum.OFF, labelKey: 'myAccount.refresh.off' },
	{ mode: RefreshModeEnum.ECO, labelKey: 'myAccount.refresh.eco' },
	{ mode: RefreshModeEnum.NORMAL, labelKey: 'myAccount.refresh.normal' },
	{ mode: RefreshModeEnum.FAST, labelKey: 'myAccount.refresh.fast' },
]
