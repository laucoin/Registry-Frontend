import { Location } from '@angular/common'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { UserFacade } from '@pages/users/data/state/user.facade'
import { UserFormPage } from '@pages/users/user-form/user-form.page'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { autoMock } from '@shared/helpers/testing/auto-mock'

interface UserFormApi {
    loadError: () => { summary?: string } | undefined
}

describe( 'UserFormPage', () => {
    let facade: Record<string, Mock>

    function create (): UserFormApi {
        facade = autoMock()
        facade[ 'user$' ] = of( undefined ) as never
        facade[ 'userError' ].mockReturnValue( undefined )
        facade[ 'metadataErrors' ].mockReturnValue( {} )
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        TestBed.configureTestingModule( {
            providers: [
                { provide: UserFacade, useValue: facade },
                { provide: Location, useValue: { back: vi.fn() } },
                { provide: Router, useValue: { navigateByUrl: vi.fn( () => Promise.resolve( true ) ) } },
                { provide: ActivatedRoute, useValue: { snapshot: { params: { userId: 'u1' }, url: [ { path: 'u1' }, { path: 'edit' } ] } } },
                { provide: SessionFacade, useValue: { selectedProject: (): undefined => undefined, currentUser: (): undefined => undefined } },
                { provide: UiFacade, useValue: autoMock() },
                { provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
        TestBed.overrideComponent( UserFormPage, { set: { template: '', imports: [], providers: [] } } )
        return TestBed.createComponent( UserFormPage ).componentInstance as unknown as UserFormApi
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    it( 'shows no load failure while the user and the roles are loaded', () => {
        // Arrange
        const page: UserFormApi = create()

        // Act
        const error: { summary?: string } | undefined = page.loadError()

        // Assert
        expect( error ).toBeUndefined()
    } )

    it( 'blocks the form with the user failure', () => {
        // Arrange
        const page: UserFormApi = create()
        facade[ 'userError' ].mockReturnValue( { summary: 'User down' } )

        // Act
        const error: { summary?: string } | undefined = page.loadError()

        // Assert
        expect( error?.summary ).toBe( 'User down' )
    } )

    it( 'blocks the form with the roles failure', () => {
        // Arrange
        const page: UserFormApi = create()
        facade[ 'metadataErrors' ].mockReturnValue( { assignableRoles: { summary: 'Roles down' } } )

        // Act
        const error: { summary?: string } | undefined = page.loadError()

        // Assert
        expect( error?.summary ).toBe( 'Roles down' )
    } )
} )
