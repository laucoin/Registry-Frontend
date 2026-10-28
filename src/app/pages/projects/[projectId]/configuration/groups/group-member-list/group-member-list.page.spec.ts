import { TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { NEVER, of } from 'rxjs'
import { Mock, beforeEach, describe, expect, it } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { GroupMemberListPage } from '@pages/projects/[projectId]/configuration/groups/group-member-list/group-member-list.page'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { autoMock } from '@shared/helpers/testing/auto-mock'

interface MemberListApi {
    addMembersFormLayerOpened: { (): boolean, set: (value: boolean) => void }
    createMemberFormLayerOpened: { (): boolean, set: (value: boolean) => void }
    addMembersModel: { (): { participants: object[] }, set: (value: { participants: object[] }) => void }
    closeLayer: (event: Event, opened: { (): boolean, set: (value: boolean) => void }) => void
    initAddMembersForm: () => void
    initCreateMemberForm: () => void
    addMembers: () => void
}

describe( 'GroupMemberListPage', () => {
    let facade: Record<string, Mock>

    function create (): MemberListApi {
        facade = autoMock()
        facade[ 'fetchGroup' ].mockReturnValue( of( { id: 'g1', name: 'Hikers' } ) )
        facade[ 'handleGroupMembersChange' ].mockReturnValue( NEVER )
        facade[ 'addMembersToGroup' ].mockReturnValue( of( {} ) )
        const participantFacade: Record<string, Mock> = autoMock()
        participantFacade[ 'handleParticipantFirstPageReload' ].mockReturnValue( NEVER )
        participantFacade[ 'handleParticipantCurrentPageReload' ].mockReturnValue( NEVER )
        TestBed.configureTestingModule( {
            providers: [
                { provide: GroupFacade, useValue: facade },
                { provide: ParticipantFacade, useValue: participantFacade },
                { provide: ActivatedRoute, useValue: { snapshot: { params: { groupId: 'g1' } } } },
                { provide: SessionFacade, useValue: { currentUser: (): undefined => undefined, selectedProject: (): undefined => undefined, currentProjectId: (): undefined => undefined } },
                { provide: UiFacade, useValue: autoMock() },
            ],
        } )
        TestBed.overrideComponent( GroupMemberListPage, { set: { template: '', imports: [], providers: [] } } )
        return TestBed.createComponent( GroupMemberListPage ).componentInstance as unknown as MemberListApi
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    it( 'opens the panel to add members with an empty selection', () => {
        // Arrange
        const page: MemberListApi = create()
        page.addMembersModel.set( { participants: [ { id: 'p1' } ] } )

        // Act
        page.initAddMembersForm()

        // Assert
        expect( page.addMembersFormLayerOpened() ).toBe( true )
        expect( page.addMembersModel().participants ).toEqual( [] )
    } )

    it( 'opens the panel to create a member', () => {
        // Arrange
        const page: MemberListApi = create()

        // Act
        page.initCreateMemberForm()

        // Assert
        expect( page.createMemberFormLayerOpened() ).toBe( true )
    } )

    it( 'closes a panel hidden by itself but not one hidden by an element nested in it', () => {
        // Arrange
        const page: MemberListApi = create()
        page.addMembersFormLayerOpened.set( true )
        const host: object = {}
        const own: Event = { target: host, currentTarget: host } as unknown as Event
        const nested: Event = { target: {}, currentTarget: host } as unknown as Event

        // Act
        page.closeLayer( nested, page.addMembersFormLayerOpened )
        const afterNested: boolean = page.addMembersFormLayerOpened()
        page.closeLayer( own, page.addMembersFormLayerOpened )

        // Assert
        expect( afterNested ).toBe( true )
        expect( page.addMembersFormLayerOpened() ).toBe( false )
    } )

    it( 'does not add an empty selection', () => {
        // Arrange
        const page: MemberListApi = create()
        page.initAddMembersForm()

        // Act
        page.addMembers()

        // Assert
        expect( facade[ 'addMembersToGroup' ] ).not.toHaveBeenCalled()
        expect( page.addMembersFormLayerOpened() ).toBe( true )
    } )

    it( 'adds the selected members to the group then closes the panel', () => {
        // Arrange
        const page: MemberListApi = create()
        page.initAddMembersForm()
        page.addMembersModel.set( { participants: [ { id: 'p1' } ] } )

        // Act
        page.addMembers()

        // Assert
        expect( facade[ 'addMembersToGroup' ] ).toHaveBeenCalledWith( 'g1', [ 'p1' ] )
        expect( page.addMembersFormLayerOpened() ).toBe( false )
    } )
} )
