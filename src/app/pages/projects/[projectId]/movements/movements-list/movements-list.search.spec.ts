import { describe, expect, it } from 'vitest'
import { toMovementsListSearchModel, toMovementsListSearchParams } from '@pages/projects/[projectId]/movements/movements-list/movements-list.search'

describe('MovementsList search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toMovementsListSearchModel>[0] = { typeSearched: undefined, startDateTimeSearched: undefined, endDateTimeSearched: undefined, visibilitySearched: undefined }

        // Act
        const model: ReturnType<typeof toMovementsListSearchModel> = toMovementsListSearchModel(params)

        // Assert
        expect(model).toEqual({ typeSearched: '', startDateTimeSearched: null, endDateTimeSearched: null, visibilitySearched: '' })
    })

    it('turns the filled parameters, with both dates of the range, into form values and back', () => {
        // Arrange
        const params: Parameters<typeof toMovementsListSearchModel>[0] = { typeSearched: 'IN', startDateTimeSearched: new Date(2026, 9, 3), endDateTimeSearched: new Date(2026, 9, 5), visibilitySearched: false }

        // Act
        const model: ReturnType<typeof toMovementsListSearchModel> = toMovementsListSearchModel(params)

        // Assert
        expect(model.visibilitySearched).toBe('false')
        expect(toMovementsListSearchParams(model)).toEqual(params)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toMovementsListSearchModel> = { typeSearched: '', startDateTimeSearched: null, endDateTimeSearched: null, visibilitySearched: '' }

        // Act
        const params: ReturnType<typeof toMovementsListSearchParams> = toMovementsListSearchParams(model)

        // Assert
        expect(params).toEqual({ typeSearched: undefined, startDateTimeSearched: undefined, endDateTimeSearched: undefined, visibilitySearched: undefined })
    })
})
