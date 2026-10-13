import { describe, expect, it } from 'vitest'
import { toParticipantsListSearchModel, toParticipantsListSearchParams } from '@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.search'

describe('participants-list search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toParticipantsListSearchModel>[0] = { q: undefined, status: undefined, isVisible: undefined }

        // Act
        const model: ReturnType<typeof toParticipantsListSearchModel> = toParticipantsListSearchModel(params)

        // Assert
        expect(model).toEqual({ q: '', status: '', isVisible: '' })
    })

    it('turns the filled parameters into form values and back', () => {
        // Arrange
        const params: Parameters<typeof toParticipantsListSearchModel>[0] = { q: 'camp', status: 'IN', isVisible: false }

        // Act
        const model: ReturnType<typeof toParticipantsListSearchModel> = toParticipantsListSearchModel(params)

        // Assert
        expect(model.isVisible).toBe('false')
        expect(toParticipantsListSearchParams(model)).toEqual(params)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toParticipantsListSearchModel> = { q: '', status: '', isVisible: '' }

        // Act
        const params: ReturnType<typeof toParticipantsListSearchParams> = toParticipantsListSearchParams(model)

        // Assert
        expect(params).toEqual({ q: undefined, status: undefined, isVisible: undefined })
    })
})
