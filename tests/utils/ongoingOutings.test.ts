import { describe, expect, it } from 'vitest'
import { outingActivityId, repeatedOutingActivityIds } from '../../app/utils/ongoingOutings'
import type { MovementRowDto } from '../../shared/utils/api-types'

function outing(id: string, activityId: string | null, kind: 'ACTIVITY' | 'REASON' = 'ACTIVITY'): MovementRowDto {
	return {
		id,
		dateTime: '2026-08-10T09:00:00.000Z',
		reason: activityId === null ? null : { value: activityId, label: 'Rando', kind },
	}
}

describe('outingActivityId', () => {
	it.each([
		['an activity outing names its activity', outing('m1', 'a1'), 'a1'],
		['a plain reason names no activity', outing('m2', 'SHOPPING', 'REASON'), null],
		['a movement with no reason names no activity', outing('m3', null), null],
	] as const)('%s', (_label, movement, expected) => {
		// Act
		const activityId = outingActivityId(movement)

		// Assert
		expect(activityId).toBe(expected)
	})
})

describe('repeatedOutingActivityIds', () => {
	it('reports nothing when every outing is a different activity', () => {
		// Arrange
		const movements = [outing('m1', 'a1'), outing('m2', 'a2'), outing('m3', 'a3')]

		// Act
		const repeated = repeatedOutingActivityIds(movements)

		// Assert
		expect(repeated.size).toBe(0)
	})

	/**
	 * The whole point: two parties out on the same activity are the case a safety
	 * board must never render identically.
	 */
	it('reports the activity that is out more than once', () => {
		// Arrange
		const movements = [outing('m1', 'a1'), outing('m2', 'a2'), outing('m3', 'a1')]

		// Act
		const repeated = repeatedOutingActivityIds(movements)

		// Assert
		expect([...repeated]).toEqual(['a1'])
	})

	it('reports an activity out three times exactly once', () => {
		// Arrange
		const movements = [outing('m1', 'a1'), outing('m2', 'a1'), outing('m3', 'a1')]

		// Act
		const repeated = repeatedOutingActivityIds(movements)

		// Assert
		expect([...repeated]).toEqual(['a1'])
	})

	it('ignores movements that carry no activity', () => {
		// Arrange
		const movements = [
			outing('m1', 'SHOPPING', 'REASON'),
			outing('m2', 'SHOPPING', 'REASON'),
			outing('m3', null),
			outing('m4', null),
		]

		// Act
		const repeated = repeatedOutingActivityIds(movements)

		// Assert
		expect(repeated.size).toBe(0)
	})

	it('reports nothing for an empty board', () => {
		// Act
		const repeated = repeatedOutingActivityIds([])

		// Assert
		expect(repeated.size).toBe(0)
	})
})
