import { describe, expect, it } from 'vitest'
import { toVehiclesListSearchModel, toVehiclesListSearchParams } from '@pages/projects/[projectId]/configuration/vehicles/vehicles-list/vehicles-list.search'

describe('vehicles-list search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toVehiclesListSearchModel>[0] = { textSearched: undefined, dateTimeSearched: undefined, statusSearched: undefined, visibilitySearched: undefined }

        // Act
        const model: ReturnType<typeof toVehiclesListSearchModel> = toVehiclesListSearchModel(params)

        // Assert
        expect(model).toEqual({ textSearched: '', dateTimeSearched: null, statusSearched: '', visibilitySearched: '' })
    })

    it('turns the filled parameters into form values and back', () => {
        // Arrange
        const when: Date = new Date(2026, 9, 3)
        const params: Parameters<typeof toVehiclesListSearchModel>[0] = { textSearched: 'camp', dateTimeSearched: when, statusSearched: 'IN', visibilitySearched: false }

        // Act
        const model: ReturnType<typeof toVehiclesListSearchModel> = toVehiclesListSearchModel(params)

        // Assert
        expect(model.visibilitySearched).toBe('false')
        expect(toVehiclesListSearchParams(model)).toEqual(params)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toVehiclesListSearchModel> = { textSearched: '', dateTimeSearched: null, statusSearched: '', visibilitySearched: '' }

        // Act
        const params: ReturnType<typeof toVehiclesListSearchParams> = toVehiclesListSearchParams(model)

        // Assert
        expect(params).toEqual({ textSearched: undefined, dateTimeSearched: undefined, statusSearched: undefined, visibilitySearched: undefined })
    })
})
