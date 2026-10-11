import { Type } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { UserProfileFacade } from '@core/registry/state/user-profile.facade'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfilesListPage } from '@pages/projects/[projectId]/configuration/profiles/project-profiles-list/project-profiles-list.page'
import { InvitationsListPage } from '@pages/users/invitations/invitations-list/invitations-list.page'
import { ProfilesListPage } from '@pages/users/profiles/profiles-list/profiles-list.page'
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import { ActivitiesListPage } from '@pages/projects/[projectId]/configuration/activities/activities-list/activities-list.page'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { GroupMemberListPage } from '@pages/projects/[projectId]/configuration/groups/group-member-list/group-member-list.page'
import { GroupsListPage } from '@pages/projects/[projectId]/configuration/groups/groups-list/groups-list.page'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { ParticipantsListPage } from '@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.page'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { VehiclesListPage } from '@pages/projects/[projectId]/configuration/vehicles/vehicles-list/vehicles-list.page'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { AlertsListPage } from '@pages/projects/[projectId]/alerts/alerts-list/alerts-list.page'
import { ActivityMovementsListPage } from '@pages/projects/[projectId]/configuration/activities/activity-movements-list/activity-movements-list.page'
import { ParticipantMovementsListPage } from '@pages/projects/[projectId]/configuration/participants/participant-movements-list/participant-movements-list.page'
import { VehicleMovementsListPage } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-movements-list/vehicle-movements-list.page'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { MovementsListPage } from '@pages/projects/[projectId]/movements/movements-list/movements-list.page'
import { UserFacade } from '@pages/users/data/state/user.facade'
import { UserActions } from '@pages/users/users-list/user-actions.service'
import { UsersListPage } from '@pages/users/users-list/users-list.page'
import { autoMock } from '@shared/helpers/testing/auto-mock'

interface BatchListApi {
    search: () => void
    resetFilters: () => void
    loadBatch: (event: { pageNumber: number, pageSize: number }) => void
    model: { (): Record<string, unknown>, set: (value: Record<string, unknown>) => void }
}

interface BatchListCase {
    name: string
    type: Type<unknown>
    facades: Type<unknown>[]
    owner: Type<unknown>
    services: Type<unknown>[]
    fetch: string
    withId: boolean
}

const CASES: BatchListCase[] = [
    { name: 'activities', type: ActivitiesListPage, facades: [ ActivityFacade ], owner: ActivityFacade, services: [], fetch: 'fetchActivitiesPage', withId: false },
    { name: 'groups', type: GroupsListPage, facades: [ GroupFacade ], owner: GroupFacade, services: [], fetch: 'fetchGroupsPage', withId: false },
    { name: 'group members', type: GroupMemberListPage, facades: [ GroupFacade, ParticipantFacade ], owner: GroupFacade, services: [], fetch: 'fetchGroupMembersPage', withId: true },
    { name: 'participants', type: ParticipantsListPage, facades: [ ParticipantFacade ], owner: ParticipantFacade, services: [], fetch: 'fetchParticipantsPage', withId: false },
    { name: 'vehicles', type: VehiclesListPage, facades: [ VehicleFacade ], owner: VehicleFacade, services: [], fetch: 'fetchVehiclesPage', withId: false },
    { name: 'users', type: UsersListPage, facades: [ UserFacade ], owner: UserFacade, services: [ UserActions ], fetch: 'fetchUsersPage', withId: false },
    { name: 'invitations', type: InvitationsListPage, facades: [], owner: UserProfileFacade, services: [], fetch: 'fetchProjectProfileInvitationPage', withId: false },
    { name: 'profiles', type: ProfilesListPage, facades: [ ProjectProfileFacade ], owner: UserProfileFacade, services: [], fetch: 'fetchProjectProfilesPage', withId: false },
    { name: 'project profiles', type: ProjectProfilesListPage, facades: [ ProjectProfileFacade ], owner: ProjectProfileFacade, services: [], fetch: 'fetchProjectProfilesPage', withId: false },
    { name: 'alerts', type: AlertsListPage, facades: [ AlertFacade ], owner: AlertFacade, services: [], fetch: 'fetchAlertsPage', withId: false },
    { name: 'activity movements', type: ActivityMovementsListPage, facades: [ ActivityFacade, MovementFacade ], owner: ActivityFacade, services: [], fetch: 'fetchActivityMovementsPage', withId: true },
    { name: 'participant movements', type: ParticipantMovementsListPage, facades: [ ParticipantFacade, MovementFacade ], owner: ParticipantFacade, services: [], fetch: 'fetchParticipantMovementsPage', withId: true },
    { name: 'vehicle movements', type: VehicleMovementsListPage, facades: [ VehicleFacade, MovementFacade ], owner: VehicleFacade, services: [], fetch: 'fetchVehicleMovementsPage', withId: true },
    { name: 'movements', type: MovementsListPage, facades: [ MovementFacade ], owner: MovementFacade, services: [], fetch: 'fetchMovementsPage', withId: false },
]

