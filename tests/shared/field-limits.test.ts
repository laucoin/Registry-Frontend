import { FIELD_LIMIT } from '@shared/utils/field-limits'
import { describe, expect, it } from 'vitest'

/**
 * These numbers are the backend's `@Size(max=…)`, which are themselves the
 * column widths. Stating the pairing here means a change on one side shows up
 * as a failing test rather than as a form that lets someone type a value the
 * API will refuse.
 *
 * Sourced from the writer DTOs: ProjectWriterDto, ParticipantWriterDto,
 * GroupWriterDto, ActivityWriterDto, VehicleWriterDto, AlertWriterDto,
 * CommunicationWriterDto.
 */
describe('FIELD_LIMIT', () => {
	it.each([
		['projectName', 150],
		['participantFirstName', 150],
		['participantLastName', 150],
		['groupName', 150],
		['activityName', 150],
		['activityDescription', 2000],
		['vehicleLicensePlate', 20],
		['vehicleBrand', 150],
		['vehicleModel', 150],
		['alertTitle', 50],
		['communicationMessage', 250],
	] as const)('mirrors the backend @Size(max) for %s', (field, expected) => {
		// Arrange

		// Act + Assert
		expect(FIELD_LIMIT[field]).toBe(expected)
	})

	it('states every limit as a positive integer', () => {
		// Act
		const values = Object.values(FIELD_LIMIT)

		// Assert
		expect(values.every(limit => Number.isInteger(limit) && limit > 0)).toBe(true)
	})
})
