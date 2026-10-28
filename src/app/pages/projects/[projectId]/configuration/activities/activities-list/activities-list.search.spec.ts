import { describe, expect, it } from 'vitest'
import { toActivitiesListSearchModel, toActivitiesListSearchParams } from '@pages/projects/[projectId]/configuration/activities/activities-list/activities-list.search'

describe('activities-list search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toActivitiesListSearchModel>[0] = { q: undefined, at: undefined, isAvailable: undefined, isVisible: undefined }

        // Act
        const model: ReturnType<typeof toActivitiesListSearchModel> = toActivitiesListSearchModel(params)

        // Assert
        expect(model).toEqual({ q: '', at: null, isAvailable: '', isVisible: '' })
    })

    it('turns the filled parameters into form values and back', () => {
        // Arrange
        const when: Date = new Date(2026, 9, 3)
        const params: Parameters<typeof toActivitiesListSearchModel>[0] = { q: 'camp', at: when, isAvailable: false, isVisible: false }

        // Act
        const model: ReturnType<typeof toActivitiesListSearchModel> = toActivitiesListSearchModel(params)

        // Assert
        expect(model.isAvailable).toBe('false')
        expect(toActivitiesListSearchParams(model)).toEqual(params)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toActivitiesListSearchModel> = { q: '', at: null, isAvailable: '', isVisible: '' }

        // Act
        const params: ReturnType<typeof toActivitiesListSearchParams> = toActivitiesListSearchParams(model)

        // Assert
        expect(params).toEqual({ q: undefined, at: undefined, isAvailable: undefined, isVisible: undefined })
    })
})
