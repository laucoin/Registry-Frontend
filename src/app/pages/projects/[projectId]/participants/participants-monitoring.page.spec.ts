import { signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { MockBuilder, ngMocks } from 'ng-mocks'
import { BehaviorSubject } from 'rxjs'
import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { GroupStatusFacade } from '@pages/projects/[projectId]/participants/data/state/group-status.facade'
import { pageOf } from '@shared/helpers/testing/test-fixtures'
import { GroupModel } from '@shared/models/model/group.model'
import { PageModel } from '@shared/models/model/page.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ParticipantsMonitoringPage } from './participants-monitoring.page'

const GROUP: GroupModel = { id: 'g1', name: 'Wolves', visible: true, creation: undefined, lastEdition: undefined, status: undefined, startAvailability: undefined, endAvailability: undefined, membersCount: 1, insideMembersCount: 1, outsideMembersCount: 0, members: [] }

describe( 'ParticipantsMonitoringPage', () => {
    let fixture: ComponentFixture<ParticipantsMonitoringPage>
    let queryParams: BehaviorSubject<ParamMap>
    let myGroupsPage: WritableSignal<PageModel<GroupModel> | undefined>
    let groupsPage: WritableSignal<PageModel<GroupModel> | undefined>
    let participantsPage: WritableSignal<PageModel<ParticipantModel> | undefined>
    let groups: Record<string, unknown>
    let participants: Record<string, unknown>

    function create (tab?: string, mine: number = 1): void {
        queryParams.next( convertToParamMap( tab ? { tab } : {} ) )
        myGroupsPage.set( pageOf<GroupModel>( mine > 0 ? [ GROUP ] : [] ) )
        fixture = TestBed.createComponent( ParticipantsMonitoringPage )
        fixture.detectChanges()
    }

    function tabs (): string[] {
        return Array.from<{ panel: string }>( fixture.nativeElement.querySelectorAll( 'sgdf-tab' ) ).map( (tab: { panel: string }): string => tab.panel )
    }

    beforeEach( async () => {
        queryParams = new BehaviorSubject<ParamMap>( convertToParamMap( {} ) )
        myGroupsPage = signal<PageModel<GroupModel> | undefined>( undefined )
        groupsPage = signal<PageModel<GroupModel> | undefined>( undefined )
        participantsPage = signal<PageModel<ParticipantModel> | undefined>( undefined )
        groups = {
            myGroupsPage, groupsPage, myGroupsPageLoading: signal( false ), groupsPageLoading: signal( false ),
            myGroupsPageSilentLoading: signal( false ), groupsPageSilentLoading: signal( false ),
            myGroupsPageError: signal( undefined ), groupsPageError: signal( undefined ),
            fetchMyGroupsPage: vi.fn(), fetchGroupsPage: vi.fn(),
        }
        participants = {
            participantsPage, participantsPageLoading: signal( false ), participantsPageSilentLoading: signal( false ), participantsPageError: signal( undefined ),
            participantsPageQueryParam: signal( undefined ), participantsPageStatusParam: signal( undefined ),
            presencesStatusMetadata: signal( [] ), fetchParticipantsPage: vi.fn(), inputPageSearchParameters: vi.fn(),
        }
        await MockBuilder( ParticipantsMonitoringPage )
            .mock( TranslocoPipe, (key: string): string => key )
            .provide( { provide: GroupStatusFacade, useValue: groups } )
            .provide( { provide: ParticipantFacade, useValue: participants } )
            .provide( { provide: ActivatedRoute, useValue: { queryParamMap: queryParams.asObservable(), snapshot: { get queryParamMap (): ParamMap { return queryParams.value } } } } )
            .provide( { provide: Router, useValue: { navigate: vi.fn( () => Promise.resolve( true ) ) } } )
    } )

    it( 'asks for my groups when displayed to know whether the user has some', () => {
        // Arrange
        const expected: unknown[] = [ undefined, 20 ]

        // Act
        create()

        // Assert
        expect( (groups[ 'fetchMyGroupsPage' ] as MockInstance).mock.calls[ 0 ] ).toEqual( expected )
    } )

    it( 'shows a skeleton and no tab while my groups are not settled', () => {
        // Arrange
        queryParams.next( convertToParamMap( {} ) )

        // Act
        fixture = TestBed.createComponent( ParticipantsMonitoringPage )
        fixture.detectChanges()

        // Assert
        expect( fixture.nativeElement.querySelector( 'sgdf-skeleton' ) ).not.toBeNull()
        expect( tabs() ).toEqual( [] )
    } )

    it( 'offers my groups first when the user has some', () => {
        // Arrange
        const expected: string[] = [ 'mine', 'groups', 'individual' ]

        // Act
        create()

        // Assert
        expect( tabs() ).toEqual( expected )
    } )

    it( 'leaves out my groups when the user has none and opens the groups', () => {
        // Arrange
        const expected: string[] = [ 'groups', 'individual' ]

        // Act
        create( undefined, 0 )

        // Assert
        expect( tabs() ).toEqual( expected )
        expect( groups[ 'fetchGroupsPage' ] ).toHaveBeenCalledWith( undefined, 20 )
    } )

    it( 'loads the participants only when their tab is asked in the url', () => {
        // Arrange
        const expected: unknown[] = [ undefined, 20 ]

        // Act
        create( 'individual' )

        // Assert
        expect( (participants[ 'fetchParticipantsPage' ] as MockInstance).mock.calls[ 0 ] ).toEqual( expected )
        expect( groups[ 'fetchGroupsPage' ] ).not.toHaveBeenCalled()
    } )

    it( 'falls back to the first tab when the url asks for an unavailable one', () => {
        // Arrange
        const requested: string = 'mine'

        // Act
        create( requested, 0 )

        // Assert
        expect( groups[ 'fetchGroupsPage' ] ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'does not load a tab again once it holds a page', () => {
        // Arrange
        groupsPage.set( pageOf<GroupModel>( [ GROUP ] ) )

        // Act
        create( 'groups' )

        // Assert
        expect( groups[ 'fetchGroupsPage' ] ).not.toHaveBeenCalled()
    } )

    it( 'keeps the shown tab in the url', () => {
        // Arrange
        create()
        const event: CustomEvent<{ name: string }> = new CustomEvent<{ name: string }>( 'sgdf-tab-show', { detail: { name: 'individual' } } )

        // Act
        fixture.nativeElement.querySelector( 'sgdf-tab-group' ).dispatchEvent( event )

        // Assert
        expect( TestBed.inject( Router ).navigate ).toHaveBeenCalledWith( [], expect.objectContaining( { queryParams: { tab: 'individual' }, replaceUrl: true } ) )
    } )

    it( 'does not navigate when the shown tab is already the active one', () => {
        // Arrange
        create()
        const event: CustomEvent<{ name: string }> = new CustomEvent<{ name: string }>( 'sgdf-tab-show', { detail: { name: 'mine' } } )

        // Act
        fixture.nativeElement.querySelector( 'sgdf-tab-group' ).dispatchEvent( event )

        // Assert
        expect( TestBed.inject( Router ).navigate ).not.toHaveBeenCalled()
    } )

    it( 'shows the total of the tabs that are loaded as badges', () => {
        // Arrange
        groupsPage.set( { ...pageOf<GroupModel>( [ GROUP ] ), totalElements: 7 } )

        // Act
        create()
        const badges: string[] = Array.from<HTMLElement>( fixture.nativeElement.querySelectorAll( 'sgdf-badge' ) ).map( (badge: HTMLElement): string => badge.textContent.trim() )

        // Assert
        expect( badges ).toEqual( [ '1', '7' ] )
    } )

    it( 'searches the participants from the first batch with the filters of the form', () => {
        // Arrange
        create( 'individual' )
        fixture.componentInstance[ 'model' ].set( { q: 'cam', status: 'OUT', isVisible: '' } )

        // Act
        fixture.componentInstance[ 'search' ]()

        // Assert
        expect( participants[ 'inputPageSearchParameters' ] ).toHaveBeenCalledWith( 'cam', 'OUT', undefined )
        expect( participants[ 'fetchParticipantsPage' ] ).toHaveBeenLastCalledWith( 0, 20 )
    } )

    it( 'clears the filters of the form before searching again', () => {
        // Arrange
        create( 'individual' )
        fixture.componentInstance[ 'model' ].set( { q: 'cam', status: 'OUT', isVisible: '' } )

        // Act
        fixture.componentInstance[ 'resetFilters' ]()

        // Assert
        expect( participants[ 'inputPageSearchParameters' ] ).toHaveBeenLastCalledWith( undefined, undefined, undefined )
    } )

    it( 'forwards the batch requests of each tab to its facade', () => {
        // Arrange
        create()
        const request: { page: number, size: number } = { page: 1, size: 20 }

        // Act
        ngMocks.output( 'app-group-status-list', 'updateRequired' ).emit( request )

        // Assert
        expect( groups[ 'fetchMyGroupsPage' ] ).toHaveBeenLastCalledWith( 1, 20 )
    } )

    it( 'shows the tabs without my groups and the error with a retry when my groups failed to load', () => {
        // Arrange
        queryParams.next( convertToParamMap( {} ) )
        groups[ 'myGroupsPageError' ] = signal( { severity: 'error', detail: 'boom' } )
        TestBed.overrideProvider( GroupStatusFacade, { useValue: groups } )

        // Act
        fixture = TestBed.createComponent( ParticipantsMonitoringPage )
        fixture.detectChanges()

        // Assert
        expect( tabs() ).toEqual( [ 'groups', 'individual' ] )
        expect( fixture.nativeElement.querySelector( 'app-section-error' ) ).not.toBeNull()
    } )

    it( 'asks for my groups again when the error is retried', () => {
        // Arrange
        queryParams.next( convertToParamMap( {} ) )
        groups[ 'myGroupsPageError' ] = signal( { severity: 'error', detail: 'boom' } )
        TestBed.overrideProvider( GroupStatusFacade, { useValue: groups } )
        fixture = TestBed.createComponent( ParticipantsMonitoringPage )
        fixture.detectChanges()

        // Act
        ngMocks.output( 'app-section-error', 'retry' ).emit()

        // Assert
        expect( groups[ 'fetchMyGroupsPage' ] ).toHaveBeenCalledTimes( 2 )
    } )

    it( 'keeps the skeleton while my groups are loading again', () => {
        // Arrange
        groups[ 'myGroupsPageLoading' ] = signal( true )
        TestBed.overrideProvider( GroupStatusFacade, { useValue: groups } )

        // Act
        create()

        // Assert
        expect( tabs() ).toEqual( [] )
        expect( fixture.nativeElement.querySelector( 'sgdf-skeleton' ) ).not.toBeNull()
    } )

    it( 'opens the first available tab when the url asks for an unknown one', () => {
        // Arrange
        const requested: string = 'unknown'

        // Act
        create( requested )
        const active: string | null = fixture.nativeElement.querySelector( 'sgdf-tab-group' ).getAttribute( 'active' )

        // Assert
        expect( active ).toBe( 'mine' )
    } )

    it( 'forwards the batch requests of the groups tab and of the individual tab to their facades', () => {
        // Arrange
        create( 'groups' )
        ngMocks.output( 'app-group-status-list', 'updateRequired' ).emit( { page: 2, size: 20 } )
        fixture.componentInstance[ 'loadParticipants' ]( { page: 3, size: 20 } )

        // Act
        const groupsCall: unknown[] = (groups[ 'fetchGroupsPage' ] as MockInstance).mock.calls.at( -1 )!
        const participantsCall: unknown[] = (participants[ 'fetchParticipantsPage' ] as MockInstance).mock.calls.at( -1 )!

        // Assert
        expect( groupsCall ).toEqual( [ 2, 20 ] )
        expect( participantsCall ).toEqual( [ 3, 20 ] )
    } )

    it( 'ignores a tab shown without a name', () => {
        // Arrange
        create()
        const event: CustomEvent<object> = new CustomEvent<object>( 'sgdf-tab-show', { detail: {} } )

        // Act
        fixture.nativeElement.querySelector( 'sgdf-tab-group' ).dispatchEvent( event )

        // Assert
        expect( TestBed.inject( Router ).navigate ).not.toHaveBeenCalled()
    } )

    it( 'presets the status filter asked in the url before loading the participants', () => {
        // Arrange
        queryParams.next( convertToParamMap( { tab: 'individual', status: 'OVERDUE' } ) )
        myGroupsPage.set( pageOf<GroupModel>( [ GROUP ] ) )

        // Act
        fixture = TestBed.createComponent( ParticipantsMonitoringPage )
        fixture.detectChanges()

        // Assert
        expect( participants[ 'inputPageSearchParameters' ] ).toHaveBeenCalledWith( undefined, 'OVERDUE', undefined )
        expect( fixture.componentInstance[ 'model' ]().status ).toBe( 'OVERDUE' )
    } )

    it( 'leaves the filters alone when the url asks for no status', () => {
        // Arrange
        const expected: number = 0

        // Act
        create( 'individual' )

        // Assert
        expect( (participants[ 'inputPageSearchParameters' ] as MockInstance).mock.calls.length ).toBe( expected )
    } )
} )
