import { ERROR_500, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'
import { ConfigModel } from '@core/config/model/config.model'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { GroupApi } from '@pages/projects/[projectId]/configuration/groups/data/state/group.api'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { GroupStore } from '@pages/projects/[projectId]/configuration/groups/data/state/group.store'
import { CommandEventService } from '@shared/helpers/facade/command-event.service'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { AddedGroupMembersDto } from '@shared/models/dto/added-group-members.dto'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { GroupModel } from '@shared/models/model/group.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { PageModel } from '@shared/models/model/page.model'

const EMPTY_PAGE: PageModel<GroupModel> = { page: 2, size: 10, totalElements: 0, totalPages: 1, hasNext: false, content: [], lastRefresh: new Date() }

describe( 'GroupFacade', () => {
    let facade: GroupFacade
    let findGroups: Mock<GroupApi['findGroups']>
    let createGroup: Mock<GroupApi['createGroup']>
    let addMembersToGroupById: Mock<GroupApi['addMembersToGroupById']>
    let removeMemberFromGroupById: Mock<GroupApi['removeMemberFromGroupById']>
    let notify: Mock<(message: unknown) => void>
    let commandEvents: CommandEventService
    let api: Record<string, Mock>

    beforeEach( () => {
        RegistryConfig.config = { notification: { duration: { info: 1, success: 1, warn: 1, error: 1, secondary: 1, contrast: 1 } } } as ConfigModel
        findGroups = vi.fn( () => of( EMPTY_PAGE ) )
        createGroup = vi.fn()
        addMembersToGroupById = vi.fn()
        removeMemberFromGroupById = vi.fn( () => of( undefined ) )
        notify = vi.fn()
        api = { findGroupById: vi.fn(), updateGroupById: vi.fn(), disableGroupById: vi.fn(), enableGroupById: vi.fn(), deleteGroupById: vi.fn(), searchParticipants: vi.fn( () => of( [] ) ) }
        TestBed.configureTestingModule( {
            providers: [
                GroupFacade,
                GroupStore,
                { provide: GroupApi, useValue: { findGroups, createGroup, addMembersToGroupById, removeMemberFromGroupById, findGroupMembersByGroupId: vi.fn( () => of( EMPTY_PAGE ) ), ...api } },
                { provide: SessionFacade, useValue: { currentProjectId: signal( 'p1' ) } },
                { provide: UiFacade, useValue: { notify } },
                { provide: PluralTranslationPipe, useValue: { transform: (key: string, count: number): string => `${key}:${count}` } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}` } },
            ],
        } )
        facade = TestBed.inject( GroupFacade )
        commandEvents = TestBed.inject( CommandEventService )
    } )

    it( 'fetches the requested groups page for the selected project', () => {
        // Arrange
        const page: number = 3

        // Act
        facade.fetchGroupsPage( page, 10 )

        // Assert
        expect( findGroups ).toHaveBeenCalledWith( 'p1', 3, 10, expect.anything() )
    } )

    it( 'restarts from the first page when the search has just changed', () => {
        // Arrange
        facade.inputPageSearchParameters( 'scouts', undefined, undefined, undefined )

        // Act
        facade.fetchGroupsPage( 4, 10 )

        // Assert
        expect( findGroups ).toHaveBeenCalledWith( 'p1', 0, 10, expect.anything() )
    } )

    it( 'keeps the shown page when the same date is searched again', () => {
        // Arrange
        const at: Date = new Date( '2026-10-13T10:00:00.000Z' )
        facade.inputPageSearchParameters( undefined, at, undefined, undefined )
        facade.fetchGroupsPage( 0, 10 )

        // Act
        facade.inputPageSearchParameters( undefined, new Date( at ), undefined, undefined )
        facade.fetchGroupsPage( 3, 10 )

        // Assert
        expect( findGroups ).toHaveBeenLastCalledWith( 'p1', 3, 10, expect.anything() )
    } )

    it( 'does not touch the search parameters when nothing changed', () => {
        // Arrange
        facade.inputPageSearchParameters( 'scouts', undefined, undefined, undefined )
        facade.fetchGroupsPage( 0, 10 )

        // Act
        facade.inputPageSearchParameters( 'scouts', undefined, undefined, undefined )

        // Assert
        expect( facade.groupsPageQueryParam() ).toBe( 'scouts' )
        expect( facade.groupsPageResetSearch() ).toBe( false )
    } )

    it( 'translates the metadata labels except the empty option', () => {
        // Arrange
        const expected: (string | undefined)[] = [ '-', 't:groups.visible.true', 't:groups.visible.false' ]

        // Act
        const labels: (string | undefined)[] = facade.visibilitiesMetadata().map( (item: { label?: string }): string | undefined => item.label )

        // Assert
        expect( labels ).toEqual( expected )
    } )

    it( 'notifies, announces the command and refreshes the page after a creation', () => {
        // Arrange
        createGroup.mockReturnValue( of( { id: 'g1', name: 'Wolves' } as GroupModel ) )
        const emitted: string[] = []
        commandEvents.on( 'group', 'create' ).subscribe( (): number => emitted.push( 'create' ) )
        facade.fetchGroupsPage( 2, 10 )
        findGroups.mockClear()

        // Act
        facade.createGroup( { name: 'Wolves' } as never ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledTimes( 1 )
        expect( emitted ).toEqual( [ 'create' ] )
        expect( findGroups ).toHaveBeenCalledWith( 'p1', 0, 30, expect.anything() )
    } )

    it( 'warns when only some of the members were added', () => {
        // Arrange
        addMembersToGroupById.mockReturnValue( of( { members: [ { id: 'm1' } ] } as unknown as AddedGroupMembersDto ) )

        // Act
        facade.addMembersToGroup( 'g1', [ 'm1', 'm2' ] ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { severity: SeverityEnum.WARNING } ) )
    } )

    it( 'reports a full success when every member was added', () => {
        // Arrange
        addMembersToGroupById.mockReturnValue( of( { members: [ { id: 'm1' } ] } as unknown as AddedGroupMembersDto ) )

        // Act
        facade.addMembersToGroup( 'g1', [ 'm1' ] ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { severity: SeverityEnum.SUCCESS } ) )
    } )

    it( 'names the group shown on the participant in the removal notification', () => {
        // Arrange
        const participant: ParticipantModel = { id: 'm1', firstName: 'Ada', lastName: 'Lovelace', groups: [ { id: 'g1', name: 'Scouts' } as GroupModel ] } as ParticipantModel

        // Act
        facade.removeMemberFromGroup( 'g1', participant ).subscribe()

        // Assert
        expect( removeMemberFromGroupById ).toHaveBeenCalledWith( 'p1', 'g1', 'm1' )
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { severity: SeverityEnum.SUCCESS } ) )
    } )

    it( 'reloads every shown batch of the members of a group in one request', () => {
        // Arrange
        const finder: Mock = vi.fn( () => of( pageOf<never>( [], 1 ) ) )
        ;(TestBed.inject( GroupApi ) as unknown as Record<string, Mock>)[ 'findGroupMembersByGroupId' ] = finder
        facade.fetchGroupMembersPage( 'e1', 1, 10 )
        finder.mockClear()

        // Act
        facade.reloadGroupMembersPage( 'e1' )

        // Assert
        expect( finder ).toHaveBeenCalledWith( 'p1', 'e1', 0, expect.any( Number ), expect.anything() )
    } )

    it( 'fetches a group of the selected project', () => {
        // Arrange
        api[ 'findGroupById' ].mockReturnValue( of( { id: 'g1' } as GroupModel ) )
        let received: GroupModel | undefined

        // Act
        facade.fetchGroup( 'g1' ).subscribe( (it: GroupModel): void => { received = it } )

        // Assert
        expect( api[ 'findGroupById' ] ).toHaveBeenCalledWith( 'p1', 'g1' )
        expect( received?.id ).toBe( 'g1' )
    } )

    it( 'notifies a failed group fetch', () => {
        // Arrange
        api[ 'findGroupById' ].mockReturnValue( failing( ERROR_500 ) )

        // Act
        facade.fetchGroup( 'g1' ).subscribe( { error: (): void => undefined } )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
    } )

    it( 'sends the version of the group on update and notifies the edition', () => {
        // Arrange
        api[ 'updateGroupById' ].mockReturnValue( of( { id: 'g1', name: 'Wolves' } as GroupModel ) )

        // Act
        facade.updateGroup( 'g1', {} as never, 'etag-1' ).subscribe()

        // Assert
        expect( api[ 'updateGroupById' ] ).toHaveBeenCalledWith( 'p1', 'g1', {}, 'etag-1' )
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'groups.notifications.edit.title' } ) )
    } )

    it.each( [ 'disable', 'enable' ] as const )( 'notifies and refreshes the page after the group is %sd', (command: 'disable' | 'enable') => {
        // Arrange
        api[ `${ command }GroupById` ].mockReturnValue( of( { id: 'g1', name: 'Wolves' } as GroupModel ) )
        findGroups.mockClear()

        // Act
        ;( command === 'disable' ? facade.disableGroup( 'g1' ) : facade.enableGroup( 'g1' ) ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: `groups.notifications.${ command }.title` } ) )
        expect( findGroups ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'notifies and refreshes the page after the group is deleted', () => {
        // Arrange
        api[ 'deleteGroupById' ].mockReturnValue( of( undefined ) )
        findGroups.mockClear()

        // Act
        facade.deleteGroup( { id: 'g1', name: 'Wolves' } as GroupModel ).subscribe()

        // Assert
        expect( api[ 'deleteGroupById' ] ).toHaveBeenCalledWith( undefined, 'g1' )
        expect( findGroups ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'does not refresh the page when a deletion fails', () => {
        // Arrange
        api[ 'deleteGroupById' ].mockReturnValue( failing( ERROR_500 ) )
        findGroups.mockClear()

        // Act
        facade.deleteGroup( { id: 'g1' } as GroupModel ).subscribe( { error: (): void => undefined } )

        // Assert
        expect( findGroups ).not.toHaveBeenCalled()
    } )

    it( 'searches the participants to add to a group', () => {
        // Arrange
        const query: string = 'ada'

        // Act
        facade.searchParticipants( query )

        // Assert
        expect( api[ 'searchParticipants' ] ).toHaveBeenCalledWith( 'p1', 'ada' )
    } )

    it( 'announces the members change to the listeners', () => {
        // Arrange
        const changed: Mock = vi.fn()
        facade.handleGroupMembersChange().subscribe( changed )
        removeMemberFromGroupById.mockReturnValue( of( undefined ) )

        // Act
        facade.removeMemberFromGroup( 'g1', { id: 'pa1' } as ParticipantModel ).subscribe()

        // Assert
        expect( changed ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'stores the members search when it changed', () => {
        // Arrange
        const search: Parameters<typeof facade.inputMembersPageSearchParameters> = [ 'ada', 'IN', true ]

        // Act
        facade.inputMembersPageSearchParameters( ...search )

        // Assert
        expect( facade.groupMembersPageQueryParam() ).toBe( 'ada' )
        expect( facade.groupMembersPageStatusParam() ).toBe( 'IN' )
    } )

    it( 'keeps the groups search when the same values are input again', () => {
        // Arrange
        facade.inputPageSearchParameters( 'wolves', undefined, true, undefined )

        // Act
        facade.inputPageSearchParameters( 'wolves', undefined, true, undefined )

        // Assert
        expect( facade.groupsPageQueryParam() ).toBe( 'wolves' )
    } )
} )
