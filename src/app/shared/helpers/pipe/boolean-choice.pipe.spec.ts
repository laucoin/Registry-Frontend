import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { describe, expect, it } from 'vitest'

describe( 'BooleanChoicePipe', () => {
    it( 'gives the option value of each visibility choice', () => {
        // Arrange
        const pipe: BooleanChoicePipe = new BooleanChoicePipe()

        // Act
        const values: string[] = [ undefined, true, false ].map( (choice: boolean | undefined): string => pipe.transform( choice ) )

        // Assert
        expect( values ).toEqual( [ '', 'true', 'false' ] )
    } )
} )
