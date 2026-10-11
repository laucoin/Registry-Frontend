import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { MovementActions } from '@shared/ui/domain/movement-element/movement-actions.service'
import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component'

const ELEMENT: object = { id: 'e1', visible: true, title: 'x', status: { value: 'IN_PROGRESS', label: 'x' }, content: [] }

function hideEvent (own: boolean): Event {
    const target: EventTarget = new EventTarget()
    return Object.defineProperties( new Event( 'sgdf-hide' ), { target: { value: target }, currentTarget: { value: own ? target : new EventTarget() } } )
}

describe( 'MovementElementComponent', () => {
    let confirm: Mock<(confirmation: { accept: () => void }) => void>
    let facade: Record<string, Mock>

    function create (element: object): MovementElementComponent {
        confirm = vi.fn()
        facade = new Proxy( {} as Record<string, Mock>, {
            get: (target: Record<string, Mock>, key: string): Mock => target[ key ] ?? (target[ key ] = vi.fn( () => of( undefined ) )),
        } )
        TestBed.configureTestingModule( {
            providers: [
                { provide: MovementFacade, useValue: facade },
                { provide: SessionFacade, useValue: { currentUser: signal( { id: 'u1', authorities: [ 'p1_REGISTRY_PROJECT_MOVEMENT_U' ] } ), selectedProject: signal( { id: 'p1', options: [] } ), currentProjectId: signal( 'p1' ) } },
                { provide: UiFacade, useValue: { tinyScreen: signal( false ), notify: vi.fn(), confirm } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
                { provide: Router, useValue: { navigateByUrl: vi.fn( () => Promise.resolve( true ) ) } },
                { provide: ActivatedRoute, useValue: {} },
                { provide: PluralTranslationPipe, useValue: { transform: (key: string): string => key } },
                { provide: IntervalPipe, useValue: { transform: (): string => '' } },
                { provide: DateFormatPipe, useValue: { transform: (): string => '' } },
            ],
        } )
        TestBed.overrideComponent( MovementElementComponent, { set: { template: '', imports: [], providers: [ MovementActions ], styleUrl: undefined, styleUrls: [] } } )
        const fixture: ReturnType<typeof TestBed.createComponent<MovementElementComponent>> = TestBed.createComponent( MovementElementComponent )
        fixture.componentRef.setInput( 'movement', element )
        return fixture.componentInstance
    }

    function labelsOf (component: MovementElementComponent): string[] {
        const actions: ElementActionModel[] = (component as unknown as { actions: () => ElementActionModel[] }).actions()
        return actions.map( (action: ElementActionModel): string => action.id )
    }

    function actionOf (component: MovementElementComponent, id: string): ElementActionModel {
        return (component as unknown as { actions: () => ElementActionModel[] }).actions().find( (action: ElementActionModel): boolean => action.id === id )!
    }

    beforeEach( () => {
        RegistryConfig.config = { enabledActions: Object.values( ElementActionEnum ) } as never
    } )

    it( 'lists the actions of a visible element in a stable order', () => {
        // Arrange
        const component: MovementElementComponent = create( ELEMENT )

        // Act
        const ids: string[] = labelsOf( component )

        // Assert
        expect( ids ).toEqual( [ 'edit', 'disable', 'delete' ] )
    } )

    it( 'offers enable instead of disable for a hidden element', () => {
        // Arrange
        const component: MovementElementComponent = create( { ...ELEMENT, visible: false } )

        // Act
        const ids: string[] = labelsOf( component )

        // Assert
        expect( ids ).toContain( 'enable' )
        expect( ids ).not.toContain( 'disable' )
    } )

    it( 'asks for a confirmation before deleting, then deletes the element', () => {
        // Arrange
        const component: MovementElementComponent = create( ELEMENT )

        // Act
        actionOf( component, 'delete' ).run()
        confirm.mock.calls[ 0 ][ 0 ].accept()

        // Assert
        expect( confirm ).toHaveBeenCalledTimes( 1 )
        expect( facade[ 'deleteMovement' ] ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'closes the participantsLayerOpened drawer when the drawer itself asks for it', () => {
        // Arrange
        const component: MovementElementComponent = create( ELEMENT )
        const internals: Record<string, { set: (value: boolean) => void, (): boolean }> = component as never
        internals[ 'participantsLayerOpened' ].set( true )

        // Act
        ;(component as unknown as Record<string, (event: Event) => void>)[ 'closeParticipants' ]( hideEvent( true ) )

        // Assert
        expect( internals[ 'participantsLayerOpened' ]() ).toBe( false )
    } )

    it( 'keeps the participantsLayerOpened drawer open when a nested element asks to hide', () => {
        // Arrange
        const component: MovementElementComponent = create( ELEMENT )
        const internals: Record<string, { set: (value: boolean) => void, (): boolean }> = component as never
        internals[ 'participantsLayerOpened' ].set( true )

        // Act
        ;(component as unknown as Record<string, (event: Event) => void>)[ 'closeParticipants' ]( hideEvent( false ) )

        // Assert
        expect( internals[ 'participantsLayerOpened' ]() ).toBe( true )
    } )

    it( 'closes the communicationsLayerOpened drawer when the drawer itself asks for it', () => {
        // Arrange
        const component: MovementElementComponent = create( ELEMENT )
        const internals: Record<string, { set: (value: boolean) => void, (): boolean }> = component as never
        internals[ 'communicationsLayerOpened' ].set( true )

        // Act
        ;(component as unknown as Record<string, (event: Event) => void>)[ 'closeCommunications' ]( hideEvent( true ) )

        // Assert
        expect( internals[ 'communicationsLayerOpened' ]() ).toBe( false )
    } )

    it( 'keeps the communicationsLayerOpened drawer open when a nested element asks to hide', () => {
        // Arrange
        const component: MovementElementComponent = create( ELEMENT )
        const internals: Record<string, { set: (value: boolean) => void, (): boolean }> = component as never
        internals[ 'communicationsLayerOpened' ].set( true )

        // Act
        ;(component as unknown as Record<string, (event: Event) => void>)[ 'closeCommunications' ]( hideEvent( false ) )

        // Assert
        expect( internals[ 'communicationsLayerOpened' ]() ).toBe( true )
    } )

    it( 'counts each distinct vehicle of the movement once', () => {
        // Arrange
        const content: object[] = [ { vehicle: { id: 'v1' } }, { vehicle: { id: 'v1' } }, { vehicle: { id: 'v2' } }, {} ]
        const component: MovementElementComponent = create( { ...ELEMENT, content } )

        // Act
        const count: number = (component as unknown as { vehiclesCount: () => number }).vehiclesCount()

        // Assert
        expect( count ).toBe( 2 )
    } )

    it( 'counts no vehicle for a movement without content', () => {
        // Arrange
        const component: MovementElementComponent = create( { ...ELEMENT, content: [] } )

        // Act
        const count: number = (component as unknown as { vehiclesCount: () => number }).vehiclesCount()

        // Assert
        expect( count ).toBe( 0 )
    } )
} )
