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
    it( 'rebuilds every movement with its own content and an empty list when none is loaded or fetched', () => {
        // Arrange
        const movements: MovementModel[] = [ { id: 'm1' } as MovementModel, { id: 'm2' } as MovementModel ]
        const contents: PairModel<MovementContentModel[]>[] = [ { first: 'm2', second: [ content( 'c1', true ) ] } ]

        // Act
        const rebuilt: MovementModel[] = MovementHelper.rebuildPageWithContent( movements, contents )

        // Assert
        expect( rebuilt[ 0 ].content ).toEqual( [] )
        expect( rebuilt[ 1 ].content ).toHaveLength( 1 )
    } )

    it( 'keeps the loaded content of the movements absent from the fetched contents', () => {
        // Arrange
        const loaded: MovementContentModel[] = [ content( 'c0', true ) ]
        const movements: MovementModel[] = [ { id: 'm1', content: loaded } as MovementModel, { id: 'm2' } as MovementModel ]
        const contents: PairModel<MovementContentModel[]>[] = [ { first: 'm2', second: [ content( 'c1', true ) ] } ]

        // Act
        const rebuilt: MovementModel[] = MovementHelper.rebuildPageWithContent( movements, contents )

        // Assert
        expect( rebuilt[ 0 ].content ).toBe( loaded )
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

    it( 'lists the members without a pool as independent when at least one pool exists', () => {
        // Arrange
        const movement: MovementModel = movementWith( content( 'a', true, 'car 1' ), content( 'b', false ), content( 'c', true ) )

        // Act
        const independent: string[] = MovementHelper.getIndependent( movement ).map( (item: MovementContentModel): string => item.participant.id )

        // Assert
        expect( independent ).toEqual( [ 'b', 'c' ] )
    } )

    it( 'lists no independent member when the movement has no pool', () => {
        // Arrange
        const movement: MovementModel = movementWith( content( 'a', true ), content( 'b', false ) )

        // Act
        const independent: MovementContentModel[] = MovementHelper.getIndependent( movement )

        // Assert
        expect( independent ).toEqual( [] )
    } )

    it( 'lists each vehicle once with the first participant carrying it', () => {
        // Arrange
        const withVehicle = (id: string, vehicleId?: string): MovementContentModel =>
            ({ participant: { id }, vehicle: vehicleId ? { id: vehicleId } : undefined }) as unknown as MovementContentModel
        const movement: MovementModel = movementWith( withVehicle( 'a', 'v1' ), withVehicle( 'b', 'v1' ), withVehicle( 'c' ), withVehicle( 'd', 'v2' ) )

        // Act
        const vehicles: string[] = MovementHelper.getVehicles( movement ).map( (item: MovementContentModel): string => `${ item.vehicle!.id }:${ item.participant.id }` )

        // Assert
        expect( vehicles ).toEqual( [ 'v1:a', 'v2:d' ] )
    } )
} )
