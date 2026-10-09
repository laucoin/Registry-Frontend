import { Component, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FieldTree, form, FormField } from '@angular/forms/signals'
import { By } from '@angular/platform-browser'
import { SelectItem } from 'primeng/api'
import { AutoComplete } from 'primeng/autocomplete'
import { describe, expect, it } from 'vitest'
import { FormModelHelper, SelectableItem } from '@shared/helpers/form/form-model.helper'

interface HostModel {
    link: SelectItem<{ id: string }> | null
}

const SUGGESTIONS: SelectItem<{ id: string }>[] = [ { label: 'First', value: { id: 'a' } }, { label: 'Second', value: { id: 'b' } } ]

@Component( {
    imports: [ AutoComplete, FormField ],
    template: `<p-auto-complete optionLabel='label' optionValue='self' [suggestions]='options' [formField]='tree.link' />`,
} )
class HostComponent {
    protected readonly options: SelectableItem<{ id: string }>[] = FormModelHelper.selectable( SUGGESTIONS )
    public readonly model: WritableSignal<HostModel> = signal( { link: null } )
    protected readonly tree: FieldTree<HostModel> = form( this.model )
}

describe( 'autocomplete binding', () => {
    it( 'writes the chosen option itself to the model, not only its value', () => {
        // Arrange
        const fixture: ComponentFixture<HostComponent> = TestBed.createComponent( HostComponent )
        fixture.detectChanges()
        const autocomplete: AutoComplete = fixture.debugElement.query( By.directive( AutoComplete ) ).componentInstance

        // Act
        autocomplete.onOptionSelect( new Event( 'click' ), autocomplete.suggestions()![ 1 ] )
        fixture.detectChanges()

        // Assert
        expect( fixture.componentInstance.model().link ).toBe( SUGGESTIONS[ 1 ] )
        expect( fixture.componentInstance.model().link?.value.id ).toBe( 'b' )
    } )
} )
