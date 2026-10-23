import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { BrowserService } from '@core/browser/browser.service'
import { UiFacade } from '@core/registry/state/ui.facade'
import { UserApi } from '@core/registry/state/user.api'
import { UserFacade } from '@pages/users/data/state/user.facade'
import { ERROR_500, failing, pageOf, provideTestConfig } from '@shared/helpers/testing/test-fixtures'
import { UserModel } from '@shared/models/model/user.model'

describe( 'UserFacade', () => {
    let facade: UserFacade
    let findUsers: Mock<UserApi['findUsers']>
    let blockUserById: Mock<UserApi['blockUserById']>
    let updateUserRole: Mock<UserApi['updateUserRole']>
    let deleteUserById: Mock<UserApi['deleteUserById']>
    let exportUserById: Mock<UserApi['exportUserById']>
    let downloadJson: Mock<BrowserService['downloadJson']>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        provideTestConfig()
        findUsers = vi.fn( () => of( pageOf<UserModel>( [], 2 ) ) )
        blockUserById = vi.fn()
        updateUserRole = vi.fn()
        deleteUserById = vi.fn()
        exportUserById = vi.fn()
        downloadJson = vi.spyOn( BrowserService.prototype, 'downloadJson' ).mockReset().mockImplementation( (): void => undefined )
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                UserFacade,
                { provide: UserApi, useValue: { findUsers, blockUserById, updateUserRole, deleteUserById, exportUserById } },
                { provide: UiFacade, useValue: { notify } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}` } },
            ],
        } )
        facade = TestBed.inject( UserFacade )
        facade.fetchUsersPage( 2, 10 )
        findUsers.mockClear()
    } )

    it( 'fetches the requested page', () => {
        // Arrange
        const page: number = 3

        // Act
        facade.fetchUsersPage( page, 10 )

        // Assert
        expect( findUsers ).toHaveBeenCalledWith( 3, 10, expect.anything() )
    } )

    it( 'restarts from the first page after the search changed', () => {
        // Arrange
        facade.inputPageSearchParameters( 'ada', undefined )

        // Act
        facade.fetchUsersPage( 4, 10 )

        // Assert
        expect( findUsers ).toHaveBeenCalledWith( 0, 10, expect.anything() )
    } )

    it( 'leaves the search untouched when the criteria did not change', () => {
        // Arrange
        facade.inputPageSearchParameters( 'ada', true )
        facade.fetchUsersPage( 0, 10 )

        // Act
        facade.inputPageSearchParameters( 'ada', true )

        // Assert
        expect( facade.usersPageResetSearch() ).toBe( false )
    } )

    it( 'translates the status labels except the empty option', () => {
        // Arrange
        const expected: (string | undefined)[] = [ '-', 't:users.visible.true', 't:users.visible.false' ]

        // Act
        const labels: (string | undefined)[] = facade.statusMetadata().map( (item: { label?: string }): string | undefined => item.label )

        // Assert
        expect( labels ).toEqual( expected )
    } )

    it( 'notifies and reloads the batches already shown after blocking a user', () => {
        // Arrange
        blockUserById.mockReturnValue( of( { id: 'u1', firstName: 'Ada', lastName: 'L' } as UserModel ) )

        // Act
        facade.bockUser( 'u1' )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'users.notifications.disable.title' } ) )
        expect( findUsers ).toHaveBeenCalledWith( 0, 30, expect.anything() )
        expect( facade.userLoading() ).toBe( false )
    } )

    it( 'does not refresh when the command fails', () => {
        // Arrange
        blockUserById.mockReturnValue( failing( ERROR_500 ) )

        // Act
        facade.bockUser( 'u1' )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
        expect( findUsers ).not.toHaveBeenCalled()
        expect( facade.userLoading() ).toBe( false )
    } )

    it( 'returns the updated user after a role change', () => {
        // Arrange
        updateUserRole.mockReturnValue( of( { id: 'u1', firstName: 'Ada', lastName: 'L' } as UserModel ) )
        let updated: UserModel | undefined

        // Act
        facade.updateUserRole( 'u1', 'ADMIN' ).subscribe( (user: UserModel): void => { updated = user } )

        // Assert
        expect( updated?.id ).toBe( 'u1' )
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'users.notifications.update-role.title' } ) )
    } )

    it( 'notifies and refreshes after deleting a user', () => {
        // Arrange
        deleteUserById.mockReturnValue( of( undefined ) )

        // Act
        facade.deleteUser( { id: 'u1', firstName: 'Ada', lastName: 'L' } as UserModel )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'users.notifications.delete.title' } ) )
        expect( findUsers ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'downloads the export of a user', () => {
        // Arrange
        const data: unknown = { subjectType: 'USER' }
        exportUserById.mockReturnValue( of( data ) )

        // Act
        facade.exportUser( { id: 'u1' } as UserModel )

        // Assert
        expect( exportUserById ).toHaveBeenCalledWith( 'u1' )
        expect( downloadJson ).toHaveBeenCalledWith( data, 'registry-user-u1.json' )
    } )

    it( 'notifies the error and downloads nothing when the export fails', () => {
        // Arrange
        exportUserById.mockReturnValue( failing( ERROR_500 ) )

        // Act
        facade.exportUser( { id: 'u1' } as UserModel )

        // Assert
        expect( downloadJson ).not.toHaveBeenCalled()
        expect( notify ).toHaveBeenCalled()
    } )

    it( 'exposes the failure of the user fetch', () => {
        // Arrange
        Object.assign( TestBed.inject( UserApi ), { findUserById: vi.fn( () => failing( ERROR_500 ) ) } )

        // Act
        facade.fetchUser( 'u1' )

        // Assert
        expect( facade.userError()?.summary ).toBe( 'Title' )
    } )
} )
