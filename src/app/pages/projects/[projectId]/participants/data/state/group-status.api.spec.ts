import { TestBed } from '@angular/core/testing'
import { firstValueFrom } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'
import { GroupStatusApi } from '@pages/projects/[projectId]/participants/data/state/group-status.api'
import { GroupModel } from '@shared/models/model/group.model'
import { PageModel } from '@shared/models/model/page.model'

describe( 'GroupStatusApi', () => {
    let api: GroupStatusApi

    beforeEach( () => {
        vi.useFakeTimers()
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] }, hosting: { providerName: null, providerAddress: null } }
        api = TestBed.inject( GroupStatusApi )
    } )

    async function resolved (call: Promise<PageModel<GroupModel>>): Promise<PageModel<GroupModel>> {
        await vi.runAllTimersAsync()
        return call
    }

    it( 'returns all the groups with their members', async () => {
        // Arrange
        const request: Promise<PageModel<GroupModel>> = firstValueFrom( api.findGroups( 'p1', undefined, undefined ) )

        // Act
        const page: PageModel<GroupModel> = await resolved( request )

        // Assert
        expect( page.content.map( (group: GroupModel): string => group.id ) ).toEqual( [ 'g1', 'g2', 'g3' ] )
    } )

    it( 'returns fewer groups for my groups than for all the groups', async () => {
        // Arrange
        const request: Promise<PageModel<GroupModel>> = firstValueFrom( api.findMyGroups( 'p1', undefined, undefined ) )

        // Act
        const page: PageModel<GroupModel> = await resolved( request )

        // Assert
        expect( page.totalElements ).toBe( 2 )
    } )

    it( 'returns nothing past the last batch', async () => {
        // Arrange
        const request: Promise<PageModel<GroupModel>> = firstValueFrom( api.findGroups( 'p1', 5, 2 ) )

        // Act
        const page: PageModel<GroupModel> = await resolved( request )

        // Assert
        expect( page.content ).toEqual( [] )
        expect( page.hasNext ).toBe( false )
    } )

    it( 'serves the groups batch by batch', async () => {
        // Arrange
        const request: Promise<PageModel<GroupModel>> = firstValueFrom( api.findGroups( 'p1', 1, 2 ) )

        // Act
        const page: PageModel<GroupModel> = await resolved( request )

        // Assert
        expect( page.content ).toHaveLength( 1 )
        expect( page.hasNext ).toBe( false )
        expect( page.page ).toBe( 1 )
    } )

    it( 'announces a next batch while groups remain', async () => {
        // Arrange
        const request: Promise<PageModel<GroupModel>> = firstValueFrom( api.findGroups( 'p1', 0, 2 ) )

        // Act
        const page: PageModel<GroupModel> = await resolved( request )

        // Assert
        expect( page.hasNext ).toBe( true )
    } )
} )
