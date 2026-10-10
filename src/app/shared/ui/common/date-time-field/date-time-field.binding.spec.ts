import { Component, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FieldTree, form, FormField, SchemaPathTree } from '@angular/forms/signals'
import { UiFacade } from '@core/registry/state/ui.facade'
import { describe, expect, it } from 'vitest'
import { RegistrySchemas } from '@shared/helpers/form/registry.schemas'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { DateTimeFieldComponent } from '@shared/ui/common/date-time-field/date-time-field.component'

interface HostModel {
    when: CustomDatetimeModel | null
}

@Component( {
    imports: [ DateTimeFieldComponent, FormField ],
    template: `<app-date-time-field [formField]='tree.when' inputId='when' />`,
} )
class HostComponent {
    public readonly model: WritableSignal<HostModel> = signal( { when: null } )
    public readonly tree: FieldTree<HostModel> = form( this.model, (path: SchemaPathTree<HostModel>): void => {
        RegistrySchemas.dateRequiredForTime( path.when )
    } )
}

describe( 'date time field binding', () => {
    function create (): { fixture: ComponentFixture<HostComponent>, field: DateTimeFieldComponent } {
        TestBed.configureTestingModule( { providers: [ { provide: UiFacade, useValue: { tinyScreen: (): boolean => false } } ] } )
        const fixture: ComponentFixture<HostComponent> = TestBed.createComponent( HostComponent )
        fixture.detectChanges()
        return { fixture, field: fixture.debugElement.children[ 0 ].componentInstance }
    }

    it( 'shows the model value in the field and writes the user input back to the model', async () => {
        // Arrange
        const { fixture, field }: ReturnType<typeof create> = create()

        // Act
        fixture.componentInstance.model.set( { when: { date: '2026-06-01', time: '10:00:00' } } )
        fixture.detectChanges()
        await fixture.whenStable()
        const shown: Date | undefined = field[ 'date' ]()
        field[ 'onDateChange' ]( new Date( 2026, 6, 2 ) )

        // Assert
        expect( shown?.getUTCMonth() ).toBe( 5 )
        expect( fixture.componentInstance.model().when ).toEqual( { date: '2026-07-02', time: '10:00:00' } )
    } )

    it( 'receives the invalid state from the form and the touched state once the user interacted', async () => {
        // Arrange
        const { fixture, field }: ReturnType<typeof create> = create()

        // Act
        field[ 'onTimeChange' ]( new Date( Date.UTC( 2026, 0, 1, 8, 15, 0 ) ) )
        fixture.detectChanges()
        await fixture.whenStable()

        // Assert
        expect( field.invalid() ).toBe( true )
        expect( fixture.componentInstance.tree.when().touched() ).toBe( true )
        expect( field[ 'showInvalid' ]() ).toBe( true )
    } )
} )
