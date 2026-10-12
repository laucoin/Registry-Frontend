import { describe, expect, it } from 'vitest'
import { toActivitiesListSearchModel, toActivitiesListSearchParams } from '@pages/projects/[projectId]/configuration/activities/activities-list/activities-list.search'

describe('activities-list search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toActivitiesListSearchModel>[0] = { textSearched: undefined, dateTimeSearched: undefined, availabilitySearched: undefined, visibilitySearched: undefined }

        // Act
        const model: ReturnType<typeof toActivitiesListSearchModel> = toActivitiesListSearchModel(params)

        // Assert
        expect(model).toEqual({ textSearched: '', dateTimeSearched: null, availabilitySearched: '', visibilitySearched: '' })
    })

    it('turns the filled parameters into form values and back', () => {
        // Arrange
        const when: Date = new Date(2026, 9, 3)
        const params: Parameters<typeof toActivitiesListSearchModel>[0] = { textSearched: 'camp', dateTimeSearched: when, availabilitySearched: false, visibilitySearched: false }

        // Act
        const model: ReturnType<typeof toActivitiesListSearchModel> = toActivitiesListSearchModel(params)

        // Assert
        expect(model.availabilitySearched).toBe('false')
        expect(toActivitiesListSearchParams(model)).toEqual(params)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toActivitiesListSearchModel> = { textSearched: '', dateTimeSearched: null, availabilitySearched: '', visibilitySearched: '' }

        // Act
        const params: ReturnType<typeof toActivitiesListSearchParams> = toActivitiesListSearchParams(model)

        // Assert
        expect(params).toEqual({ textSearched: undefined, dateTimeSearched: undefined, availabilitySearched: undefined, visibilitySearched: undefined })
    })
})
