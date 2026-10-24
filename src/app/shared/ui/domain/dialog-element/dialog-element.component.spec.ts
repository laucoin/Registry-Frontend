import { signal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { describe, expect, it, Mock, vi } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import { CommunicationActions } from '@shared/ui/domain/dialog-element/communication-actions.service'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { DialogElementComponent } from '@shared/ui/domain/dialog-element/dialog-element.component'

const ELEMENT: object = { id: 'e1', visible: true, title: 'x', status: { value: 'IN_PROGRESS', label: 'x' }, content: [] }

describe( 'DialogElementComponent', () => {
    let confirm: Mock<(confirmation: { accept: () => void }) => void>
    let facade: Record<string, Mock>
    let fixture: ComponentFixture<DialogElementComponent>

    function create (element: object, authorities: string[] = [ 'p1_REGISTRY_PROJECT_COMMUNICATION_U', 'p1_REGISTRY_PROJECT_COMMUNICATION_D' ]): DialogElementComponent {
        confirm = vi.fn()
        facade = new Proxy( {} as Record<string, Mock>, {
            get: (target: Record<string, Mock>, key: string): Mock => target[ key ] ?? (target[ key ] = vi.fn( () => of( undefined ) )),
        } )
        TestBed.configureTestingModule( {
            providers: [
                { provide: CommunicationFacade, useValue: facade },
                { provide: SessionFacade, useValue: { currentUser: signal( { id: 'u1', authorities } ), selectedProject: signal( { id: 'p1', options: [] } ), currentProjectId: signal( 'p1' ) } },
                { provide: UiFacade, useValue: { tinyScreen: signal( false ), notify: vi.fn(), confirm } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
                { provide: Router, useValue: { navigateByUrl: vi.fn( () => Promise.resolve( true ) ) } },
                { provide: ActivatedRoute, useValue: {} },
            ],
        } )
        TestBed.overrideComponent( DialogElementComponent, { set: { template: '', imports: [], providers: [ CommunicationActions ], styleUrl: undefined, styleUrls: [] } } )
        fixture = TestBed.createComponent( DialogElementComponent )
        fixture.componentRef.setInput( 'communication', element )
        return fixture.componentInstance
    }

    function labelsOf (component: DialogElementComponent): string[] {
        const actions: ElementActionModel[] = (component as unknown as { actions: () => ElementActionModel[] }).actions()
        return actions.map( (action: ElementActionModel): string => action.id )
    }

    function actionOf (component: DialogElementComponent, id: string): ElementActionModel {
        return (component as unknown as { actions: () => ElementActionModel[] }).actions().find( (action: ElementActionModel): boolean => action.id === id )!
    }

    it( 'lists the actions of a visible element in a stable order', () => {
        // Arrange
        const component: DialogElementComponent = create( ELEMENT )

        // Act
        const ids: string[] = labelsOf( component )

        // Assert
        expect( ids ).toEqual( [ 'edit', 'disable', 'delete' ] )
    } )

    it( 'offers enable instead of disable for a hidden element', () => {
        // Arrange
        const component: DialogElementComponent = create( { ...ELEMENT, visible: false } )

        // Act
        const ids: string[] = labelsOf( component )

        // Assert
        expect( ids ).toContain( 'enable' )
        expect( ids ).not.toContain( 'disable' )
    } )

    it( 'asks for a confirmation before deleting, then deletes the element', () => {
        // Arrange
        const component: DialogElementComponent = create( ELEMENT )

        // Act
        actionOf( component, 'delete' ).run()
        confirm.mock.calls[ 0 ][ 0 ].accept()

        // Assert
        expect( confirm ).toHaveBeenCalledTimes( 1 )
        expect( facade[ 'deleteCommunication' ] ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'loads the communication in the form when the user edits it', () => {
        // Arrange
        const component: DialogElementComponent = create( ELEMENT )

        // Act
        actionOf( component, 'edit' ).run()

        // Assert
        expect( facade[ 'fetchCommunication' ] ).toHaveBeenCalledWith( 'e1' )
    } )

    it( 'asks for a confirmation before hiding, then hides the communication', () => {
        // Arrange
        const component: DialogElementComponent = create( ELEMENT )

        // Act
        actionOf( component, 'disable' ).run()
        confirm.mock.calls[ 0 ][ 0 ].accept()

        // Assert
        expect( facade[ 'disableCommunication' ] ).toHaveBeenCalledWith( 'e1' )
    } )

    it( 'disables the commands the user has no authority for', () => {
        // Arrange
        const component: DialogElementComponent = create( ELEMENT, [] )

        // Act
        const disabled: boolean[] = (component as unknown as { actions: () => ElementActionModel[] }).actions().map( (action: ElementActionModel): boolean => action.disabled )

        // Assert
        expect( disabled.every( Boolean ) ).toBe( true )
    } )

    function read<T> (component: DialogElementComponent, name: string): T {
        return ( component as unknown as Record<string, () => T> )[ name ]()
    }

    const EDITOR: object = { id: 'u1', firstName: 'Ada', lastName: 'Lovelace' }

    it( 'names the author of a message by the last editor', () => {
        // Arrange
        const component: DialogElementComponent = create( { ...ELEMENT, lastEdition: { user: EDITOR } } )

        // Act
        const name: string = read( component, 'authorName' )

        // Assert
        expect( name ).toBe( 'Ada Lovelace' )
        expect( read( component, 'authorIsCurrentUser' ) ).toBe( true )
    } )

    it( 'names the author of a message sent by a movement by its reason', () => {
        // Arrange
        const component: DialogElementComponent = create( { ...ELEMENT, movement: { id: 'm1', reason: { label: 'Arrival' } }, lastEdition: { user: EDITOR } } )

        // Act
        const name: string = read( component, 'authorName' )

        // Assert
        expect( name ).toBe( 'Arrival' )
        expect( read( component, 'authorIsCurrentUser' ) ).toBe( false )
    } )

    it( 'falls back to the unknown author label', () => {
        // Arrange
        const component: DialogElementComponent = create( ELEMENT )

        // Act
        const name: string = read( component, 'authorName' )

        // Assert
        expect( name ).toBe( 'communications.no-author' )
    } )

    it.each( [ [ 'u1', false ], [ 'u2', true ], [ undefined, true ] ] )( 'treats a message after the author %s as a first message: %s', (previous: string | undefined, expected: boolean) => {
        // Arrange
        const component: DialogElementComponent = create( { ...ELEMENT, lastEdition: { user: EDITOR } } )
        fixture.componentRef.setInput( 'previousAuthorId', previous )

        // Act
        const first: boolean = read( component, 'firstAuthorMessage' )

        // Assert
        expect( first ).toBe( expected )
    } )

    it( 'flags a communication edited after its creation as updated', () => {
        // Arrange
        const component: DialogElementComponent = create( { ...ELEMENT, creation: { dateTime: new Date( '2026-01-01' ) }, lastEdition: { dateTime: new Date( '2026-01-02' ), user: EDITOR } } )

        // Act
        const updated: boolean = read( component, 'updated' )

        // Assert
        expect( updated ).toBe( true )
    } )

    it( 'tells a blank alert title from a written one', () => {
        // Arrange
        const blank: DialogElementComponent = create( { ...ELEMENT, alert: { title: ' ', status: { value: 'IN_PROGRESS' } } } )

        // Act
        const isBlank: boolean = read( blank, 'alertTitleBlank' )

        // Assert
        expect( isBlank ).toBe( true )
        expect( read( blank, 'alertVariant' ) ).toBe( 'warning' )
    } )
} )
