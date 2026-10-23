import { describe, expect, it } from 'vitest'
import {
    toProjectProfilesListSearchModel,
    toProjectProfilesListSearchParams,
} from '@pages/projects/[projectId]/configuration/profiles/project-profiles-list/project-profiles-list.search'

describe('project profiles list search mapping', () => {
    it('turns absent parameters into empty form values', () => {
        // Arrange
        const params: Parameters<typeof toProjectProfilesListSearchModel>[0] = { textSearched: undefined, dateTimeSearched: undefined, statusSearched: undefined, availabilitySearched: undefined }

        // Act
        const model: ReturnType<typeof toProjectProfilesListSearchModel> = toProjectProfilesListSearchModel(params)

        // Assert
        expect(model).toEqual({ textSearched: '', dateTimeSearched: null, statusSearched: '', availabilitySearched: '' })
    })

    it('turns the status and the availability into their select values and back', () => {
        // Arrange
        const params: Parameters<typeof toProjectProfilesListSearchModel>[0] = { textSearched: 'ada', dateTimeSearched: undefined, statusSearched: 'ACCEPTED', availabilitySearched: true }

        // Act
        const model: ReturnType<typeof toProjectProfilesListSearchModel> = toProjectProfilesListSearchModel(params)

        // Assert
        expect(model.availabilitySearched).toBe('true')
        expect(toProjectProfilesListSearchParams(model)).toEqual(params)
    })

    it('turns empty form values into absent parameters', () => {
        // Arrange
        const model: ReturnType<typeof toProjectProfilesListSearchModel> = { textSearched: '', dateTimeSearched: null, statusSearched: '', availabilitySearched: '' }

        // Act
        const params: ReturnType<typeof toProjectProfilesListSearchParams> = toProjectProfilesListSearchParams(model)

        // Assert
        expect(params).toEqual({ textSearched: undefined, dateTimeSearched: undefined, statusSearched: undefined, availabilitySearched: undefined })
    })
})
