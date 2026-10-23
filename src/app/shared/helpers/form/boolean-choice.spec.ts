import { fromBooleanChoice, toBooleanChoice, BooleanChoice } from '@shared/helpers/form/boolean-choice'
import { describe, expect, it } from 'vitest'

describe( 'boolean choice', () => {
    it.each( [
        [ undefined, '' ],
        [ true, 'true' ],
        [ false, 'false' ],
    ] )( 'turns %s into the option value "%s" and back', (value: boolean | undefined, choice: string) => {
        // Arrange
        const expected: BooleanChoice = choice as BooleanChoice

        // Act
        const forth: BooleanChoice = toBooleanChoice( value )
        const back: boolean | undefined = fromBooleanChoice( forth )

        // Assert
        expect( forth ).toBe( expected )
        expect( back ).toBe( value )
    } )
} )
