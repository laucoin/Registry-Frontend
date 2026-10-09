import { Component, DebugElement, linkedSignal, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FieldTree, form, FormField } from '@angular/forms/signals'
import { By } from '@angular/platform-browser'
import { Checkbox } from 'primeng/checkbox'
import { describe, expect, it } from 'vitest'

@Component( {
    imports: [ Checkbox, FormField ],
    template: `
        <p-checkbox binary [formField]='allForm' inputId='all' />
        @for (key of keys; track key) {
            <p-checkbox binary [formField]='optionsForm[key]' [inputId]='key' />
        }`,
} )
class HostComponent {
    protected readonly keys: string[] = [ 'A', 'B' ]
    public readonly options: WritableSignal<Record<string, boolean>> = signal( { A: false, B: false } )
    public readonly all: WritableSignal<boolean> = linkedSignal( (): boolean => Object.values( this.options() ).every( Boolean ) )
    protected readonly allForm: FieldTree<boolean> = form( this.all )
    protected readonly optionsForm: FieldTree<Record<string, boolean>> = form( this.options )
}

describe( 'project form binding', () => {
    it( 'shows the dynamic option values and writes a click back to the model', async () => {
        // Arrange
        const fixture: ComponentFixture<HostComponent> = TestBed.createComponent( HostComponent )
        fixture.detectChanges()
        const boxes: Checkbox[] = fixture.debugElement.queryAll( By.directive( Checkbox ) ).map( (box: DebugElement): Checkbox => box.componentInstance )

        // Act
        fixture.componentInstance.options.set( { A: true, B: true } )
        fixture.detectChanges()
        await fixture.whenStable()
        const shown: unknown[] = boxes.map( (box: Checkbox): unknown => box.checked() )
        fixture.debugElement.query( By.css( 'input#B' ) ).nativeElement.click()
        fixture.detectChanges()

        // Assert
        expect( shown ).toEqual( [ true, true, true ] )
        expect( fixture.componentInstance.options() ).toEqual( { A: true, B: false } )
    } )
} )
