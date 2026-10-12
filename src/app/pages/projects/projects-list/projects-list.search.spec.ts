import { describe, expect, it } from 'vitest'
import { toProjectsListSearchModel, toProjectsListSearchParams } from '@pages/projects/projects-list/projects-list.search'

describe('projects list search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toProjectsListSearchModel>[0] = { textSearched: undefined, dateTimeSearched: undefined, visibilitySearched: undefined }

        // Act
        const model: ReturnType<typeof toProjectsListSearchModel> = toProjectsListSearchModel(params)

        // Assert
        expect(model).toEqual({ textSearched: '', dateTimeSearched: null, visibilitySearched: '' })
    })

    it('turns the visibility into the value of its select option and back', () => {
        // Arrange
        const hidden: Parameters<typeof toProjectsListSearchModel>[0] = { textSearched: 'a', dateTimeSearched: undefined, visibilitySearched: false }

        // Act
        const model: ReturnType<typeof toProjectsListSearchModel> = toProjectsListSearchModel(hidden)

        // Assert
        expect(model.visibilitySearched).toBe('false')
        expect(toProjectsListSearchParams(model)).toEqual(hidden)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toProjectsListSearchModel> = { textSearched: '', dateTimeSearched: null, visibilitySearched: '' }

        // Act
        const params: ReturnType<typeof toProjectsListSearchParams> = toProjectsListSearchParams(model)

        // Assert
        expect(params).toEqual({ textSearched: undefined, dateTimeSearched: undefined, visibilitySearched: undefined })
    })
})
