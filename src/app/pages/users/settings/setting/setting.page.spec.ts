import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { Confirmation, ConfirmationService } from 'primeng/api'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { SettingPage } from '@pages/users/settings/setting/setting.page'
import { autoMock } from '@shared/helpers/testing/auto-mock'

describe( 'SettingPage', () => {
    let registry: Record<string, Mock>
    let confirm: Mock<(confirmation: Confirmation) => void>
    let page: SettingPage

    beforeEach( () => {
        TestBed.resetTestingModule()
        registry = autoMock()
        registry[ 'currentUserTheme' ].mockReturnValue( 'dark' )
        confirm = vi.fn()
        RegistryConfig.config = { enabledActions: [] } as unknown as ConfigModel
        TestBed.configureTestingModule( {
            providers: [
                { provide: ConfirmationService, useValue: { confirm } },
                { provide: RegistryFacade, useValue: registry },
                { provide: SessionFacade, useValue: { currentUser: signal( { id: 'u1' } ), currentUserLanguage: (): string => 'fr', selectedProject: signal( undefined ) } },
                { provide: UiFacade, useValue: autoMock() },
                { provide: Router, useValue: {} },
                { provide: ActivatedRoute, useValue: {} },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
        TestBed.overrideComponent( SettingPage, { set: { template: '', imports: [] } } )
        page = TestBed.createComponent( SettingPage ).componentInstance
    } )

    it( 'starts with the theme and the language of the signed-in user', () => {
        // Arrange
        const controls: { themeControl: { value: string }, languageControl: { value: string } } = page as never

        // Act
        const values: string[] = [ controls.themeControl.value, controls.languageControl.value ]

        // Assert
        expect( values ).toEqual( [ 'dark', 'fr' ] )
    } )

    it( 'asks for a confirmation before impersonating', () => {
        // Arrange
        const action: { confirmImpersonate: () => void } = page as never

        // Act
        action.confirmImpersonate()

        // Assert
        expect( confirm ).toHaveBeenCalledTimes( 1 )
        expect( registry[ 'impersonateCurrentUser' ] ).not.toHaveBeenCalled()
    } )

    it( 'impersonates once the confirmation is accepted', () => {
        // Arrange
        const action: { confirmImpersonate: () => void } = page as never
        action.confirmImpersonate()

        // Act
        confirm.mock.calls[ 0 ][ 0 ].accept!()

        // Assert
        expect( registry[ 'impersonateCurrentUser' ] ).toHaveBeenCalledTimes( 1 )
    } )
} )
