import {LaraBaseDesignTokens} from "@primeuix/themes/lara/base"
import {ElementActionEnum} from '../../util-model/enumeration/element-action.enum'
import {Preset} from "@primeuix/themes/types"

export interface ConfigModel {
    defaultLanguage: string
    languages: string[]
    primeNg: Preset<LaraBaseDesignTokens>
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
