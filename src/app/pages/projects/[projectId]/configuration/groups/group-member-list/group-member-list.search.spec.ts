import { describe, expect, it } from 'vitest'
import { toGroupMemberListSearchModel, toGroupMemberListSearchParams } from '@pages/projects/[projectId]/configuration/groups/group-member-list/group-member-list.search'

describe('group-member-list search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toGroupMemberListSearchModel>[0] = { q: undefined, status: undefined, isVisible: undefined }

        // Act
        const model: ReturnType<typeof toGroupMemberListSearchModel> = toGroupMemberListSearchModel(params)

        // Assert
        expect(model).toEqual({ q: '', status: '', isVisible: '' })
    })

    it('turns the filled parameters into form values and back', () => {
        // Arrange
        const params: Parameters<typeof toGroupMemberListSearchModel>[0] = { q: 'camp', status: 'IN', isVisible: false }

        // Act
        const model: ReturnType<typeof toGroupMemberListSearchModel> = toGroupMemberListSearchModel(params)

        // Assert
        expect(model.isVisible).toBe('false')
        expect(toGroupMemberListSearchParams(model)).toEqual(params)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toGroupMemberListSearchModel> = { q: '', status: '', isVisible: '' }

        // Act
        const params: ReturnType<typeof toGroupMemberListSearchParams> = toGroupMemberListSearchParams(model)

        // Assert
        expect(params).toEqual({ q: undefined, status: undefined, isVisible: undefined })
    })
})
