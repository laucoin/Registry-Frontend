import { describe, expect, it } from 'vitest'
import { toGroupsListSearchModel, toGroupsListSearchParams } from '@pages/projects/[projectId]/configuration/groups/groups-list/groups-list.search'

describe('groups-list search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toGroupsListSearchModel>[0] = { textSearched: undefined, dateTimeSearched: undefined, presenceSearched: undefined, visibilitySearched: undefined }

        // Act
        const model: ReturnType<typeof toGroupsListSearchModel> = toGroupsListSearchModel(params)

        // Assert
        expect(model).toEqual({ textSearched: '', dateTimeSearched: null, presenceSearched: '', visibilitySearched: '' })
    })

    it('turns the filled parameters into form values and back', () => {
        // Arrange
        const when: Date = new Date(2026, 9, 3)
        const params: Parameters<typeof toGroupsListSearchModel>[0] = { textSearched: 'camp', dateTimeSearched: when, presenceSearched: false, visibilitySearched: false }

        // Act
        const model: ReturnType<typeof toGroupsListSearchModel> = toGroupsListSearchModel(params)

        // Assert
        expect(model.presenceSearched).toBe('false')
        expect(toGroupsListSearchParams(model)).toEqual(params)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toGroupsListSearchModel> = { textSearched: '', dateTimeSearched: null, presenceSearched: '', visibilitySearched: '' }

        // Act
        const params: ReturnType<typeof toGroupsListSearchParams> = toGroupsListSearchParams(model)

        // Assert
        expect(params).toEqual({ textSearched: undefined, dateTimeSearched: undefined, presenceSearched: undefined, visibilitySearched: undefined })
    })
})
