import { Type } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserService } from '@core/browser/browser.service'
import { UiFacade } from '@core/registry/state/ui.facade'
import { autoMock } from '@shared/helpers/testing/auto-mock'
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
        [ 'number range', NumberRangeFieldComponent, {} ],
    ] as [ string, Type<unknown>, Record<string, unknown> ][] )( '%s field', (_name: string, type: Type<unknown>, inputs: Record<string, unknown>) => {
        it( 'starts without a value and follows the disabled state of the form', () => {
            // Arrange
            const { fixture, field }: Handle<unknown> = create( type, inputs )

            // Act
            fixture.componentRef.setInput( 'disabled', true )

            // Assert
            expect( (field as unknown as { disabled: () => boolean }).disabled() ).toBe( true )
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

    describe( 'select elements field', () => {
        function select (): Handle<SelectElementsFieldComponent<Element>> {
            return create( SelectElementsFieldComponent<Element>, {
                selectItemBuilder: (element: Element): object => ({ label: element.id, value: element }),
            } )
        }

        it( 'appends to the selection', () => {
            // Arrange
            const { fixture, field, touched }: Handle<SelectElementsFieldComponent<Element>> = select()
            fixture.componentRef.setInput( 'suggestions', [ { label: 'b', value: { id: 'b' } } ] )
            field.value.set( [ { id: 'a' } ] )
            const target: { value: string } = { value: 'b' }

            // Act
            field[ 'handleChoice' ]( { target } as unknown as Event )

            // Assert
            expect( field.value() ).toEqual( [ { id: 'a' }, { id: 'b' } ] )
            expect( target.value ).toBe( '' )
            expect( touched ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'empties the select and adds nothing when the chosen id is not among the suggestions', () => {
            // Arrange
            const { fixture, field, touched }: Handle<SelectElementsFieldComponent<Element>> = select()
            fixture.componentRef.setInput( 'suggestions', [ { label: 'b', value: { id: 'b' } } ] )
            const target: { value: string } = { value: 'unknown' }

            // Act
            field[ 'handleChoice' ]( { target } as unknown as Event )

            // Assert
            expect( target.value ).toBe( '' )
            expect( field.value() ).toEqual( [] )
            expect( touched ).not.toHaveBeenCalled()
        } )

        it( 'highlights an element already selected instead of adding it twice', () => {
            // Arrange
            const { field, touched }: Handle<SelectElementsFieldComponent<Element>> = select()
            field.value.set( [ { id: 'a' } ] )

            // Act
            field[ 'handleElementSelection' ]( { id: 'a' } )

            // Assert
            expect( highlight ).toHaveBeenCalledWith( 'a', expect.anything() )
            expect( field.value() ).toEqual( [ { id: 'a' } ] )
            expect( touched ).not.toHaveBeenCalled()
        } )

        it( 'keeps apart the elements that have no id', () => {
            // Arrange
            const { field }: Handle<SelectElementsFieldComponent<Element>> = select()
            const first: Element = {} as Element
            const second: Element = {} as Element
            field.value.set( [ first ] )

            // Act
            field[ 'handleElementSelection' ]( second )
            field[ 'handleElementSelection' ]( first )

            // Assert
            expect( field.value() ).toEqual( [ first, second ] )
            expect( field.value()[ 0 ] ).toBe( first )
            expect( field.value()[ 1 ] ).toBe( second )
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

        it( 'announces what was added, a duplicate and what was removed', () => {
            // Arrange
            const { field }: Handle<SelectElementsFieldComponent<Element>> = select()
            const announced: string[] = []

            // Act
            field[ 'handleElementSelection' ]( { id: 'a' } )
            announced.push( field[ 'announcement' ]() )
            field[ 'handleElementSelection' ]( { id: 'a' } )
            announced.push( field[ 'announcement' ]() )
            field[ 'handleElementRemoving' ]( 'a' )
            announced.push( field[ 'announcement' ]() )

            // Assert
            expect( announced ).toEqual( [ 'global.selection.added', 'global.selection.duplicate', 'global.selection.removed' ] )
        } )

        it( 'expands a chosen suggestion into several grouped elements and skips the duplicates', () => {
            // Arrange
            const { fixture, field, touched }: Handle<SelectElementsFieldComponent<Element>> = select()
            fixture.componentRef.setInput( 'expand', (): Element[] => [ { id: 'a' }, { id: 'b' } ] )
            field.value.set( [ { id: 'a' } ] )

            // Act
            field[ 'handleElementSelection' ]( { id: 'group' } )

            // Assert
            expect( field.value() ).toEqual( [ { id: 'a' }, { id: 'b' } ] )
            expect( highlight ).toHaveBeenCalledWith( 'a', expect.anything() )
            expect( touched ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'announces a duplicate when every expanded element is already selected', () => {
            // Arrange
            const { fixture, field, touched }: Handle<SelectElementsFieldComponent<Element>> = select()
            fixture.componentRef.setInput( 'expand', (): Element[] => [ { id: 'a' } ] )
            field.value.set( [ { id: 'a' } ] )

            // Act
            field[ 'handleElementSelection' ]( { id: 'group' } )

            // Assert
            expect( field[ 'announcement' ]() ).toBe( 'global.selection.duplicate' )
            expect( touched ).not.toHaveBeenCalled()
        } )

        it( 'adds nothing when a suggestion expands to no element', () => {
            // Arrange
            const { fixture, field, touched }: Handle<SelectElementsFieldComponent<Element>> = select()
            fixture.componentRef.setInput( 'expand', (): Element[] => [] )

            // Act
            field[ 'handleElementSelection' ]( { id: 'group' } )

            // Assert
            expect( field.value() ).toEqual( [] )
            expect( field[ 'announcement' ]() ).toBe( '' )
            expect( touched ).not.toHaveBeenCalled()
        } )

        it( 'separates the grouped elements and removes a whole group', () => {
            // Arrange
            const { fixture, field }: Handle<SelectElementsFieldComponent<Element>> = select()
            fixture.componentRef.setInput( 'groupOf', (element: Element): string | undefined => element.id.startsWith( 'g' ) ? 'team' : undefined )
            field.value.set( [ { id: 'a' }, { id: 'g1' }, { id: 'g2' } ] )

            // Act
            const before: unknown = [ field[ 'ungrouped' ](), field[ 'groups' ]() ]
            field[ 'handleGroupRemoving' ]( 'team' )

            // Assert
            expect( before ).toEqual( [ [ { id: 'a' } ], [ { name: 'team', elements: [ { id: 'g1' }, { id: 'g2' } ] } ] ] )
            expect( field.value() ).toEqual( [ { id: 'a' } ] )
            expect( field[ 'announcement' ]() ).toBe( 'global.selection.removed' )
        } )

        it( 'gives the focus back to the search field after a removal', () => {
            // Arrange
            const { fixture, field }: Handle<SelectElementsFieldComponent<Element>> = select()
            const search: HTMLElement = document.createElement( 'sgdf-select' )
            const focus: Mock<() => void> = vi.spyOn( search, 'focus' ).mockImplementation( () => undefined )
            fixture.nativeElement.appendChild( search )
            field.value.set( [ { id: 'a' } ] )

            // Act
            field[ 'handleElementRemoving' ]( 'a' )

            // Assert
            expect( focus ).toHaveBeenCalledTimes( 1 )
        } )
    } )
} )
