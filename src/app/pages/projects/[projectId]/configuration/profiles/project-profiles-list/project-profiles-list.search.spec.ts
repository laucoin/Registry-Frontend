import { describe, expect, it } from 'vitest'
import {
    toProjectProfilesListSearchModel,
    toProjectProfilesListSearchParams,
} from '@pages/projects/[projectId]/configuration/profiles/project-profiles-list/project-profiles-list.search'

describe('project profiles list search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toProjectProfilesListSearchModel>[0] = { q: undefined, at: undefined, status: undefined, isAvailable: undefined }

        // Act
        const model: ReturnType<typeof toProjectProfilesListSearchModel> = toProjectProfilesListSearchModel(params)

        // Assert
        expect(model).toEqual({ q: '', at: null, status: '', isAvailable: '' })
    })

    it('turns the status and the availability into their select values and back', () => {
        // Arrange
        const params: Parameters<typeof toProjectProfilesListSearchModel>[0] = { q: 'ada', at: undefined, status: 'ACCEPTED', isAvailable: true }

        // Act
        const model: ReturnType<typeof toProjectProfilesListSearchModel> = toProjectProfilesListSearchModel(params)

        // Assert
        expect(model.isAvailable).toBe('true')
        expect(toProjectProfilesListSearchParams(model)).toEqual(params)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toProjectProfilesListSearchModel> = { q: '', at: null, status: '', isAvailable: '' }

        // Act
        const params: ReturnType<typeof toProjectProfilesListSearchParams> = toProjectProfilesListSearchParams(model)

        // Assert
        expect(params).toEqual({ q: undefined, at: undefined, status: undefined, isAvailable: undefined })
    })
})
