import { signal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { describe, expect, it, Mock, vi } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { AlertActions } from '@shared/ui/domain/alert-element/alert-actions.service'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { AlertElementComponent } from '@shared/ui/domain/alert-element/alert-element.component'

const ELEMENT: object = { id: 'e1', visible: true, title: 'x', status: { value: 'IN_PROGRESS', label: 'x' }, content: [] }

function hideEvent (own: boolean): Event {
    const target: EventTarget = new EventTarget()
    return Object.defineProperties( new Event( 'sgdf-hide' ), { target: { value: target }, currentTarget: { value: own ? target : new EventTarget() } } )
}

describe( 'AlertElementComponent', () => {
    let confirm: Mock<(confirmation: { accept: () => void }) => void>
    let facade: Record<string, Mock>
    let fixture: ComponentFixture<AlertElementComponent>

    function create (element: object): AlertElementComponent {
        confirm = vi.fn()
        facade = new Proxy( {} as Record<string, Mock>, {
            get: (target: Record<string, Mock>, key: string): Mock => target[ key ] ?? (target[ key ] = vi.fn( () => of( undefined ) )),
        } )
        TestBed.configureTestingModule( {
            providers: [
                { provide: AlertFacade, useValue: facade },
                { provide: SessionFacade, useValue: { currentUser: signal( { id: 'u1', authorities: [ 'p1_REGISTRY_PROJECT_ALERT_U' ] } ), selectedProject: signal( { id: 'p1', options: [] } ), currentProjectId: signal( 'p1' ) } },
                { provide: UiFacade, useValue: { tinyScreen: signal( false ), notify: vi.fn(), confirm } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
                { provide: Router, useValue: { navigateByUrl: vi.fn( () => Promise.resolve( true ) ) } },
                { provide: ActivatedRoute, useValue: {} },
                { provide: PluralTranslationPipe, useValue: { transform: (key: string): string => key } },
                { provide: IntervalPipe, useValue: { transform: (): string => '' } },
                { provide: DateFormatPipe, useValue: { transform: (): string => '' } },
            ],
        } )
        TestBed.overrideComponent( AlertElementComponent, { set: { template: '', imports: [], providers: [ AlertActions ], styleUrl: undefined, styleUrls: [] } } )
        fixture = TestBed.createComponent( AlertElementComponent )
        fixture.componentRef.setInput( 'alert', element )
        return fixture.componentInstance
    }

    function labelsOf (component: AlertElementComponent): string[] {
        const actions: ElementActionModel[] = (component as unknown as { actions: () => ElementActionModel[] }).actions()
        return actions.map( (action: ElementActionModel): string => action.id )
    }

    function actionOf (component: AlertElementComponent, id: string): ElementActionModel {
        return (component as unknown as { actions: () => ElementActionModel[] }).actions().find( (action: ElementActionModel): boolean => action.id === id )!
    }

    it( 'lists the actions of a visible element in a stable order', () => {
        // Arrange
        const component: AlertElementComponent = create( ELEMENT )

        // Act
        const ids: string[] = labelsOf( component )

        // Assert
        expect( ids ).toEqual( [ 'resolve', 'cancel', 'disable', 'delete' ] )
    } )

    it( 'offers enable instead of disable for a hidden element', () => {
        // Arrange
        const component: AlertElementComponent = create( { ...ELEMENT, visible: false } )

        // Act
        const ids: string[] = labelsOf( component )

        // Assert
        expect( ids ).toContain( 'enable' )
        expect( ids ).not.toContain( 'disable' )
    } )

    it( 'disables the host of a hidden element only', () => {
        // Arrange
        create( { ...ELEMENT, visible: false } )

        // Act
        fixture.detectChanges()
        const hiddenDisabled: boolean = fixture.nativeElement.disabled
        fixture.componentRef.setInput( 'alert', ELEMENT )
        fixture.detectChanges()

        // Assert
        expect( hiddenDisabled ).toBe( true )
        expect( fixture.nativeElement.disabled ).toBe( false )
    } )

    it( 'asks for a confirmation before deleting, then deletes the element', () => {
        // Arrange
        const component: AlertElementComponent = create( ELEMENT )

        // Act
        actionOf( component, 'delete' ).run()
        confirm.mock.calls[ 0 ][ 0 ].accept()

        // Assert
        expect( confirm ).toHaveBeenCalledTimes( 1 )
        expect( facade[ 'deleteAlert' ] ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'closes the communicationsLayerOpened drawer when the drawer itself asks for it', () => {
        // Arrange
        const component: AlertElementComponent = create( ELEMENT )
        const internals: Record<string, { set: (value: boolean) => void, (): boolean }> = component as never
        internals[ 'communicationsLayerOpened' ].set( true )

        // Act
        ;(component as unknown as Record<string, (event: Event) => void>)[ 'closeCommunications' ]( hideEvent( true ) )

        // Assert
        expect( internals[ 'communicationsLayerOpened' ]() ).toBe( false )
    } )

    it( 'keeps the communicationsLayerOpened drawer open when a nested element asks to hide', () => {
        // Arrange
        const component: AlertElementComponent = create( ELEMENT )
        const internals: Record<string, { set: (value: boolean) => void, (): boolean }> = component as never
        internals[ 'communicationsLayerOpened' ].set( true )

        // Act
        ;(component as unknown as Record<string, (event: Event) => void>)[ 'closeCommunications' ]( hideEvent( false ) )

        // Assert
        expect( internals[ 'communicationsLayerOpened' ]() ).toBe( true )
    } )

    function read<T> (component: AlertElementComponent, name: string): T {
        return ( component as unknown as Record<string, () => T> )[ name ]()
    }

    it.each( [ '', '   ', '\u200B\uFEFF' ] )( 'treats the title %j as blank and falls back to the untitled label', (title: string) => {
        // Arrange
        const component: AlertElementComponent = create( { ...ELEMENT, title } )

        // Act
        const blank: boolean = read( component, 'titleBlank' )

        // Assert
        expect( blank ).toBe( true )
        expect( read( component, 'accessibleTitle' ) ).toBe( 'alerts.untitled' )
    } )

    it( 'keeps a written title as the accessible title', () => {
        // Arrange
        const component: AlertElementComponent = create( { ...ELEMENT, title: 'Fire' } )

        // Act
        const title: string = read( component, 'accessibleTitle' )

        // Assert
        expect( read( component, 'titleBlank' ) ).toBe( false )
        expect( title ).toBe( 'Fire' )
    } )

    it.each( [
        [ 'IN_PROGRESS', 'triangle-exclamation', 'warning', true ],
        [ 'CANCELED', 'xmark', 'neutral', false ],
        [ 'RESOLVED', 'circle-check', 'success', false ],
    ] )( 'shows the %s status with its icon and variant', (value: string, icon: string, variant: string, inProgress: boolean) => {
        // Arrange
        const component: AlertElementComponent = create( { ...ELEMENT, status: { value, label: 'Status' } } )

        // Act
        const shown: string[] = [ read( component, 'statusIconName' ), read( component, 'statusVariant' ), read( component, 'statusLabel' ) ]

        // Assert
        expect( shown ).toEqual( [ icon, variant, 'Status' ] )
        expect( read( component, 'isInProgress' ) ).toBe( inProgress )
    } )

    it( 'appends the elapsed time to the label of an alert in progress once the timer ticked', () => {
        // Arrange
        vi.useFakeTimers()
        const component: AlertElementComponent = create( { ...ELEMENT, status: { value: 'IN_PROGRESS', label: 'Open' }, dateTime: new Date( Date.now() - 60_000 ) } )

        // Act
        vi.advanceTimersByTime( 1100 )

        // Assert
        expect( read<string>( component, 'statusLabel' ) ).toBe( 'Open ()' )
        vi.useRealTimers()
    } )

    it( 'keeps the plain label of an alert that is not in progress when the timer ticks', () => {
        // Arrange
        vi.useFakeTimers()
        const component: AlertElementComponent = create( { ...ELEMENT, status: { value: 'RESOLVED', label: 'Done' } } )

        // Act
        vi.advanceTimersByTime( 1100 )

        // Assert
        expect( read<string>( component, 'statusLabel' ) ).toBe( 'Done' )
        vi.useRealTimers()
    } )
} )
