import { Component, DebugElement, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FieldTree, form, FormField } from '@angular/forms/signals'
import { By } from '@angular/platform-browser'
import { InputText } from 'primeng/inputtext'
import { RadioButton } from 'primeng/radiobutton'
import { describe, expect, it } from 'vitest'

interface HostModel {
    kind: string
    guests: { firstName: string }[]
}

@Component( {
    imports: [ InputText, RadioButton, FormField ],
    template: `
        @for (kind of kinds; track kind) {
            <p-radio-button [inputId]='"kind_" + kind' [value]='kind' [formField]='tree.kind' />
        }
        @for (guest of tree.guests; track $index) {
            <input pInputText [id]='"guest_" + $index' [formField]='guest.firstName' />
        }`,
} )
class HostComponent {
    protected readonly kinds: string[] = [ 'REGISTERED', 'GUEST' ]
    public readonly model: WritableSignal<HostModel> = signal( { kind: 'REGISTERED', guests: [ { firstName: 'A' } ] } )
    protected readonly tree: FieldTree<HostModel> = form( this.model )
}

describe( 'movement form binding', () => {
    it( 'shows the radio choice, lists the guests and writes the typed text back', async () => {
        // Arrange
        const fixture: ComponentFixture<HostComponent> = TestBed.createComponent( HostComponent )
        fixture.detectChanges()
        const radios: DebugElement[] = fixture.debugElement.queryAll( By.directive( RadioButton ) )

        // Act
        fixture.componentInstance.model.set( { kind: 'GUEST', guests: [ { firstName: 'A' }, { firstName: 'B' } ] } )
        fixture.detectChanges()
        await fixture.whenStable()
        const checked: boolean[] = radios.map( (radio: DebugElement): boolean => (radio.componentInstance as RadioButton).checked() === true )
        const inputs: HTMLInputElement[] = fixture.debugElement.queryAll( By.css( 'input[pInputText]' ) ).map( (input: DebugElement): HTMLInputElement => input.nativeElement )
        inputs[ 1 ].value = 'Bob'
        inputs[ 1 ].dispatchEvent( new Event( 'input' ) )
        radios[ 0 ].query( By.css( 'input' ) ).nativeElement.click()
        fixture.detectChanges()

        // Assert
        expect( checked ).toEqual( [ false, true ] )
        expect( inputs.map( (input: HTMLInputElement): string => input.value ) ).toEqual( [ 'A', 'Bob' ] )
        expect( JSON.parse( JSON.stringify( fixture.componentInstance.model() ) ) ).toEqual( { kind: 'REGISTERED', guests: [ { firstName: 'A' }, { firstName: 'Bob' } ] } )
    } )
} )
