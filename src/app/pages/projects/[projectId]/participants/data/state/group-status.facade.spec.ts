import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { GroupStatusFacade } from '@pages/projects/[projectId]/participants/data/state/group-status.facade'
import { GroupStatusApi } from '@pages/projects/[projectId]/participants/data/state/group-status.api'
import { GroupStatusStore } from '@pages/projects/[projectId]/participants/data/state/group-status.store'
import { ERROR_500, failing, pageOf, provideTestConfig } from '@shared/helpers/testing/test-fixtures'
import { GroupModel } from '@shared/models/model/group.model'
import { PageModel } from '@shared/models/model/page.model'
import { ParticipantModel } from '@shared/models/model/participant.model'

const GROUP: GroupModel = { id: 'g1', name: 'Wolves', visible: true, creation: undefined, lastEdition: undefined, status: undefined, startAvailability: undefined, endAvailability: undefined, membersCount: 1, insideMembersCount: 1, outsideMembersCount: 0, members: [] }

const MEMBER: ParticipantModel = { id: 'pa1' } as ParticipantModel

describe( 'GroupStatusFacade', () => {
    let facade: GroupStatusFacade
    let findGroups: Mock<GroupStatusApi['findGroups']>
    let findMyGroups: Mock<GroupStatusApi['findMyGroups']>
    let findOnSiteMembers: Mock<GroupStatusApi['findOnSiteMembers']>

    beforeEach( () => {
        provideTestConfig()
        findGroups = vi.fn( () => of( pageOf<GroupModel>( [ GROUP ] ) ) )
        findMyGroups = vi.fn( () => of( pageOf<GroupModel>( [ GROUP ] ) ) )
        findOnSiteMembers = vi.fn( () => of( pageOf<ParticipantModel>( [ MEMBER ] ) ) )
        TestBed.configureTestingModule( {
            providers: [
                GroupStatusFacade,
                GroupStatusStore,
                { provide: GroupStatusApi, useValue: { findGroups, findMyGroups, findOnSiteMembers } },
                { provide: ErrorReporter, useValue: { notify: vi.fn() } },
                { provide: SessionFacade, useValue: { currentProjectId: signal( 'p1' ) } },
                { provide: UiFacade, useValue: { notify: vi.fn() } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key, langChanges$: new Subject<string>().asObservable() } },
            ],
        } )
        facade = TestBed.inject( GroupStatusFacade )
    } )

    it( 'loads the groups of the selected project', () => {
        // Arrange
        const size: number = 20

        // Act
        facade.fetchGroupsPage( undefined, size )

        // Assert
        expect( findGroups ).toHaveBeenCalledWith( 'p1', undefined, size )
        expect( facade.groupsPage()?.content ).toEqual( [ GROUP ] )
    } )

    it( 'loads my groups apart from all the groups', () => {
        // Arrange
        const size: number = 20

        // Act
        facade.fetchMyGroupsPage( undefined, size )

        // Assert
        expect( findMyGroups ).toHaveBeenCalledWith( 'p1', undefined, size )
        expect( facade.myGroupsPage()?.content ).toEqual( [ GROUP ] )
        expect( facade.groupsPage() ).toBeUndefined()
    } )

    it( 'appends the next batch to the groups already shown', () => {
        // Arrange
        facade.fetchGroupsPage( undefined, 1 )
        findGroups.mockReturnValue( of( { ...pageOf<GroupModel>( [ { ...GROUP, id: 'g2' } ] ), page: 1 } ) )

        // Act
        facade.fetchGroupsPage( 1, 1 )

        // Assert
        expect( facade.groupsPage()?.content.map( (group: GroupModel): string => group.id ) ).toEqual( [ 'g1', 'g2' ] )
    } )

    it( 'flags the groups as loading while their first batch is in flight', () => {
        // Arrange
        findGroups.mockReturnValue( new Subject<PageModel<GroupModel>>() )

        // Act
        facade.fetchGroupsPage( undefined, 20 )

        // Assert
        expect( facade.groupsPageLoading() ).toBe( true )
        expect( facade.myGroupsPageLoading() ).toBe( false )
    } )

    it( 'keeps the failure of my groups in their own block', () => {
        // Arrange
        findMyGroups.mockReturnValue( failing( ERROR_500 ) )

        // Act
        facade.fetchMyGroupsPage( undefined, 20 )

        // Assert
        expect( facade.myGroupsPageError() ).toBeDefined()
        expect( facade.groupsPageError() ).toBeUndefined()
        expect( facade.myGroupsPageLoading() ).toBe( false )
    } )

    it( 'loads the on-site members of one group apart from the others', () => {
        // Arrange
        const size: number = 20

        // Act
        facade.fetchGroupMembersPage( 'g1', undefined, size )

        // Assert
        expect( findOnSiteMembers ).toHaveBeenCalledWith( 'p1', 'g1', undefined, size )
        expect( facade.membersByGroup()[ 'g1' ]?.element?.content ).toEqual( [ MEMBER ] )
        expect( facade.membersByGroup()[ 'g2' ] ).toBeUndefined()
    } )

    it( 'appends the next members to the ones already shown', () => {
        // Arrange
        facade.fetchGroupMembersPage( 'g1', undefined, 1 )
        findOnSiteMembers.mockReturnValue( of( { ...pageOf<ParticipantModel>( [ { id: 'pa2' } as ParticipantModel ] ), page: 1 } ) )

        // Act
        facade.fetchGroupMembersPage( 'g1', 1, 1 )

        // Assert
        expect( facade.membersByGroup()[ 'g1' ]?.element?.content.map( (member: ParticipantModel): string => member.id ) ).toEqual( [ 'pa1', 'pa2' ] )
    } )

    it( 'flags only the group whose members are loading', () => {
        // Arrange
        findOnSiteMembers.mockReturnValue( new Subject<PageModel<ParticipantModel>>() )

        // Act
        facade.fetchGroupMembersPage( 'g1', undefined, 20 )

        // Assert
        expect( facade.membersByGroup()[ 'g1' ]?.loading ).toBe( true )
        expect( facade.membersByGroup()[ 'g2' ]?.loading ).toBeUndefined()
    } )

    it( 'keeps the failure of the members of a group in its own block', () => {
        // Arrange
        facade.fetchGroupMembersPage( 'g2', undefined, 20 )
        findOnSiteMembers.mockReturnValue( failing( ERROR_500 ) )

        // Act
        facade.fetchGroupMembersPage( 'g1', undefined, 20 )

        // Assert
        expect( facade.membersByGroup()[ 'g1' ]?.error ).toBeDefined()
        expect( facade.membersByGroup()[ 'g1' ]?.loading ).toBe( false )
        expect( facade.membersByGroup()[ 'g2' ]?.error ).toBeUndefined()
    } )

    it( 'keeps loading the members of two groups at the same time', () => {
        // Arrange
        findOnSiteMembers.mockReturnValue( new Subject<PageModel<ParticipantModel>>() )

        // Act
        facade.fetchGroupMembersPage( 'g1', undefined, 20 )
        facade.fetchGroupMembersPage( 'g2', undefined, 20 )

        // Assert
        expect( facade.membersByGroup()[ 'g1' ]?.loading ).toBe( true )
        expect( facade.membersByGroup()[ 'g2' ]?.loading ).toBe( true )
    } )
} )
