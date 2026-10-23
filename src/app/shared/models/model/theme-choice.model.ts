import { ThemeEnum } from '@shared/models/enumeration/theme.enum'

export interface ThemeChoiceModel {
	theme: ThemeEnum
	labelKey: string
	icon: string
}
