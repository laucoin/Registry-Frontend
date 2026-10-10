import { ThemeEnum } from '@shared/models/enumeration/theme.enum'
import { ThemeChoiceModel } from '@shared/models/model/theme-choice.model'

export const THEME_CHOICES: readonly ThemeChoiceModel[] = [
	{ theme: ThemeEnum.LIGHT, labelKey: 'myAccount.theme.light', icon: 'sun' },
	{ theme: ThemeEnum.DARK, labelKey: 'myAccount.theme.dark', icon: 'moon' },
	{ theme: ThemeEnum.SYSTEM, labelKey: 'myAccount.theme.system', icon: 'desktop' },
]
