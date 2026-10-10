import { TestBed } from '@angular/core/testing'
import { beforeEach, describe, expect, it } from 'vitest'
import { MetadataStore } from '@core/registry/state/metadata.store'
import { provideTestConfig } from '@shared/helpers/testing/test-fixtures'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'

describe( 'MetadataStore', () => {
    beforeEach( () => {
        provideTestConfig()
    } )

    it( 'offers the system, light and dark themes in that order', () => {
        // Arrange
        const store: InstanceType<typeof MetadataStore> = TestBed.inject( MetadataStore )

        // Act
        const values: ThemeEnum[] = store.themes().map( (item: { value?: ThemeEnum }): ThemeEnum => item.value! )

        // Assert
        expect( values ).toEqual( [ ThemeEnum.SYSTEM, ThemeEnum.LIGHT, ThemeEnum.DARK ] )
    } )

    it( 'builds the language options from the configured languages', () => {
        // Arrange
        const store: InstanceType<typeof MetadataStore> = TestBed.inject( MetadataStore )

        // Act
        const languages: { label?: string, value?: string }[] = store.languages()

        // Assert
        expect( languages ).toEqual( [
            { label: 'global.language.fr', value: 'fr' },
            { label: 'global.language.en', value: 'en' },
        ] )
    } )
} )
