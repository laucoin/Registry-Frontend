import { describe, expect, it } from 'vitest'
import { toAlertsListSearchModel, toAlertsListSearchParams } from '@pages/projects/[projectId]/alerts/alerts-list/alerts-list.search'

describe('AlertsList search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toAlertsListSearchModel>[0] = { textSearched: undefined, statusSearched: undefined, visibilitySearched: undefined, startDateTimeSearched: undefined, endDateTimeSearched: undefined }

        // Act
        const model: ReturnType<typeof toAlertsListSearchModel> = toAlertsListSearchModel(params)

        // Assert
        expect(model).toEqual({ textSearched: '', statusSearched: '', visibilitySearched: '', startDateTimeSearched: null, endDateTimeSearched: null })
    })

    it('turns the filled parameters, with both dates of the range, into form values and back', () => {
        // Arrange
        const params: Parameters<typeof toAlertsListSearchModel>[0] = { textSearched: 'fire', statusSearched: 'IN_PROGRESS', visibilitySearched: false, startDateTimeSearched: new Date(2026, 9, 3), endDateTimeSearched: new Date(2026, 9, 5) }

        // Act
        const model: ReturnType<typeof toAlertsListSearchModel> = toAlertsListSearchModel(params)

        // Assert
        expect(model.visibilitySearched).toBe('false')
        expect(toAlertsListSearchParams(model)).toEqual(params)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toAlertsListSearchModel> = { textSearched: '', statusSearched: '', visibilitySearched: '', startDateTimeSearched: null, endDateTimeSearched: null }

        // Act
        const params: ReturnType<typeof toAlertsListSearchParams> = toAlertsListSearchParams(model)

        // Assert
        expect(params).toEqual({ textSearched: undefined, statusSearched: undefined, visibilitySearched: undefined, startDateTimeSearched: undefined, endDateTimeSearched: undefined })
    })
})
