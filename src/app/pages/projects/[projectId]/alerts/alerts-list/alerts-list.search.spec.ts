import { describe, expect, it } from 'vitest'
import { toAlertsListSearchModel, toAlertsListSearchParams } from '@pages/projects/[projectId]/alerts/alerts-list/alerts-list.search'

describe('AlertsList search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toAlertsListSearchModel>[0] = { q: undefined, status: undefined, isVisible: undefined, from: undefined, to: undefined }

        // Act
        const model: ReturnType<typeof toAlertsListSearchModel> = toAlertsListSearchModel(params)

        // Assert
        expect(model).toEqual({ q: '', status: '', isVisible: '', from: null, to: null })
    })

    it('turns the filled parameters, with both dates of the range, into form values and back', () => {
        // Arrange
        const params: Parameters<typeof toAlertsListSearchModel>[0] = { q: 'fire', status: 'IN_PROGRESS', isVisible: false, from: new Date(2026, 9, 3), to: new Date(2026, 9, 5) }

        // Act
        const model: ReturnType<typeof toAlertsListSearchModel> = toAlertsListSearchModel(params)

        // Assert
        expect(model.isVisible).toBe('false')
        expect(toAlertsListSearchParams(model)).toEqual(params)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toAlertsListSearchModel> = { q: '', status: '', isVisible: '', from: null, to: null }

        // Act
        const params: ReturnType<typeof toAlertsListSearchParams> = toAlertsListSearchParams(model)

        // Assert
        expect(params).toEqual({ q: undefined, status: undefined, isVisible: undefined, from: undefined, to: undefined })
    })
})
