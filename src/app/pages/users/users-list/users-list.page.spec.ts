import { WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Mock, beforeEach, describe, expect, it } from 'vitest'
import { UserFacade } from '@pages/users/data/state/user.facade'
import { UserActions } from '@pages/users/users-list/user-actions.service'
import { UsersListPage } from '@pages/users/users-list/users-list.page'
import { UsersListSearchModel } from '@pages/users/users-list/users-list.search'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { UserModel } from '@shared/models/model/user.model'

interface UsersListApi {
    model: WritableSignal<UsersListSearchModel>
    activeFilters: () => number
    fullName: (user: UserModel) => string
    initials: (user: UserModel) => string
}

describe('UsersListPage', () => {
    let facade: Record<string, Mock>

    function create(): UsersListApi {
        facade = autoMock()
        facade['usersPageTextSearchedParam'].mockReturnValue(undefined)
        facade['actualUsersPageVisibilitySearchedParam'].mockReturnValue(undefined)
        TestBed.configureTestingModule({
            providers: [
                { provide: UserFacade, useValue: facade },
                { provide: UserActions, useValue: {} },
            ],
        })
        TestBed.overrideComponent(UsersListPage, { set: { template: '', imports: [], providers: [] } })
        return TestBed.createComponent(UsersListPage).componentInstance as unknown as UsersListApi
    }

    beforeEach(() => {
        TestBed.resetTestingModule()
    })

    it('starts from the search parameters kept by the facade', () => {
        // Arrange
        facade = autoMock()
        const page: UsersListApi = create()
        facade['usersPageTextSearchedParam'].mockReturnValue('ada')

        // Act
        const model: UsersListSearchModel = page.model()

        // Assert
        expect(model).toEqual({ q: '', isVisible: '' })
    })

    it('counts the filters applied by the facade', () => {
        // Arrange
        const page: UsersListApi = create()
        facade['usersPageTextSearchedParam'].mockReturnValue('ada')
        facade['actualUsersPageVisibilitySearchedParam'].mockReturnValue(false)

        // Act
        const count: number = page.activeFilters()

        // Assert
        expect(count).toBe(2)
    })

    it.each([
        [{ firstName: 'ada', lastName: 'Lovelace', email: 'a@b.c' }, 'ada LOVELACE', 'AL'],
        [{ firstName: undefined, lastName: undefined, email: 'grace@b.c' }, 'grace@b.c', 'G'],
    ])('shows %j as "%s" with the initials "%s"', (partial: Partial<UserModel>, name: string, initials: string) => {
        // Arrange
        const page: UsersListApi = create()
        const user: UserModel = partial as UserModel

        // Act
        const result: string[] = [page.fullName(user), page.initials(user)]

        // Assert
        expect(result).toEqual([name, initials])
    })
})
