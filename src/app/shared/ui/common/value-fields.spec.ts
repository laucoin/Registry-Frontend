import { Type } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserService } from '@core/browser/browser.service'
import { UiFacade } from '@core/registry/state/ui.facade'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { DateTimeFieldComponent } from '@shared/ui/common/date-time-field/date-time-field.component'
import { DurationFieldComponent } from '@shared/ui/common/duration-field/duration-field.component'
import { NumberRangeFieldComponent } from '@shared/ui/common/number-range-field/number-range-field.component'
import { SelectElementsFieldComponent } from '@shared/ui/common/select-elements-field/select-elements-field.component'

interface ValueField {
    registerOnChange: (fn: (value: unknown) => void) => void
    registerOnTouched: (fn: () => void) => void
    setDisabledState: (disabled: boolean) => void
    writeValue: (value: unknown) => void
    disabled: () => boolean
}

interface Handle<T> {
    fixture: ComponentFixture<T>
    field: T & ValueField
}

interface Wired<T> {
    field: T & ValueField
    onChange: Mock
}

interface Element {
    id: string
}

describe( 'value fields', () => {
    let highlight: Mock<(id: string) => void>

    function create<T> (type: Type<T>): Handle<T> {
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
        return { fixture, field: fixture.componentInstance as T & ValueField }
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    describe.each( [
        [ 'duration', DurationFieldComponent ],
        [ 'number range', NumberRangeFieldComponent ],
        [ 'date time', DateTimeFieldComponent ],
        [ 'select elements', SelectElementsFieldComponent ],
    ] as [ string, Type<unknown> ][] )( '%s field', (_name: string, type: Type<unknown>) => {
        it( 'can be disabled and enabled by the form', () => {
            // Arrange
            const { fixture, field }: Handle<unknown> = create( type )
            if (type === SelectElementsFieldComponent) fixture.componentRef.setInput( 'selectItemBuilder', (): object => ({}) )

            // Act
            field.setDisabledState( true )
            const disabled: boolean = field.disabled()
            field.setDisabledState( false )

            // Assert
            expect( disabled ).toBe( true )
            expect( field.disabled() ).toBe( false )
        } )
    } )

    describe( 'duration field', () => {
        it( 'propagates the chosen duration and marks the field as touched', () => {
            // Arrange
            const { field }: Handle<DurationFieldComponent> = create( DurationFieldComponent )
            const onChange: Mock = vi.fn()
            const onTouched: Mock = vi.fn()
            field.registerOnChange( onChange )
            field.registerOnTouched( onTouched )

            // Act
            ;(field as never as { onInputChange: (value: object) => void }).onInputChange( { hours: 1, minutes: 30 } )

            // Assert
            expect( onChange ).toHaveBeenCalledWith( { hours: 1, minutes: 30 } )
            expect( onTouched ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'offers an empty choice then every quarter of an hour from 00h15 to 23h45', () => {
            // Arrange
            const { field }: Handle<DurationFieldComponent> = create( DurationFieldComponent )

            // Act
            const durations: unknown[] = (field as never as { durations: unknown[] }).durations

            // Assert
            expect( durations ).toHaveLength( 1 + 24 * 4 - 1 )
        } )

        it( 'does not fail before the form registers its callbacks', () => {
            // Arrange
            const { field }: Handle<DurationFieldComponent> = create( DurationFieldComponent )

            // Act
            const act: () => void = (): void => (field as never as { onInputChange: (value: undefined) => void }).onInputChange( undefined )

            // Assert
            expect( act ).not.toThrow()
        } )
    } )

    describe( 'number range field', () => {
        function range (): { field: NumberRangeFieldComponent & ValueField, onChange: Mock } {
            const { field }: Handle<NumberRangeFieldComponent> = create( NumberRangeFieldComponent )
            const onChange: Mock = vi.fn()
            field.registerOnChange( onChange )
            return { field, onChange }
        }

        it( 'writes the bounds from the form', () => {
            // Arrange
            const { field }: Wired<NumberRangeFieldComponent> = range()

            // Act
            field.writeValue( { lower: 1, upper: 5 } )

            // Assert
            expect( field[ 'minValue' ] ).toBe( 1 )
            expect( field[ 'maxValue' ] ).toBe( 5 )
        } )

        it( 'combines a new minimum with the current maximum', () => {
            // Arrange
            const { field, onChange }: Wired<NumberRangeFieldComponent> = range()
            field.writeValue( { lower: 1, upper: 5 } )

            // Act
            field[ 'onInputMin' ]( '2' )

            // Assert
            expect( onChange ).toHaveBeenCalledWith( { lower: 2, upper: 5 } )
        } )

        it( 'combines a new maximum with the current minimum', () => {
            // Arrange
            const { field, onChange }: Wired<NumberRangeFieldComponent> = range()
            field.writeValue( { lower: 1, upper: 5 } )

            // Act
            field[ 'onInputMax' ]( 8 )

            // Assert
            expect( onChange ).toHaveBeenCalledWith( { lower: 1, upper: 8 } )
        } )

        it( 'emits no range when both bounds are cleared', () => {
            // Arrange
            const { field, onChange }: Wired<NumberRangeFieldComponent> = range()
            field.writeValue( { lower: 1, upper: undefined } )

            // Act
            field[ 'onInputMin' ]( null )

            // Assert
            expect( onChange ).toHaveBeenCalledWith( undefined )
        } )

        it( 'clears the bounds when the form resets', () => {
            // Arrange
            const { field }: Wired<NumberRangeFieldComponent> = range()
            field.writeValue( { lower: 1, upper: 5 } )

            // Act
            field.writeValue( undefined )

            // Assert
            expect( field[ 'minValue' ] ).toBeNull()
            expect( field[ 'maxValue' ] ).toBeNull()
        } )
    } )

    describe( 'date time field', () => {
        function dateTime (): { field: DateTimeFieldComponent & ValueField, onChange: Mock } {
            const { field }: Handle<DateTimeFieldComponent> = create( DateTimeFieldComponent )
            const onChange: Mock = vi.fn()
            field.registerOnChange( onChange )
            return { field, onChange }
        }

        it( 'splits the written value into a date and a time', () => {
            // Arrange
            const { field }: Wired<DateTimeFieldComponent> = dateTime()

            // Act
            field.writeValue( { date: '2026-03-04', time: '10:30:00.000Z' } )

            // Assert
            expect( field[ 'date' ]?.toISOString() ).toBe( '2026-03-04T00:00:00.000Z' )
            expect( field[ 'time' ]?.getUTCHours() ).toBe( 10 )
        } )

        it( 'keeps the time when the date changes', () => {
            // Arrange
            const { field, onChange }: Wired<DateTimeFieldComponent> = dateTime()
            field.writeValue( { date: '2026-03-04', time: '10:30:00.000Z' } )
            field[ 'date' ] = new Date( 2026, 4, 6 )

            // Act
            field[ 'onDateChange' ]()

            // Assert
            expect( onChange ).toHaveBeenCalledWith( { date: '2026-05-06', time: '10:30:00.000Z' } )
        } )

        it( 'keeps the date when the time changes', () => {
            // Arrange
            const { field, onChange }: Wired<DateTimeFieldComponent> = dateTime()
            field.writeValue( { date: '2026-03-04', time: undefined } )
            field[ 'time' ] = new Date( Date.UTC( 2026, 0, 1, 8, 15, 0 ) )

            // Act
            field[ 'onTimeChange' ]()

            // Assert
            expect( onChange ).toHaveBeenCalledWith( { date: '2026-03-04', time: '08:15:00.000Z' } )
        } )

        it( 'empties both parts when the form resets', () => {
            // Arrange
            const { field }: Wired<DateTimeFieldComponent> = dateTime()
            field.writeValue( { date: '2026-03-04', time: '10:30:00.000Z' } )

            // Act
            field.writeValue( undefined )

            // Assert
            expect( field[ 'date' ] ).toBeUndefined()
            expect( field[ 'time' ] ).toBeUndefined()
        } )
    } )

    describe( 'select elements field', () => {
        function select (multiple: boolean): Wired<SelectElementsFieldComponent<Element>> {
            const { fixture, field }: Handle<SelectElementsFieldComponent<Element>> = create( SelectElementsFieldComponent<Element> )
            fixture.componentRef.setInput( 'selectItemBuilder', (element: Element): object => ({ label: element.id, value: element }) )
            fixture.componentRef.setInput( 'multiple', multiple )
            const onChange: Mock = vi.fn()
            field.registerOnChange( onChange )
            return { field, onChange }
        }

        function pick (id: string): { value: { value: Element } } {
            return { value: { value: { id } } }
        }

        it( 'replaces the selection in single mode', () => {
            // Arrange
            const { field, onChange }: Wired<SelectElementsFieldComponent<Element>> = select( false )

            // Act
            field[ 'handleElementSelection' ]( pick( 'a' ) as never )

            // Assert
            expect( onChange ).toHaveBeenCalledWith( { id: 'a' } )
            expect( field[ 'simpleValue' ]() ).toEqual( { id: 'a' } )
        } )

        it( 'appends to the selection in multiple mode', () => {
            // Arrange
            const { field, onChange }: Wired<SelectElementsFieldComponent<Element>> = select( true )
            field.writeValue( [ { id: 'a' } ] )

            // Act
            field[ 'handleElementSelection' ]( pick( 'b' ) as never )

            // Assert
            expect( onChange ).toHaveBeenCalledWith( [ { id: 'a' }, { id: 'b' } ] )
        } )

        it( 'highlights an element already selected instead of adding it twice', () => {
            // Arrange
            const { field, onChange }: Wired<SelectElementsFieldComponent<Element>> = select( true )
            field.writeValue( [ { id: 'a' } ] )

            // Act
            field[ 'handleElementSelection' ]( pick( 'a' ) as never )

            // Assert
            expect( highlight ).toHaveBeenCalledWith( 'a' )
            expect( onChange ).not.toHaveBeenCalled()
        } )

        it( 'clears the selection in single mode', () => {
            // Arrange
            const { field, onChange }: Wired<SelectElementsFieldComponent<Element>> = select( false )
            field.writeValue( { id: 'a' } )

            // Act
            field[ 'handleElementRemoving' ]( 'a' )

            // Assert
            expect( onChange ).toHaveBeenCalledWith( undefined )
        } )

        it( 'removes only the given element in multiple mode', () => {
            // Arrange
            const { field, onChange }: Wired<SelectElementsFieldComponent<Element>> = select( true )
            field.writeValue( [ { id: 'a' }, { id: 'b' } ] )

            // Act
            field[ 'handleElementRemoving' ]( 'a' )

            // Assert
            expect( onChange ).toHaveBeenCalledWith( [ { id: 'b' } ] )
        } )

        it( 'exposes an empty list in multiple mode before any value', () => {
            // Arrange
            const { field }: Wired<SelectElementsFieldComponent<Element>> = select( true )

            // Act
            const values: unknown[] = field[ 'multipleValue' ]()

            // Assert
            expect( values ).toEqual( [] )
        } )
    } )
} )