function withUnsetSearchParams (facade: Record<string, Mock>): Record<string, Mock> {
    return new Proxy( facade, {
        get: (target: Record<string, Mock>, key: string | symbol): Mock | undefined =>
            typeof key === 'string' && /Search(ed)?Param$/.test( key ) ? vi.fn( (): undefined => undefined ) : target[ key as string ],
    } )
}

describe( 'batch list pages', () => {
    let mocks: Map<Type<unknown>, Record<string, Mock>>

    function create (item: BatchListCase): BatchListApi {
        mocks = new Map<Type<unknown>, Record<string, Mock>>()
        const types: Type<unknown>[] = [ ...new Set( [ ...item.facades, item.owner, SessionFacade, UiFacade ] ) ]
        types.forEach( (facade: Type<unknown>): void => { mocks.set( facade, withUnsetSearchParams( autoMock() ) ) } )
        TestBed.configureTestingModule( {
            providers: [
                ...types.map( (facade: Type<unknown>) => ({ provide: facade, useValue: mocks.get( facade ) }) ),
                ...item.services.map( (service: Type<unknown>) => ({ provide: service, useValue: {} }) ),
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
                { provide: Router, useValue: { navigateByUrl: vi.fn( () => Promise.resolve( true ) ) } },
                { provide: ActivatedRoute, useValue: { snapshot: { params: new Proxy( {}, { get: (): string => 'id1' } ) } } },
            ],
        } )
        TestBed.overrideComponent( item.type, { set: { template: '', imports: [], providers: [] } } )
        return TestBed.createComponent( item.type ).componentInstance as unknown as BatchListApi
    }

    function fetched (item: BatchListCase): Mock {
        return mocks.get( item.owner )![ item.fetch ]
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    it.each( CASES )( 'loads the first $name batch when it opens', (item: BatchListCase) => {
        // Arrange
        const expectedArguments: unknown[] = item.withId ? [ 'id1', undefined, undefined ] : [ undefined, undefined ]

        // Act
        create( item )

        // Assert
        expect( fetched( item ) ).toHaveBeenCalledWith( ...expectedArguments )
    } )

    it.each( CASES )( 'asks for the requested $name batch without touching the search parameters', (item: BatchListCase) => {
        // Arrange
        const page: BatchListApi = create( item )
        fetched( item ).mockClear()

        // Act
        page.loadBatch( { pageNumber: 3, pageSize: 5 } )

        // Assert
        expect( fetched( item ).mock.calls[ 0 ].slice( -2 ) ).toEqual( [ 3, 5 ] )
    } )

    it.each( CASES )( 'sends no search parameter for the $name page while the user filled nothing, then restarts from the first batch', (item: BatchListCase) => {
        // Arrange
        const page: BatchListApi = create( item )
        fetched( item ).mockClear()

        // Act
        page.search()

        // Assert
        const inputs: Mock[] = [ ...mocks.values() ].flatMap( (mock: Record<string, Mock>): Mock[] =>
            Object.entries( mock ).filter( ([ name ]: [ string, Mock ]): boolean => /^input\w*SearchParameters$/.test( name ) ).map( ([ , fn ]: [ string, Mock ]): Mock => fn ) )
        const sent: unknown[] = inputs.flatMap( (fn: Mock): unknown[] => fn.mock.calls.flat() )
        expect( sent.every( (value: unknown): boolean => value === undefined || value === false ) ).toBe( true )
        expect( inputs.some( (fn: Mock): boolean => fn.mock.calls.length > 0 ) ).toBe( true )
        expect( fetched( item ).mock.calls[ 0 ].slice( -2 ) ).toEqual( [ 0, undefined ] )
    } )

    it.each( CASES )( 'clears the $name filters when they are reset, then searches again', (item: BatchListCase) => {
        // Arrange
        const page: BatchListApi = create( item )
        const filled: Record<string, unknown> = Object.fromEntries( Object.keys( page.model() ).map( (key: string): [ string, unknown ] => [ key, typeof page.model()[ key ] === 'string' ? 'x' : page.model()[ key ] ] ) )
        page.model.set( filled )
        fetched( item ).mockClear()

        // Act
        page.resetFilters()

        // Assert
        const texts: unknown[] = Object.values( page.model() ).filter( (value: unknown): boolean => typeof value === 'string' )
        expect( texts.every( (value: unknown): boolean => value === '' ) ).toBe( true )
        expect( fetched( item ) ).toHaveBeenCalledTimes( 1 )
    } )
} )
