import { beforeEach, describe, expect, it } from 'vitest'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { provideTestConfig, pageOf } from '@shared/helpers/testing/test-fixtures'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { GenericModel } from '@shared/models/model/generic.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { RegistryConfig } from '@core/config/registry.config'

type Block = PageRequestInformationModel<object, GenericModel>

describe( 'StateHelper', () => {
    beforeEach( () => {
        provideTestConfig()
    } )

    it( 'uses the plain loader while nothing is displayed yet', () => {
        // Arrange
        const block: Block = PageStateHelper.initial<object, GenericModel>( {} )

        // Act
        const loading: Block = StateHelper.updatePageLoader( block, true )

        // Assert
        expect( loading.loading ).toBe( true )
        expect( loading.silentLoading ).toBe( false )
    } )

    it( 'uses the plain loader when the displayed page is empty', () => {
        // Arrange
        const block: Block = { ...PageStateHelper.initial<object, GenericModel>( {} ), element: pageOf<GenericModel>( [] ) }

        // Act
        const loading: Block = StateHelper.updatePageLoader( block, true )

        // Assert
        expect( loading.loading ).toBe( true )
    } )

    it( 'uses the silent loader when content is already displayed', () => {
        // Arrange
        const block: Block = { ...PageStateHelper.initial<object, GenericModel>( {} ), element: pageOf<GenericModel>( [ { id: '1' } as GenericModel ] ) }

        // Act
        const loading: Block = StateHelper.updatePageLoader( block, true )

        // Assert
        expect( loading.silentLoading ).toBe( true )
        expect( loading.loading ).toBe( false )
    } )

    it( 'clears both loaders when loading stops', () => {
        // Arrange
        const block: Block = { ...PageStateHelper.initial<object, GenericModel>( {} ), loading: true, silentLoading: true }

        // Act
        const stopped: Block = StateHelper.updatePageLoader( block, false )

        // Assert
        expect( stopped.loading ).toBe( false )
        expect( stopped.silentLoading ).toBe( false )
    } )

    it( 'toggles the element loader without touching the element', () => {
        // Arrange
        const block: { element: { id: string } | undefined, loading: boolean } = { element: { id: 'a' }, loading: false }

        // Act
        const loading: typeof block = StateHelper.updateElementLoader( block as never, true ) as unknown as typeof block

        // Assert
        expect( loading.loading ).toBe( true )
        expect( loading.element ).toEqual( { id: 'a' } )
    } )

    it( 'gives a notification the configured life of its severity', () => {
        // Arrange
        RegistryConfig.config.notification.duration.success = 3000

        // Act
        const message: ReturnType<typeof StateHelper.buildNotificationMessage> = StateHelper.buildNotificationMessage( SeverityEnum.SUCCESS, 'title', 'detail', 'pi pi-check', { a: 1 } )

        // Assert
        expect( message ).toEqual( expect.objectContaining( { severity: 'success', summary: 'title', detail: 'detail', life: 3000, sticky: false, closable: true, data: { a: 1 } } ) )
    } )

    it( 'makes a notification sticky when its severity has no configured life', () => {
        // Arrange
        const severity: SeverityEnum = SeverityEnum.DANGER

        // Act
        const message: ReturnType<typeof StateHelper.buildNotificationMessage> = StateHelper.buildNotificationMessage( severity, undefined, 'detail' )

        // Assert
        expect( message.sticky ).toBe( true )
        expect( message.life ).toBeUndefined()
    } )
} )
