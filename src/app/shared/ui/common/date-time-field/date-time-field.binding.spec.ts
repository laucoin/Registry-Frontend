import { Component, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FieldTree, FormField, form } from '@angular/forms/signals'
import { UiFacade } from '@core/registry/state/ui.facade'
import { describe, expect, it } from 'vitest'
import { DateTimeFieldComponent } from '@shared/ui/common/date-time-field/date-time-field.component'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'

interface HostModel {
    when: CustomDatetimeModel | null
}

@Component( {
    imports: [ DateTimeFieldComponent, FormField ],
    template: `<app-date-time-field [formField]='tree.when' inputId='when' />`,
} )
class HostComponent {
    public readonly model: WritableSignal<HostModel> = signal( { when: null } )
    protected readonly tree: FieldTree<HostModel> = form( this.model )
}

describe( 'date time field binding', () => {
    it( 'writes the model value to the field and reports the user input back to the model', async () => {
        // Arrange
        TestBed.configureTestingModule( { providers: [ { provide: UiFacade, useValue: { tinyScreen: (): boolean => false } } ] } )
        const fixture: ComponentFixture<HostComponent> = TestBed.createComponent( HostComponent )
        fixture.detectChanges()
        const field: DateTimeFieldComponent = fixture.debugElement.children[ 0 ].componentInstance

        // Act
        fixture.componentInstance.model.set( { when: { date: '2026-06-01', time: '10:00:00' } } )
        fixture.detectChanges()
        await fixture.whenStable()
        const shown: Date | undefined = (field as unknown as { date: Date | undefined }).date
        ;(field as unknown as { date: Date }).date = new Date( 2026, 6, 2 )
        ;(field as unknown as { onDateChange: () => void }).onDateChange()

        // Assert
        expect( [ shown?.getMonth(), fixture.componentInstance.model().when ] ).toEqual( [ 5, { date: '2026-07-02', time: '10:00:00' } ] )
    } )
} )
