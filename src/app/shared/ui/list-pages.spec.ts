import { Type } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { ProjectsListPage } from '@pages/projects/projects-list/projects-list.page'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { AlertsListPage } from '@pages/projects/[projectId]/alerts/alerts-list/alerts-list.page'
import { ActivitiesListPage } from '@pages/projects/[projectId]/configuration/activities/activities-list/activities-list.page'
import { ActivityMovementsListPage } from '@pages/projects/[projectId]/configuration/activities/activity-movements-list/activity-movements-list.page'
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { GroupMemberListPage } from '@pages/projects/[projectId]/configuration/groups/group-member-list/group-member-list.page'
import { GroupsListPage } from '@pages/projects/[projectId]/configuration/groups/groups-list/groups-list.page'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { ParticipantMovementsListPage } from '@pages/projects/[projectId]/configuration/participants/participant-movements-list/participant-movements-list.page'
import { ParticipantsListPage } from '@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.page'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfilesListPage } from '@pages/projects/[projectId]/configuration/profiles/project-profiles-list/project-profiles-list.page'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { VehicleMovementsListPage } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-movements-list/vehicle-movements-list.page'
import { VehiclesListPage } from '@pages/projects/[projectId]/configuration/vehicles/vehicles-list/vehicles-list.page'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { MovementsListPage } from '@pages/projects/[projectId]/movements/movements-list/movements-list.page'
import { UserFacade } from '@pages/users/data/state/user.facade'
import { InvitationsListPage } from '@pages/users/invitations/invitations-list/invitations-list.page'
import { ProfilesListPage } from '@pages/users/profiles/profiles-list/profiles-list.page'
import { UsersListPage } from '@pages/users/users-list/users-list.page'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { GenericListComponent } from '@shared/ui/base/generic-list.component'

interface ListCase {
    name: string
    type: Type<GenericListComponent>
    facades: Type<unknown>[]
    owner: Type<unknown>
    fetch: string
    withId: boolean
}

const CASES: ListCase[] = [
    { name: 'alerts', type: AlertsListPage, facades: [ AlertFacade ], owner: AlertFacade, fetch: 'fetchAlertsPage', withId: false },
    { name: 'activities', type: ActivitiesListPage, facades: [ ActivityFacade ], owner: ActivityFacade, fetch: 'fetchActivitiesPage', withId: false },
    { name: 'activity movements', type: ActivityMovementsListPage, facades: [ ActivityFacade, MovementFacade ], owner: ActivityFacade, fetch: 'fetchActivityMovementsPage', withId: true },
    { name: 'group members', type: GroupMemberListPage, facades: [ GroupFacade, ParticipantFacade ], owner: GroupFacade, fetch: 'fetchGroupMembersPage', withId: true },
    { name: 'groups', type: GroupsListPage, facades: [ GroupFacade ], owner: GroupFacade, fetch: 'fetchGroupsPage', withId: false },
    { name: 'participant movements', type: ParticipantMovementsListPage, facades: [ ParticipantFacade, MovementFacade ], owner: ParticipantFacade, fetch: 'fetchParticipantMovementsPage', withId: true },
    { name: 'participants', type: ParticipantsListPage, facades: [ ParticipantFacade ], owner: ParticipantFacade, fetch: 'fetchParticipantsPage', withId: false },
    { name: 'project profiles', type: ProjectProfilesListPage, facades: [ ProjectProfileFacade ], owner: ProjectProfileFacade, fetch: 'fetchProjectProfilesPage', withId: false },
    { name: 'vehicle movements', type: VehicleMovementsListPage, facades: [ VehicleFacade, MovementFacade ], owner: VehicleFacade, fetch: 'fetchVehicleMovementsPage', withId: true },
    { name: 'vehicles', type: VehiclesListPage, facades: [ VehicleFacade ], owner: VehicleFacade, fetch: 'fetchVehiclesPage', withId: false },
    { name: 'movements', type: MovementsListPage, facades: [ MovementFacade ], owner: MovementFacade, fetch: 'fetchMovementsPage', withId: false },
    { name: 'projects', type: ProjectsListPage, facades: [ ProjectFacade ], owner: ProjectFacade, fetch: 'fetchProjectsPage', withId: false },
    { name: 'users', type: UsersListPage, facades: [ UserFacade ], owner: UserFacade, fetch: 'fetchUsersPage', withId: false },
    { name: 'invitations', type: InvitationsListPage, facades: [], owner: SessionFacade, fetch: 'fetchProjectProfileInvitationPage', withId: false },
    { name: 'profiles', type: ProfilesListPage, facades: [ ProjectProfileFacade ], owner: SessionFacade, fetch: 'fetchProjectProfilesPage', withId: false },
]

describe( 'list pages', () => {
    let mocks: Map<Type<unknown>, Record<string, Mock>>

    function create (item: ListCase): GenericListComponent {
        mocks = new Map<Type<unknown>, Record<string, Mock>>()
        const types: Type<unknown>[] = [ ...new Set( [ ...item.facades, item.owner, SessionFacade, UiFacade, RegistryFacade ] ) ]
        types.forEach( (facade: Type<unknown>): void => { mocks.set( facade, autoMock() ) } )
        TestBed.configureTestingModule( {
            providers: [
                ...types.map( (facade: Type<unknown>) => ({ provide: facade, useValue: mocks.get( facade ) }) ),
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
                { provide: Router, useValue: { navigateByUrl: vi.fn( () => Promise.resolve( true ) ) } },
                { provide: ActivatedRoute, useValue: { snapshot: { params: new Proxy( {}, { get: (): string => 'id1' } ) } } },
            ],
        } )
        TestBed.overrideComponent( item.type, { set: { template: '', imports: [], providers: [] } } )
        return TestBed.createComponent( item.type ).componentInstance
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    it.each( CASES )( 'loads the first $name page when it opens', (item: ListCase) => {
        // Arrange
        const expectedArguments: unknown[] = item.withId ? [ 'id1', undefined, undefined ] : [ undefined, undefined ]

        // Act
        create( item )

        // Assert
        expect( mocks.get( item.owner )![ item.fetch ] ).toHaveBeenCalledWith( ...expectedArguments )
    } )

    it.each( CASES )( 'reloads the requested $name page with the chosen position and size', (item: ListCase) => {
        // Arrange
        const page: GenericListComponent = create( item )
        mocks.get( item.owner )![ item.fetch ].mockClear()

        // Act
        ;(page as unknown as { loadPage: (event: { pageNumber: number, pageSize: number }) => void }).loadPage( { pageNumber: 3, pageSize: 5 } )

        // Assert
        const call: unknown[] = mocks.get( item.owner )![ item.fetch ].mock.calls[ 0 ]
        expect( call.slice( -2 ) ).toEqual( [ 3, 5 ] )
    } )

    it.each( CASES )( 'keeps the search form of the $name page for the user to fill', (item: ListCase) => {
        // Arrange
        const page: GenericListComponent = create( item )

        // Act
        const controls: string[] = Object.keys( (page as unknown as { form: { controls: object } }).form.controls )

        // Assert
        expect( controls.length ).toBeGreaterThan( 0 )
    } )
} )
