import { describe, expect, it } from 'vitest'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { PairModel } from '@shared/models/model/pair.model'

function content (id: string, major: boolean, poolName?: string): MovementContentModel {
    return { poolName, participant: { id, major } } as unknown as MovementContentModel
}

function movementWith (...contents: MovementContentModel[]): MovementModel {
    return { id: 'm1', content: contents } as unknown as MovementModel
}

describe( 'MovementHelper', () => {
    it( 'rebuilds every movement with its own content and an empty list when none matches', () => {
        // Arrange
        const movements: MovementModel[] = [ { id: 'm1' } as MovementModel, { id: 'm2' } as MovementModel ]
        const contents: PairModel<MovementContentModel[]>[] = [ { first: 'm2', second: [ content( 'c1', true ) ] } ]

        // Act
        const rebuilt: MovementModel[] = MovementHelper.rebuildPageWithContent( movements, contents )

        // Assert
        expect( rebuilt[ 0 ].content ).toEqual( [] )
        expect( rebuilt[ 1 ].content ).toHaveLength( 1 )
    } )

    it( 'labels an activity option with the reason and the formatted date', () => {
        // Arrange
        const movement: MovementModel = { id: 'm1', reason: { label: 'Arrival' }, dateTime: new Date() } as unknown as MovementModel
        const datePipe: DateFormatPipe = { transform: (): string => '01/01 10:00' } as unknown as DateFormatPipe

        // Act
        const item: { label?: string, value: MovementModel } = MovementHelper.toActivitySelectItem( movement, datePipe ) as { label?: string, value: MovementModel }

        // Assert
        expect( item.label ).toBe( 'Arrival (01/01 10:00)' )
        expect( item.value ).toBe( movement )
    } )

    it( 'separates adults from children', () => {
        // Arrange
        const movement: MovementModel = movementWith( content( 'a', true ), content( 'b', false ), content( 'c', true ) )

        // Act
        const adults: string[] = MovementHelper.getAdults( movement ).map( (item: MovementContentModel): string => item.participant.id )
        const children: string[] = MovementHelper.getChildren( movement ).map( (item: MovementContentModel): string => item.participant.id )

        // Assert
        expect( adults ).toEqual( [ 'a', 'c' ] )
        expect( children ).toEqual( [ 'b' ] )
    } )

    it( 'groups the members by pool and leaves out those without a pool', () => {
        // Arrange
        const movement: MovementModel = movementWith( content( 'a', true, 'car 1' ), content( 'b', false, 'car 1' ), content( 'c', true, 'car 2' ), content( 'd', true ) )

        // Act
        const pools: Record<string, MovementContentModel[]> = MovementHelper.getPools( movement )

        // Assert
        expect( Object.keys( pools ) ).toEqual( [ 'car 1', 'car 2' ] )
        expect( pools[ 'car 1' ] ).toHaveLength( 2 )
    } )
} )
