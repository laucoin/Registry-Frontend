import { TestBed } from '@angular/core/testing'
import { of, throwError } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { GroupApi } from '@pages/projects/[projectId]/configuration/groups/data/state/group.api'
import { GroupStore } from '@pages/projects/[projectId]/configuration/groups/data/state/group.store'
import { ErrorModel } from '@shared/models/model/error.model'
import { GroupModel } from '@shared/models/model/group.model'
import { PageModel } from '@shared/models/model/page.model'
import { ParticipantModel } from '@shared/models/model/participant.model'

function pageOf<T extends GroupModel | ParticipantModel> (content: T[]): PageModel<T> {
    return { pageNumber: 0, pageSize: 10, totalElements: content.length, totalPages: 1, content: content, lastRefresh: new Date() }
}

describe( 'GroupStore', () => {
    let store: InstanceType<typeof GroupStore>
    let findGroups: Mock<GroupApi['findGroups']>
    let findGroupMembersByGroupId: Mock<GroupApi['findGroupMembersByGroupId']>
    let setGlobalError: Mock<(error: ErrorModel) => void>

    beforeEach( () => {
        findGroups = vi.fn()
        findGroupMembersByGroupId = vi.fn()
        setGlobalError = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                GroupStore,
                { provide: GroupApi, useValue: { findGroups, findGroupMembersByGroupId } },
                { provide: ErrorReporter, useValue: { setGlobalError, notify: vi.fn() } },
            ],
        } )
        store = TestBed.inject( GroupStore )
    } )

    it( 'stores the fetched groups page and ends the loading state', () => {
        // Arrange
        const page: PageModel<GroupModel> = pageOf<GroupModel>( [ { id: 'g1' } as GroupModel ] )
        findGroups.mockReturnValue( of( page ) )

        // Act
        store.fetchGroupsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.groups.element() ).toEqual( page )
        expect( store.groups.loading() ).toBe( false )
        expect( store.groups.error() ).toBeUndefined()
    } )

    it( 'keeps the error message of a failed groups fetch in the groups block', () => {
        // Arrange
        findGroups.mockReturnValue( throwError( (): ErrorModel => ({ status: 500, title: 'Title', message: 'Message' }) as ErrorModel ) )

        // Act
        store.fetchGroupsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.groups.error()?.summary ).toBe( 'Title' )
        expect( store.groups.element() ).toBeUndefined()
        expect( store.groups.loading() ).toBe( false )
    } )

    it( 'reports a 503 globally and leaves the groups block untouched', () => {
        // Arrange
        const error: ErrorModel = { status: 503, title: 'Down', message: 'Down' } as ErrorModel
        findGroups.mockReturnValue( throwError( (): ErrorModel => error ) )

        // Act
        store.fetchGroupsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( setGlobalError ).toHaveBeenCalledWith( error )
        expect( store.groups.error() ).toBeUndefined()
    } )

    it( 'keeps fetching after a failure', () => {
        // Arrange
        const page: PageModel<GroupModel> = pageOf<GroupModel>( [] )
        findGroups.mockReturnValueOnce( throwError( (): ErrorModel => ({ status: 500 }) as ErrorModel ) )
        findGroups.mockReturnValueOnce( of( page ) )
        store.fetchGroupsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Act
        store.fetchGroupsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.groups.element() ).toEqual( page )
    } )

    it( 'resets the members block when another group is requested', () => {
        // Arrange
        findGroupMembersByGroupId.mockReturnValue( of( pageOf<ParticipantModel>( [ { id: 'm1' } as ParticipantModel ] ) ) )
        store.fetchGroupMembersPage( { projectId: 'p1', id: 'a', pageNumber: 0, pageSize: 10 } )
        findGroupMembersByGroupId.mockReturnValue( throwError( (): ErrorModel => ({ status: 500 }) as ErrorModel ) )

        // Act
        store.fetchGroupMembersPage( { projectId: 'p1', id: 'b', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.members.groupId() ).toBe( 'b' )
        expect( store.members.element() ).toBeUndefined()
    } )

    it( 'replaces the groups search parameters', () => {
        // Arrange
        const params: ReturnType<typeof store.groups.params> = { ...store.groups.params(), textSearched: 'scouts', resetSearch: true }

        // Act
        store.updateGroupsPageSearchParams( params )

        // Assert
        expect( store.groups.params() ).toEqual( params )
    } )
} )
