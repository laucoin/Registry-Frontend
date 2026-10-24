import { signal, Type } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { MenuEntryModel } from '@shared/models/model/menu-entry.model'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { UserProfileFacade } from '@core/registry/state/user-profile.facade'
import { UserFacade } from '@pages/users/data/state/user.facade'
import { UserElementComponent } from '@pages/users/user-element/user-element.component'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { GenericElementComponent } from '@shared/ui/base/generic-element.component'

interface ElementCase {
    name: string
    type: Type<GenericElementComponent>
    facade: Type<unknown>
    inputs: Record<string, unknown>
    labels: string[]
    deleteCall: string
}

const VISIBLE: object = { id: 'e1', visible: true, name: 'x', type: { value: 'IN' }, status: { value: 'IN_PROGRESS', label: 'x' }, firstName: 'A', lastName: 'B', content: [] }

const CASES: ElementCase[] = [
    { name: 'user', type: UserElementComponent, facade: UserFacade, inputs: { user: VISIBLE }, deleteCall: 'deleteUser',
        labels: [ 'update-role', 'disable', 'enable', 'export', 'delete' ] },
]

describe( 'element action menus', () => {
    let confirm: Mock<(confirmation: { accept: () => void }) => void>

    function facadeMock (call: string): Record<string, Mock> {
        return new Proxy( { [ call ]: vi.fn( () => of( undefined ) ) } as Record<string, Mock>, {
            get: (target: Record<string, Mock>, key: string): Mock => target[ key ] ?? (target[ key ] = vi.fn( () => of( undefined ) )),
        } )
    }

    function create (item: ElementCase, inputs: Record<string, unknown>, facade: Record<string, Mock>): GenericElementComponent {
        confirm = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                { provide: item.facade, useValue: facade },
                { provide: SessionFacade, useValue: { currentUser: signal( { id: 'u1', authorities: [ 'p1_REGISTRY_PROJECT_ALERT_U' ] } ), selectedProject: signal( { id: 'p1', options: [] } ), currentProjectId: signal( 'p1' ) } },
                { provide: UserProfileFacade, useValue: {} },
                { provide: UiFacade, useValue: { tinyScreen: signal( false ), notify: vi.fn(), confirm } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
                { provide: Router, useValue: { navigateByUrl: vi.fn( () => Promise.resolve( true ) ) } },
                { provide: ActivatedRoute, useValue: {} },
                { provide: PluralTranslationPipe, useValue: { transform: (key: string): string => key } },
                { provide: IntervalPipe, useValue: { transform: (): string => '' } },
                { provide: DateFormatPipe, useValue: { transform: (): string => '' } },
            ],
        } )
        TestBed.overrideComponent( item.type, { set: { template: '', imports: [], providers: [], styleUrl: undefined, styleUrls: [] } } )
        const fixture: ReturnType<typeof TestBed.createComponent<GenericElementComponent>> = TestBed.createComponent( item.type )
        Object.entries( inputs ).forEach( ([ name, value ]: [ string, unknown ]): void => fixture.componentRef.setInput( name, value ) )
        return fixture.componentInstance
    }

    function actionsOf (component: GenericElementComponent): MenuEntryModel[] {
        return (component as unknown as { actions: () => MenuEntryModel[] }).actions()
    }

    beforeEach( () => {
    } )

    it.each( CASES )( 'lists the $name actions in a stable order', (item: ElementCase) => {
        // Arrange
        const component: GenericElementComponent = create( item, item.inputs, facadeMock( item.deleteCall ) )

        // Act
        const labels: string[] = actionsOf( component ).map( (action: MenuEntryModel): string => action.label!.split( '.' ).pop()! )

        // Assert
        expect( labels ).toEqual( item.labels )
    } )

    it.each( CASES.filter( (item: ElementCase): boolean => item.labels.includes( 'disable' ) ) )( 'shows disable for a visible $name and enable for a hidden one', (item: ElementCase) => {
        // Arrange
        const visibleAction: GenericElementComponent = create( item, item.inputs, facadeMock( item.deleteCall ) )
        const visibleMenu: MenuEntryModel[] = actionsOf( visibleAction )
        TestBed.resetTestingModule()
        const hiddenInputs: Record<string, unknown> = Object.fromEntries( Object.entries( item.inputs ).map( ([ key, value ]: [ string, unknown ]): [ string, unknown ] => [ key, typeof value === 'object' ? { ...(value as object), visible: false } : value ] ) )
        const hiddenAction: GenericElementComponent = create( item, hiddenInputs, facadeMock( item.deleteCall ) )

        // Act
        const hiddenMenu: MenuEntryModel[] = actionsOf( hiddenAction )

        // Assert
        const flag = (menu: MenuEntryModel[], label: string): boolean | undefined => menu.find( (action: MenuEntryModel): boolean => action.label!.endsWith( `.${label}` ) )?.visible
        expect( flag( visibleMenu, 'disable' ) ).toBe( true )
        expect( flag( visibleMenu, 'enable' ) ).toBe( false )
        expect( flag( hiddenMenu, 'disable' ) ).toBe( false )
        expect( flag( hiddenMenu, 'enable' ) ).toBe( true )
    } )

    it.each( CASES )( 'asks for a confirmation before deleting a $name, then deletes it', (item: ElementCase) => {
        // Arrange
        const facade: Record<string, Mock> = facadeMock( item.deleteCall )
        const component: GenericElementComponent = create( item, item.inputs, facade )
        const deleteAction: MenuEntryModel = actionsOf( component ).find( (action: MenuEntryModel): boolean => action.label!.endsWith( '.delete' ) )!

        // Act
        deleteAction.command!( {} as never )
        confirm.mock.calls[ 0 ][ 0 ].accept()

        // Assert
        expect( confirm ).toHaveBeenCalledTimes( 1 )
        expect( facade[ item.deleteCall ] ).toHaveBeenCalledTimes( 1 )
    } )
} )
