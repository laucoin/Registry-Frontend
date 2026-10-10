import { WritableSignal } from '@angular/core'
import { FieldTree, form } from '@angular/forms/signals'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'

export interface SettingFormModel {
    theme: ThemeEnum
    language: string
}

export function toSettingFormModel (theme: ThemeEnum | undefined, language: string): SettingFormModel {
    return { theme: theme ?? ThemeEnum.SYSTEM, language }
}

export function createSettingForm (model: WritableSignal<SettingFormModel>): FieldTree<SettingFormModel> {
    return form( model )
}
