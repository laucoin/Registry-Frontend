import { describe, expect, it } from 'vitest'
import { toInvitationsListSearchModel, toInvitationsListSearchParams } from '@pages/users/invitations/invitations-list/invitations-list.search'

describe('invitations list search mapping', () => {
    it('turns absent parameters into empty form values and back', () => {
        // Arrange
        const params: Parameters<typeof toInvitationsListSearchModel>[0] = { textSearched: undefined, dateTimeSearched: undefined }

        // Act
        const model: ReturnType<typeof toInvitationsListSearchModel> = toInvitationsListSearchModel(params)

        // Assert
        expect(model).toEqual({ textSearched: '', dateTimeSearched: null })
        expect(toInvitationsListSearchParams(model)).toEqual(params)
    })

    it('keeps the text and the date the user filled', () => {
        // Arrange
        const when: Date = new Date(2026, 9, 3)
        const params: Parameters<typeof toInvitationsListSearchModel>[0] = { textSearched: 'camp', dateTimeSearched: when }

        // Act
        const model: ReturnType<typeof toInvitationsListSearchModel> = toInvitationsListSearchModel(params)

        // Assert
        expect(model).toEqual({ textSearched: 'camp', dateTimeSearched: when })
        expect(toInvitationsListSearchParams(model)).toEqual(params)
    })
})
