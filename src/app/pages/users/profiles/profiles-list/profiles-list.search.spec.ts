import { describe, expect, it } from 'vitest'
import { toProfilesListSearchModel, toProfilesListSearchParams } from '@pages/users/profiles/profiles-list/profiles-list.search'

describe('profiles list search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toProfilesListSearchModel>[0] = { textSearched: undefined, dateTimeSearched: undefined, availabilitySearched: undefined }

        // Act
        const model: ReturnType<typeof toProfilesListSearchModel> = toProfilesListSearchModel(params)

        // Assert
        expect(model).toEqual({ textSearched: '', dateTimeSearched: null, availabilitySearched: '' })
    })

    it('turns the availability into the value of its select option and back', () => {
        // Arrange
        const when: Date = new Date(2026, 9, 3)
        const params: Parameters<typeof toProfilesListSearchModel>[0] = { textSearched: 'camp', dateTimeSearched: when, availabilitySearched: false }

        // Act
        const model: ReturnType<typeof toProfilesListSearchModel> = toProfilesListSearchModel(params)

        // Assert
        expect(model.availabilitySearched).toBe('false')
        expect(toProfilesListSearchParams(model)).toEqual(params)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toProfilesListSearchModel> = { textSearched: '', dateTimeSearched: null, availabilitySearched: '' }

        // Act
        const params: ReturnType<typeof toProfilesListSearchParams> = toProfilesListSearchParams(model)

        // Assert
        expect(params).toEqual({ textSearched: undefined, dateTimeSearched: undefined, availabilitySearched: undefined })
    })
})
