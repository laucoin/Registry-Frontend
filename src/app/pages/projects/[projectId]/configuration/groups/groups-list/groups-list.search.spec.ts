import { describe, expect, it } from 'vitest'
import { toGroupsListSearchModel, toGroupsListSearchParams } from '@pages/projects/[projectId]/configuration/groups/groups-list/groups-list.search'

describe('groups-list search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toGroupsListSearchModel>[0] = { q: undefined, at: undefined, isPresent: undefined, isVisible: undefined }

        // Act
        const model: ReturnType<typeof toGroupsListSearchModel> = toGroupsListSearchModel(params)

        // Assert
        expect(model).toEqual({ q: '', at: null, isPresent: '', isVisible: '' })
    })

    it('turns the filled parameters into form values and back', () => {
        // Arrange
        const when: Date = new Date(2026, 9, 3)
        const params: Parameters<typeof toGroupsListSearchModel>[0] = { q: 'camp', at: when, isPresent: false, isVisible: false }

        // Act
        const model: ReturnType<typeof toGroupsListSearchModel> = toGroupsListSearchModel(params)

        // Assert
        expect(model.isPresent).toBe('false')
        expect(toGroupsListSearchParams(model)).toEqual(params)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toGroupsListSearchModel> = { q: '', at: null, isPresent: '', isVisible: '' }

        // Act
        const params: ReturnType<typeof toGroupsListSearchParams> = toGroupsListSearchParams(model)

        // Assert
        expect(params).toEqual({ q: undefined, at: undefined, isPresent: undefined, isVisible: undefined })
    })
})
