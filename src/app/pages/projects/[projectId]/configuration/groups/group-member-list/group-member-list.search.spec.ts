import { describe, expect, it } from 'vitest'
import { toGroupMemberListSearchModel, toGroupMemberListSearchParams } from '@pages/projects/[projectId]/configuration/groups/group-member-list/group-member-list.search'

describe('group-member-list search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toGroupMemberListSearchModel>[0] = { textSearched: undefined, statusSearched: undefined, visibilitySearched: undefined }

        // Act
        const model: ReturnType<typeof toGroupMemberListSearchModel> = toGroupMemberListSearchModel(params)

        // Assert
        expect(model).toEqual({ textSearched: '', statusSearched: '', visibilitySearched: '' })
    })

    it('turns the filled parameters into form values and back', () => {
        // Arrange
        const params: Parameters<typeof toGroupMemberListSearchModel>[0] = { textSearched: 'camp', statusSearched: 'IN', visibilitySearched: false }

        // Act
        const model: ReturnType<typeof toGroupMemberListSearchModel> = toGroupMemberListSearchModel(params)

        // Assert
        expect(model.visibilitySearched).toBe('false')
        expect(toGroupMemberListSearchParams(model)).toEqual(params)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toGroupMemberListSearchModel> = { textSearched: '', statusSearched: '', visibilitySearched: '' }

        // Act
        const params: ReturnType<typeof toGroupMemberListSearchParams> = toGroupMemberListSearchParams(model)

        // Assert
        expect(params).toEqual({ textSearched: undefined, statusSearched: undefined, visibilitySearched: undefined })
    })
})
