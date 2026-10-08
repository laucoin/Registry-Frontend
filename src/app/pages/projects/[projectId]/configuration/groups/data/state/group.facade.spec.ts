import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { GroupApi } from '@pages/projects/[projectId]/configuration/groups/data/state/group.api'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { GroupStore } from '@pages/projects/[projectId]/configuration/groups/data/state/group.store'
import { CommandEventService } from '@shared/helpers/facade/command-event.service'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { AddedGroupMembersDto } from '@shared/models/dto/added-group-members.dto'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { GroupModel } from '@shared/models/model/group.model'
import { PageModel } from '@shared/models/model/page.model'

const EMPTY_PAGE: PageModel<GroupModel> = { pageNumber: 2, pageSize: 10, totalElements: 0, totalPages: 1, content: [], lastRefresh: new Date() }

describe( 'GroupFacade', () => {
    let facade: GroupFacade
    let findGroups: Mock<GroupApi['findGroups']>
    let createGroup: Mock<GroupApi['createGroup']>
    let addMembersToGroupById: Mock<GroupApi['addMembersToGroupById']>
    let notify: Mock<(message: unknown) => void>
    let commandEvents: CommandEventService

    beforeEach( () => {
        RegistryConfig.config = { notification: { duration: { info: 1, success: 1, warn: 1, error: 1, secondary: 1, contrast: 1 } } } as ConfigModel
        findGroups = vi.fn( () => of( EMPTY_PAGE ) )
        createGroup = vi.fn()
        addMembersToGroupById = vi.fn()
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                GroupFacade,
                GroupStore,
                { provide: GroupApi, useValue: { findGroups, createGroup, addMembersToGroupById, findGroupMembersByGroupId: vi.fn( () => of( EMPTY_PAGE ) ) } },
                { provide: RegistryFacade, useValue: { currentProjectId: signal( 'p1' ), notify, setGlobalError: vi.fn() } },
                { provide: PluralTranslationPipe, useValue: { transform: (key: string, count: number): string => `${key}:${count}` } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}` } },
            ],
        } )
        facade = TestBed.inject( GroupFacade )
        commandEvents = TestBed.inject( CommandEventService )
    } )

    it( 'fetches the requested groups page for the selected project', () => {
        // Arrange
        const pageNumber: number = 3

        // Act
        facade.fetchGroupsPage( pageNumber, 10 )

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

    it( 'does not touch the search parameters when nothing changed', () => {
        // Arrange
        facade.inputPageSearchParameters( 'scouts', undefined, undefined, undefined )
        facade.fetchGroupsPage( 0, 10 )

        // Act
        facade.inputPageSearchParameters( 'scouts', undefined, undefined, undefined )

        // Assert
        expect( facade.groupsPageTextSearchedParam() ).toBe( 'scouts' )
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
        expect( findGroups ).toHaveBeenCalledWith( 'p1', 2, 10, expect.anything() )
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
} )
