import { describe, expect, it } from 'vitest'
import { AgeHelper } from '@shared/helpers/age.helper'

describe( 'AgeHelper', () => {
    const today: Date = new Date( 2026, 9, 18 )

    it.each<[ string, string, number | undefined ]>( [
        [ 'on the day of the birthday', '2010-10-18', 16 ],
        [ 'the day before the birthday', '2010-10-19', 15 ],
        [ 'the day after the birthday', '2010-10-17', 16 ],
        [ 'a birthday later in the year', '2000-12-31', 25 ],
        [ 'a birthday earlier in the year', '2000-01-01', 26 ],
        [ 'a missing birth date', '', undefined ],
        [ 'a badly formed birth date', 'unknown', undefined ],
    ] )( 'computes the age for %s', (_label: string, birthday: string, expected: number | undefined) => {
        // Arrange
        const given: string = birthday

        // Act
        const age: number | undefined = AgeHelper.ageOn( given, today )

        // Assert
        expect( age ).toBe( expected )
    } )
} )
