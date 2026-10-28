import { describe, expect, it } from 'vitest'
import { toMovementsListSearchModel, toMovementsListSearchParams } from '@pages/projects/[projectId]/movements/movements-list/movements-list.search'

describe('MovementsList search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toMovementsListSearchModel>[0] = { type: undefined, from: undefined, to: undefined, isVisible: undefined }

        // Act
        const model: ReturnType<typeof toMovementsListSearchModel> = toMovementsListSearchModel(params)

        // Assert
        expect(model).toEqual({ type: '', from: null, to: null, isVisible: '' })
    })

    it('turns the filled parameters, with both dates of the range, into form values and back', () => {
        // Arrange
        const params: Parameters<typeof toMovementsListSearchModel>[0] = { type: 'IN', from: new Date(2026, 9, 3), to: new Date(2026, 9, 5), isVisible: false }

        // Act
        const model: ReturnType<typeof toMovementsListSearchModel> = toMovementsListSearchModel(params)

        // Assert
        expect(model.isVisible).toBe('false')
        expect(toMovementsListSearchParams(model)).toEqual(params)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toMovementsListSearchModel> = { type: '', from: null, to: null, isVisible: '' }

        // Act
        const params: ReturnType<typeof toMovementsListSearchParams> = toMovementsListSearchParams(model)

        // Assert
        expect(params).toEqual({ type: undefined, from: undefined, to: undefined, isVisible: undefined })
    })
})
