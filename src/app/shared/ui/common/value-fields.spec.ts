import { Type } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserService } from '@core/browser/browser.service'
import { UiFacade } from '@core/registry/state/ui.facade'
import { MovementContentFieldComponent } from '@pages/projects/[projectId]/movements/movement-form/movement-content-field/movement-content-field.component'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { DateTimeFieldComponent } from '@shared/ui/common/date-time-field/date-time-field.component'
import { DurationFieldComponent } from '@shared/ui/common/duration-field/duration-field.component'
import { NumberRangeFieldComponent } from '@shared/ui/common/number-range-field/number-range-field.component'
import { SelectElementsFieldComponent } from '@shared/ui/common/select-elements-field/select-elements-field.component'

interface Handle<T> {
    fixture: ComponentFixture<T>
    field: T
    touched: Mock
}

interface Element {
    id: string
}

describe( 'value fields', () => {
    let highlight: Mock<(id: string) => void>

    function create<T> (type: Type<T>, inputs: Record<string, unknown> = {}): Handle<T> {
        highlight = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
                { provide: UiFacade, useValue: autoMock() },
                { provide: BrowserService, useValue: { highlightByDataValue: highlight } },
            ],
        } )
        TestBed.overrideComponent( type, { set: { template: '', imports: [] } } )
        const fixture: ComponentFixture<T> = TestBed.createComponent( type )
        Object.entries( inputs ).forEach( ([ name, value ]: [ string, unknown ]): void => fixture.componentRef.setInput( name, value ) )
        const touched: Mock = vi.fn()
        ;(fixture.componentInstance as unknown as { touch: { subscribe: (fn: () => void) => void } }).touch.subscribe( touched )
        return { fixture, field: fixture.componentInstance, touched }
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    describe.each( [
        [ 'duration', DurationFieldComponent, {} ],
        [ 'number range', NumberRangeFieldComponent, {} ],
        [ 'date time', DateTimeFieldComponent, {} ],
        [ 'select elements', SelectElementsFieldComponent, { selectItemBuilder: (): object => ({}) } ],
        [ 'movement content', MovementContentFieldComponent, { suggestions: [], selectionLabel: '', interpretedMovementType: [] } ],
    ] as [ string, Type<unknown>, Record<string, unknown> ][] )( '%s field', (_name: string, type: Type<unknown>, inputs: Record<string, unknown>) => {
        it.each( [
            [ 'invalid and touched', { invalid: true, touched: true, dirty: false }, true ],
            [ 'invalid and dirty', { invalid: true, touched: false, dirty: true }, true ],
            [ 'invalid but untouched and pristine', { invalid: true, touched: false, dirty: false }, false ],
            [ 'valid and touched', { invalid: false, touched: true, dirty: true }, false ],
        ] )( 'shows the invalid state only for a field that is %s', (_label: string, state: Record<string, boolean>, expected: boolean) => {
            // Arrange
            const { field }: Handle<unknown> = create( type, { ...inputs, ...state } )

            // Act
            const shown: boolean = (field as unknown as { showInvalid: () => boolean }).showInvalid()

            // Assert
            expect( shown ).toBe( expected )
        } )

        it( 'starts without a value and follows the disabled state of the form', () => {
            // Arrange
            const { fixture, field }: Handle<unknown> = create( type, inputs )

            // Act
            fixture.componentRef.setInput( 'disabled', true )

            // Assert
            expect( (field as unknown as { disabled: () => boolean }).disabled() ).toBe( true )
        } )
    } )

    describe( 'duration field', () => {
        it( 'publishes the chosen duration and marks the field as touched', () => {
            // Arrange
            const { field, touched }: Handle<DurationFieldComponent> = create( DurationFieldComponent )

            // Act
            ;(field as never as { onInputChange: (value: object) => void }).onInputChange( { hours: 1, minutes: 30 } )

            // Assert
            expect( field.value() ).toEqual( { hours: 1, minutes: 30 } )
            expect( touched ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'offers an empty choice then every quarter of an hour from 00h15 to 23h45', () => {
            // Arrange
            const { field }: Handle<DurationFieldComponent> = create( DurationFieldComponent )

            // Act
            const durations: { value: unknown }[] = (field as never as { durations: { value: unknown }[] }).durations

            // Assert
            expect( durations ).toHaveLength( 1 + 24 * 4 - 1 )
            expect( durations[ 0 ].value ).toBeNull()
        } )
    } )

    describe( 'number range field', () => {
        it( 'derives the displayed bounds from the value', () => {
            // Arrange
            const { field }: Handle<NumberRangeFieldComponent> = create( NumberRangeFieldComponent )

            // Act
            field.value.set( { lower: 1, upper: 5 } )

            // Assert
            expect( field[ 'minValue' ]() ).toBe( 1 )
            expect( field[ 'maxValue' ]() ).toBe( 5 )
        } )

        it( 'combines a new minimum with the current maximum', () => {
            // Arrange
            const { field, touched }: Handle<NumberRangeFieldComponent> = create( NumberRangeFieldComponent )
            field.value.set( { lower: 1, upper: 5 } )

            // Act
            field[ 'onInputMin' ]( '2' )

            // Assert
            expect( field.value() ).toEqual( { lower: 2, upper: 5 } )
            expect( touched ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'combines a new maximum with the current minimum', () => {
            // Arrange
            const { field }: Handle<NumberRangeFieldComponent> = create( NumberRangeFieldComponent )
            field.value.set( { lower: 1, upper: 5 } )

            // Act
            field[ 'onInputMax' ]( 8 )

            // Assert
            expect( field.value() ).toEqual( { lower: 1, upper: 8 } )
        } )

        it( 'has no range when both bounds are cleared', () => {
            // Arrange
            const { field }: Handle<NumberRangeFieldComponent> = create( NumberRangeFieldComponent )
            field.value.set( { lower: 1, upper: undefined } )

            // Act
            field[ 'onInputMin' ]( null )

            // Assert
            expect( field.value() ).toBeNull()
            expect( field[ 'minValue' ]() ).toBeNull()
        } )
    } )

    describe( 'date time field', () => {
        it( 'splits the value into a date and a time', () => {
            // Arrange
            const { field }: Handle<DateTimeFieldComponent> = create( DateTimeFieldComponent )

            // Act
            field.value.set( { date: '2026-03-04', time: '10:30:00.000Z' } )

            // Assert
            expect( field[ 'date' ]()?.toISOString() ).toBe( '2026-03-04T00:00:00.000Z' )
            expect( field[ 'time' ]()?.getUTCHours() ).toBe( 10 )
        } )

        it( 'keeps the time when the date changes', () => {
            // Arrange
            const { field, touched }: Handle<DateTimeFieldComponent> = create( DateTimeFieldComponent )
            field.value.set( { date: '2026-03-04', time: '10:30:00.000Z' } )

            // Act
            field[ 'onDateChange' ]( new Date( 2026, 4, 6 ) )

            // Assert
            expect( field.value() ).toEqual( { date: '2026-05-06', time: '10:30:00.000Z' } )
            expect( touched ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'keeps the date when the time changes', () => {
            // Arrange
            const { field }: Handle<DateTimeFieldComponent> = create( DateTimeFieldComponent )
            field.value.set( { date: '2026-03-04', time: undefined } )

            // Act
            field[ 'onTimeChange' ]( new Date( Date.UTC( 2026, 0, 1, 8, 15, 0 ) ) )

            // Assert
            expect( field.value() ).toEqual( { date: '2026-03-04', time: '08:15:00.000Z' } )
        } )

        it( 'has no value when both parts are cleared', () => {
            // Arrange
            const { field }: Handle<DateTimeFieldComponent> = create( DateTimeFieldComponent )
            field.value.set( { date: '2026-03-04', time: undefined } )

            // Act
            field[ 'onDateChange' ]( null )

            // Assert
            expect( field.value() ).toBeNull()
            expect( field[ 'date' ]() ).toBeUndefined()
        } )
    } )

    describe( 'select elements field', () => {
        function select (): Handle<SelectElementsFieldComponent<Element>> {
            return create( SelectElementsFieldComponent<Element>, {
                selectItemBuilder: (element: Element): object => ({ label: element.id, value: element }),
            } )
        }

        function pick (id: string): never {
            return { value: { value: { id } } } as never
        }

        it( 'appends to the selection', () => {
            // Arrange
            const { field, touched }: Handle<SelectElementsFieldComponent<Element>> = select()
            field.value.set( [ { id: 'a' } ] )

            // Act
            field[ 'handleElementSelection' ]( pick( 'b' ) )

            // Assert
            expect( field.value() ).toEqual( [ { id: 'a' }, { id: 'b' } ] )
            expect( touched ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'highlights an element already selected instead of adding it twice', () => {
            // Arrange
            const { field, touched }: Handle<SelectElementsFieldComponent<Element>> = select()
            field.value.set( [ { id: 'a' } ] )

            // Act
            field[ 'handleElementSelection' ]( pick( 'a' ) )

            // Assert
            expect( highlight ).toHaveBeenCalledWith( 'a' )
            expect( field.value() ).toEqual( [ { id: 'a' } ] )
            expect( touched ).not.toHaveBeenCalled()
        } )

        it( 'removes only the given element', () => {
            // Arrange
            const { field }: Handle<SelectElementsFieldComponent<Element>> = select()
            field.value.set( [ { id: 'a' }, { id: 'b' } ] )

            // Act
            field[ 'handleElementRemoving' ]( 'a' )

            // Assert
            expect( field.value() ).toEqual( [ { id: 'b' } ] )
        } )
    } )

    describe( 'movement content field', () => {
        const ADA: object = { id: 'pa1', firstName: 'Ada' }
        const GRACE: object = { id: 'pa2', firstName: 'Grace' }

        function content (): Handle<MovementContentFieldComponent> {
            return create( MovementContentFieldComponent, { suggestions: [], selectionLabel: '', interpretedMovementType: [] } )
        }

        it( 'adds a participant without pool', () => {
            // Arrange
            const { field, touched }: Handle<MovementContentFieldComponent> = content()

            // Act
            field[ 'handleElementSelection' ]( { label: 'ada', value: ADA } as never )

            // Assert
            expect( field.value() ).toEqual( [ { poolName: undefined, participant: ADA, vehicle: undefined } ] )
            expect( touched ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'adds every member of a group under the pool of the group and highlights the duplicates', () => {
            // Arrange
            const { field }: Handle<MovementContentFieldComponent> = content()
            field.value.set( [ { poolName: undefined, participant: ADA, vehicle: undefined } as never ] )

            // Act
            field[ 'handleElementSelection' ]( { label: 'wolves', value: { name: 'Wolves', members: [ ADA, GRACE ] } } as never )

            // Assert
            expect( field.value().map( (item: { participant: { id: string }, poolName: string | undefined }): string => `${item.poolName}:${item.participant.id}` ) )
                .toEqual( [ 'undefined:pa1', 'Wolves:pa2' ] )
            expect( highlight ).toHaveBeenCalledWith( 'pa1' )
        } )

        it( 'removes a participant, or a whole pool', () => {
            // Arrange
            const { field }: Handle<MovementContentFieldComponent> = content()
            field.value.set( [
                { poolName: 'Wolves', participant: ADA, vehicle: undefined } as never,
                { poolName: 'Wolves', participant: GRACE, vehicle: undefined } as never,
                { poolName: undefined, participant: { id: 'pa3' }, vehicle: undefined } as never,
            ] )

            // Act
            field[ 'handleParticipantRemoving' ]( 'pa3' )
            field[ 'handleGroupRemoving' ]( 'Wolves' )

            // Assert
            expect( field.value() ).toEqual( [] )
        } )
    } )
} )
