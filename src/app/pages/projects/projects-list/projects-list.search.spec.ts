import { describe, expect, it } from 'vitest'
import { toProjectsListSearchModel, toProjectsListSearchParams } from '@pages/projects/projects-list/projects-list.search'

describe('projects list search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toProjectsListSearchModel>[0] = { q: undefined, at: undefined, isVisible: undefined }

        // Act
        const model: ReturnType<typeof toProjectsListSearchModel> = toProjectsListSearchModel(params)

        // Assert
        expect(model).toEqual({ q: '', at: null, isVisible: '' })
    })

    it('turns the visibility into the value of its select option and back', () => {
        // Arrange
        const hidden: Parameters<typeof toProjectsListSearchModel>[0] = { q: 'a', at: undefined, isVisible: false }

        // Act
        const model: ReturnType<typeof toProjectsListSearchModel> = toProjectsListSearchModel(hidden)

        // Assert
        expect(model.isVisible).toBe('false')
        expect(toProjectsListSearchParams(model)).toEqual(hidden)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toProjectsListSearchModel> = { q: '', at: null, isVisible: '' }

        // Act
        const params: ReturnType<typeof toProjectsListSearchParams> = toProjectsListSearchParams(model)

        // Assert
        expect(params).toEqual({ q: undefined, at: undefined, isVisible: undefined })
    })
})
