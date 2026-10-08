import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { UiFacade } from '@core/registry/state/ui.facade'
import { UserApi } from '@pages/users/data/state/user.api'
import { UserStore } from '@pages/users/data/state/user.store'
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import { ErrorModel } from '@shared/models/model/error.model'
import { UserModel } from '@shared/models/model/user.model'

describe( 'UserStore', () => {
    let store: InstanceType<typeof UserStore>
    let findUsers: Mock<UserApi['findUsers']>
    let findUserById: Mock<UserApi['findUserById']>
    let getAssignableUserRoles: Mock<UserApi['getAssignableUserRoles']>
    let setGlobalError: Mock<(error: ErrorModel) => void>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        findUsers = vi.fn()
        findUserById = vi.fn()
        getAssignableUserRoles = vi.fn()
        setGlobalError = vi.fn()
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                { provide: UserApi, useValue: { findUsers, findUserById, getAssignableUserRoles } },
                { provide: UiFacade, useValue: { setGlobalError, notify } },
            ],
        } )
        store = TestBed.inject( UserStore )
    } )

    it( 'stores the fetched users page and clears the reset flag', () => {
        // Arrange
        store.updateUsersPageSearchParams( { ...store.users.params(), resetSearch: true } )
        findUsers.mockReturnValue( of( pageOf<UserModel>( [ { id: 'u1' } as UserModel ] ) ) )

        // Act
        store.fetchUsersPage( { pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.users.element()?.content ).toHaveLength( 1 )
        expect( store.users.params.resetSearch() ).toBe( false )
        expect( store.users.loading() ).toBe( false )
    } )

    it( 'keeps the error of a failed users fetch in the users block', () => {
        // Arrange
        findUsers.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchUsersPage( { pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.users.error()?.summary ).toBe( 'Title' )
        expect( store.users.element() ).toBeUndefined()
    } )

    it( 'reports a 503 as the global error', () => {
        // Arrange
        findUsers.mockReturnValue( failing( ERROR_503 ) )

        // Act
        store.fetchUsersPage( { pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( setGlobalError ).toHaveBeenCalledWith( ERROR_503 )
        expect( store.users.error() ).toBeUndefined()
    } )

    it( 'loads a single user and ends the loading state', () => {
        // Arrange
        findUserById.mockReturnValue( of( { id: 'u1', firstName: 'Ada' } as UserModel ) )

        // Act
        store.fetchUser( 'u1' )

        // Assert
        expect( store.user.element()?.firstName ).toBe( 'Ada' )
        expect( store.user.loading() ).toBe( false )
    } )

    it( 'notifies a failed user fetch and keeps the store usable', () => {
        // Arrange
        findUserById.mockReturnValueOnce( failing( ERROR_500 ) )
        findUserById.mockReturnValueOnce( of( { id: 'u2' } as UserModel ) )
        store.fetchUser( 'u1' )

        // Act
        store.fetchUser( 'u2' )

        // Assert
        expect( notify ).toHaveBeenCalledTimes( 1 )
        expect( store.user.element()?.id ).toBe( 'u2' )
    } )

    it( 'forgets the loaded user on reset', () => {
        // Arrange
        findUserById.mockReturnValue( of( { id: 'u1' } as UserModel ) )
        store.fetchUser( 'u1' )

        // Act
        store.resetUser()

        // Assert
        expect( store.user.element() ).toBeUndefined()
    } )

    it( 'stores the assignable roles', () => {
        // Arrange
        getAssignableUserRoles.mockReturnValue( of( [ { label: 'Admin', value: 'ADMIN' } ] ) )

        // Act
        store.fetchAssignableRoles()

        // Assert
        expect( store.metadata.assignableRoles() ).toEqual( [ { label: 'Admin', value: 'ADMIN' } ] )
    } )

    it( 'toggles the user loader', () => {
        // Arrange
        store.startUserLoader()
        const running: boolean = store.user.loading()

        // Act
        store.stopUserLoader()

        // Assert
        expect( running ).toBe( true )
        expect( store.user.loading() ).toBe( false )
    } )
} )
