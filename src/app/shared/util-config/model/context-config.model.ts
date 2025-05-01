import { ElementActionEnum } from '../../util-model/enumeration/element-action.enum'

export interface ContextConfigModel {
    theme: unknown
    logo: {
        light: string
        dark: string
    }
    defaultLanguage: string
    maintainerEmail: string
    user: {
        actions: ElementActionEnum[]
    }
    project: {
        actions: ElementActionEnum[]
    }
    projectProfile: {
        actions: ElementActionEnum[]
    }
    participant: {
        actions: ElementActionEnum[]
    }
    movement: {
        actions: ElementActionEnum[]
    },
    group: {
        actions: ElementActionEnum[]
    }
    vehicle: {
        actions: ElementActionEnum[]
    }
    activity: {
        actions: ElementActionEnum[]
    }
    notification: {
        duration: {
            info: number
            success: number
            warn: number
            secondary: number
            contrast: number
        }
    }
}
