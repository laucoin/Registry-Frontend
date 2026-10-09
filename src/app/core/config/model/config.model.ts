import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'

export interface ConfigModel {
	defaultLanguage: string
	languages: string[]
	logo: {
		normal: {
			light: string
			dark: string
		}
		small: {
			light: string
			dark: string
		}
	}
	application: {
		name: string
		organization: string
		version?: string
		creator: {
			name: string
			email: string
			website: string
		}
		support: {
			documentationUrl?: string
			issuesUrl?: string
		}
	}
	enabledActions: ElementActionEnum[]
	notification: {
		duration: {
			info: number | undefined
			success: number | undefined
			warn: number | undefined
			error: number | undefined
			secondary: number | undefined
			contrast: number | undefined
		}
	}
}
