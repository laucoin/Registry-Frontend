import { ElementActionEnum } from '../../util-model/enumeration/element-action.enum'

export interface ContextConfigModel {
    theme: unknown
    logo: {
        light: string
        dark: string
    }
    defaultLanguage: string
    maintainerEmail: string
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
