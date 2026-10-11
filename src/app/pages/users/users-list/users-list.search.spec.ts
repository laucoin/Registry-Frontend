import { describe, expect, it } from 'vitest'
import { toUsersListSearchModel, toUsersListSearchParams } from '@pages/users/users-list/users-list.search'

describe('users list search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toUsersListSearchModel>[0] = { textSearched: undefined, visibilitySearched: undefined }

        // Act
        const model: ReturnType<typeof toUsersListSearchModel> = toUsersListSearchModel(params)

        // Assert
        expect(model).toEqual({ textSearched: '', visibilitySearched: '' })
    })

    it('turns the visibility into the value of its select option and back', () => {
        // Arrange
        const blocked: Parameters<typeof toUsersListSearchModel>[0] = { textSearched: 'ada', visibilitySearched: false }

        // Act
        const model: ReturnType<typeof toUsersListSearchModel> = toUsersListSearchModel(blocked)

        // Assert
        expect(model.visibilitySearched).toBe('false')
        expect(toUsersListSearchParams(model)).toEqual(blocked)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toUsersListSearchModel> = { textSearched: '', visibilitySearched: '' }

        // Act
        const params: ReturnType<typeof toUsersListSearchParams> = toUsersListSearchParams(model)

        // Assert
        expect(params).toEqual({ textSearched: undefined, visibilitySearched: undefined })
    })
})
