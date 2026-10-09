import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree } from '@angular/forms/signals'
import { describe, expect, it } from 'vitest'
import { createSettingForm, SettingFormModel, toSettingFormModel } from '@pages/users/settings/setting/setting.form'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'

describe( 'setting form', () => {
    it( 'exposes the theme and the language of the model as fields', () => {
        // Arrange
        const model: WritableSignal<SettingFormModel> = signal( toSettingFormModel( ThemeEnum.SYSTEM, 'fr' ) )
        const tree: FieldTree<SettingFormModel> = TestBed.runInInjectionContext( () => createSettingForm( model ) )

        // Act
        tree.language().value.set( 'en' )

        // Assert
        expect( [ tree.theme().value(), model() ] ).toEqual( [ ThemeEnum.SYSTEM, { theme: ThemeEnum.SYSTEM, language: 'en' } ] )
    } )
} )

describe( 'toSettingFormModel', () => {
    it( 'falls back to the system theme when the user has none', () => {
        // Arrange
        const theme: ThemeEnum | undefined = undefined

        // Act
        const model: SettingFormModel = toSettingFormModel( theme, 'fr' )

        // Assert
        expect( model ).toEqual( { theme: ThemeEnum.SYSTEM, language: 'fr' } )
    } )
} )
