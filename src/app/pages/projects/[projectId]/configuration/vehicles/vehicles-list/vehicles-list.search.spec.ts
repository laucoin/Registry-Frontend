import { describe, expect, it } from 'vitest'
import { toVehiclesListSearchModel, toVehiclesListSearchParams } from '@pages/projects/[projectId]/configuration/vehicles/vehicles-list/vehicles-list.search'

describe('vehicles-list search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toVehiclesListSearchModel>[0] = { q: undefined, at: undefined, status: undefined, isVisible: undefined }

        // Act
        const model: ReturnType<typeof toVehiclesListSearchModel> = toVehiclesListSearchModel(params)

        // Assert
        expect(model).toEqual({ q: '', at: null, status: '', isVisible: '' })
    })

    it('turns the filled parameters into form values and back', () => {
        // Arrange
        const when: Date = new Date(2026, 9, 3)
        const params: Parameters<typeof toVehiclesListSearchModel>[0] = { q: 'camp', at: when, status: 'IN', isVisible: false }

        // Act
        const model: ReturnType<typeof toVehiclesListSearchModel> = toVehiclesListSearchModel(params)

        // Assert
        expect(model.isVisible).toBe('false')
        expect(toVehiclesListSearchParams(model)).toEqual(params)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toVehiclesListSearchModel> = { q: '', at: null, status: '', isVisible: '' }

        // Act
        const params: ReturnType<typeof toVehiclesListSearchParams> = toVehiclesListSearchParams(model)

        // Assert
        expect(params).toEqual({ q: undefined, at: undefined, status: undefined, isVisible: undefined })
    })
})
