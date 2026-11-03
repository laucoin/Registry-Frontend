import { describe, expect, it } from 'vitest'
import { toProjectsListSearchModel, toProjectsListSearchParams } from '@pages/projects/projects-list/projects-list.search'

describe('projects list search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toProjectsListSearchModel>[0] = { q: undefined, at: undefined, isVisible: undefined, isFavorite: undefined, withProfile: undefined, sort: undefined }

        // Act
        const model: ReturnType<typeof toProjectsListSearchModel> = toProjectsListSearchModel(params)

        // Assert
        expect(model).toEqual({ q: '', at: null, isVisible: '', isFavorite: '', withProfile: '', sortBy: '', sortDirection: 'asc' })
    })

    it('turns the visibility into the value of its select option and back', () => {
        // Arrange
        const hidden: Parameters<typeof toProjectsListSearchModel>[0] = { q: 'a', at: undefined, isVisible: false, isFavorite: true, withProfile: undefined, sort: undefined }

        // Act
        const model: ReturnType<typeof toProjectsListSearchModel> = toProjectsListSearchModel(hidden)

        // Assert
        expect(model.isVisible).toBe('false')
        expect(model.isFavorite).toBe('true')
        expect(toProjectsListSearchParams(model)).toEqual(hidden)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toProjectsListSearchModel> = { q: '', at: null, isVisible: '', isFavorite: '', withProfile: '', sortBy: '', sortDirection: 'asc' }

        // Act
        const params: ReturnType<typeof toProjectsListSearchParams> = toProjectsListSearchParams(model)

        // Assert
        expect(params).toEqual({ q: undefined, at: undefined, isVisible: undefined, isFavorite: undefined, withProfile: undefined, sort: undefined })
    })
    it.each([
        ['name', 'name', 'asc'],
        ['-end', 'end', 'desc'],
        ['unknown', '', 'asc'],
        [undefined, '', 'asc'],
    ])('turns the sort "%s" into the field "%s" and the direction "%s"', (sort: string | undefined, sortBy: string, sortDirection: string) => {
        // Arrange
        const params: Parameters<typeof toProjectsListSearchModel>[0] = { q: undefined, at: undefined, isVisible: undefined, isFavorite: undefined, withProfile: undefined, sort }

        // Act
        const model: ReturnType<typeof toProjectsListSearchModel> = toProjectsListSearchModel(params)

        // Assert
        expect([model.sortBy, model.sortDirection]).toEqual([sortBy, sortDirection])
    })

    it('turns the sort field and direction of the form into the backend sort', () => {
        // Arrange
        const model: ReturnType<typeof toProjectsListSearchModel> = toProjectsListSearchModel({ q: undefined, at: undefined, isVisible: undefined, isFavorite: undefined, withProfile: undefined, sort: '-begin' })

        // Act
        const params: ReturnType<typeof toProjectsListSearchParams> = toProjectsListSearchParams(model)

        // Assert
        expect(params.sort).toBe('-begin')
    })
})
