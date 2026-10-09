import { Component, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FieldTree, FormField } from '@angular/forms/signals'
import { Select } from 'primeng/select'
import { describe, expect, it } from 'vitest'
import { createUserForm, UserFormModel } from '@pages/users/user-form/user.form'

@Component( {
    imports: [ Select, FormField ],
    template: `<p-select [options]='options' [formField]='form.role' optionLabel='label' optionValue='value' />`,
} )
class HostComponent {
    protected readonly options: { label: string, value: string }[] = [ { label: 'Admin', value: 'ADMIN' }, { label: 'Chief', value: 'CHIEF' } ]
    public readonly model: WritableSignal<UserFormModel> = signal( { role: '' } )
    protected readonly form: FieldTree<UserFormModel> = createUserForm( this.model )
    public readonly tree: FieldTree<UserFormModel> = this.form
}

describe( 'user form binding', () => {
    it( 'keeps the select and the model in sync in both directions', async () => {
        // Arrange
        const fixture: ComponentFixture<HostComponent> = TestBed.createComponent( HostComponent )
        fixture.detectChanges()
        const select: Select = fixture.debugElement.children[0].componentInstance

        // Act
        fixture.componentInstance.model.set( { role: 'CHIEF' } )
        fixture.detectChanges()
        await fixture.whenStable()
        const shown: unknown = select.modelValue()
        select.onOptionSelect( new Event( 'click' ), { label: 'Admin', value: 'ADMIN' } )
        fixture.detectChanges()

        // Assert
        expect( [ shown, fixture.componentInstance.model().role, fixture.componentInstance.tree.role().touched() ] ).toEqual( [ 'CHIEF', 'ADMIN', false ] )
    } )
} )
