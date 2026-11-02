import { signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { KeyValuePipe, NgTemplateOutlet, TitleCasePipe, UpperCasePipe } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { MockBuilder } from 'ng-mocks'
import { beforeEach, describe, expect, it } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { MovementPrefillService } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-prefill.service'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { TruncatePipe } from '@shared/helpers/pipe/truncate.pipe'
import { MovementActions } from '@shared/ui/domain/movement-element/movement-actions.service'
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component'
import { MovementModel } from '@shared/models/model/movement.model'

const MOVEMENT: MovementModel = {
    id: 'm1',
    visible: true,
    dateTime: new Date( '2026-01-01T10:00:00Z' ),
    type: { value: 'IN', label: 'Entrée' },
    reason: undefined,
    content: [
        { poolName: 'car 1', vehicle: { id: 'v1' }, participant: { id: 'a', firstName: 'ada', lastName: 'lovelace', major: true } },
        { poolName: undefined, participant: { id: 'b', firstName: 'bob', lastName: 'martin', major: false } },
    ],
} as unknown as MovementModel

describe( 'MovementElementComponent template', () => {
    let fixture: ComponentFixture<MovementElementComponent>
    let canCreate: WritableSignal<boolean>

    const testIds = (): string[] => Array.from<HTMLElement>( fixture.nativeElement.querySelectorAll( '[data-testid]' ) )
        .map( (element: HTMLElement): string => element.getAttribute( 'data-testid' )! )

    async function render (reversible?: boolean): Promise<void> {
        fixture = TestBed.createComponent( MovementElementComponent )
        fixture.componentRef.setInput( 'movement', MOVEMENT )
        if (reversible !== undefined) fixture.componentRef.setInput( 'reversible', reversible )
        await fixture.whenStable()
    }

    beforeEach( async () => {
        canCreate = signal( true )
        await MockBuilder( MovementElementComponent )
            .keep( NgTemplateOutlet ).keep( KeyValuePipe ).keep( TitleCasePipe ).keep( UpperCasePipe )
            .mock( TranslocoPipe, (key: string): string => key )
            .mock( PluralTranslationPipe, (key: string): string => key )
            .mock( DateFormatPipe, (): string => 'date' )
            .mock( TruncatePipe, (value: string): string => value )
            .provide( { provide: UiFacade, useValue: { tinyScreen: signal( false ) } } )
            .provide( { provide: SessionFacade, useValue: { selectedProjectHasOption: (): ReturnType<typeof signal<boolean>> => signal( false ), currentUser: signal( undefined ), currentProjectId: signal( 'p1' ) } } )
            .provide( { provide: MovementPrefillService, useValue: { canCreate } } )
            .provide( { provide: ActivatedRoute, useValue: {} } )
            .provide( { provide: Router, useValue: { navigateByUrl: (): Promise<boolean> => Promise.resolve( true ) } } )
            .provide( { provide: MovementActions, useValue: { actionsFor: (): unknown[] => [] } } )
    } )

    it( 'hides the reverse buttons unless the list asks for them', async () => {
        // Arrange
        await render()

        // Act
        const ids: string[] = testIds()

        // Assert
        expect( ids ).not.toContain( 'movement-element-reverse-button' )
        expect( ids ).not.toContain( 'movement-element-participant-reverse-button' )
    } )

    it( 'shows the reverse buttons when the list is reversible and the user can create movements', async () => {
        // Arrange
        await render( true )

        // Act
        const ids: string[] = testIds()

        // Assert
        expect( ids ).toContain( 'movement-element-reverse-button' )
        expect( ids ).toContain( 'movement-element-participant-reverse-button' )
    } )

    it( 'adds an independent tab when the movement has a pool', async () => {
        // Arrange
        await render()

        // Act
        const ids: string[] = testIds()

        // Assert
        expect( ids ).toContain( 'movement-element-independent-tab' )
        expect( ids ).toContain( 'movement-element-pool-tab' )
    } )

    it( 'opens the vehicles drawer from the vehicles button and lists each vehicle with its carrier', async () => {
        // Arrange
        await render()
        const button: HTMLElement = fixture.nativeElement.querySelector( '[data-testid="movement-element-vehicles-button"]' )

        // Act
        button.click()
        await fixture.whenStable()

        // Assert
        const drawer: HTMLElement = fixture.nativeElement.querySelector( '[data-testid="movement-element-vehicles-drawer"]' )
        expect( drawer.hasAttribute( 'open' ) || (drawer as unknown as { open: boolean }).open ).toBe( true )
        expect( drawer.querySelectorAll( '[data-testid="vehicle-row"]' ) ).toHaveLength( 1 )
        expect( drawer.textContent ).toContain( 'Ada LOVELACE' )
    } )
} )
