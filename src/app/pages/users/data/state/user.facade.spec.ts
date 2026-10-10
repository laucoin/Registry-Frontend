import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { UiFacade } from '@core/registry/state/ui.facade'
import { UserApi } from '@pages/users/data/state/user.api'
import { UserFacade } from '@pages/users/data/state/user.facade'
import { ERROR_500, failing, pageOf, provideTestConfig } from '@shared/helpers/testing/test-fixtures'
import { UserModel } from '@shared/models/model/user.model'

describe( 'UserFacade', () => {
    let facade: UserFacade
    let findUsers: Mock<UserApi['findUsers']>
    let blockUserById: Mock<UserApi['blockUserById']>
    let updateUserRole: Mock<UserApi['updateUserRole']>
    let deleteUserById: Mock<UserApi['deleteUserById']>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        provideTestConfig()
        findUsers = vi.fn( () => of( pageOf<UserModel>( [], 2 ) ) )
        blockUserById = vi.fn()
        updateUserRole = vi.fn()
        deleteUserById = vi.fn()
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                UserFacade,
                { provide: UserApi, useValue: { findUsers, blockUserById, updateUserRole, deleteUserById } },
                { provide: UiFacade, useValue: { notify, setGlobalError: vi.fn() } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}` } },
            ],
        } )
        facade = TestBed.inject( UserFacade )
        facade.fetchUsersPage( 2, 10 )
        findUsers.mockClear()
    } )

    it( 'fetches the requested page', () => {
        // Arrange
        const pageNumber: number = 3

        // Act
        facade.fetchUsersPage( pageNumber, 10 )

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

    it( 'notifies and refreshes the current page after blocking a user', () => {
        // Arrange
        blockUserById.mockReturnValue( of( { id: 'u1', firstName: 'Ada', lastName: 'L' } as UserModel ) )

        // Act
        facade.bockUser( 'u1' )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'users.notifications.disable.title' } ) )
        expect( findUsers ).toHaveBeenCalledWith( 2, 10, expect.anything() )
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
} )
