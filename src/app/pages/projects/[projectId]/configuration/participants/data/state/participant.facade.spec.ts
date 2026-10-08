import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { ParticipantStore } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.store'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { ERROR_500, failing, pageOf, provideTestConfig } from '@shared/helpers/testing/test-fixtures'
import { ErrorModel } from '@shared/models/model/error.model'
import { ParticipantModel } from '@shared/models/model/participant.model'

describe( 'ParticipantFacade', () => {
    let facade: ParticipantFacade
    let findParticipants: Mock<ParticipantApi['findParticipants']>
    let createParticipant: Mock<ParticipantApi['createParticipant']>
    let updateParticipantById: Mock<ParticipantApi['updateParticipantById']>
    let deleteParticipantById: Mock<ParticipantApi['deleteParticipantById']>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        provideTestConfig()
        findParticipants = vi.fn( () => of( pageOf<ParticipantModel>( [], 2 ) ) )
        createParticipant = vi.fn()
        updateParticipantById = vi.fn()
        deleteParticipantById = vi.fn()
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                ParticipantFacade,
                ParticipantStore,
                { provide: ParticipantApi, useValue: { findParticipants, createParticipant, updateParticipantById, deleteParticipantById } },
                { provide: MovementApi, useValue: { findMovementsContents: vi.fn( () => of( [] ) ) } },
                { provide: MetadataApi, useValue: { getPresencesStatus: vi.fn( () => of( [] ) ) } },
                { provide: SessionFacade, useValue: { currentProjectId: signal( 'p1' ) } },
                { provide: UiFacade, useValue: { notify, setGlobalError: vi.fn() } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}`, langChanges$: new Subject<string>().asObservable() } },
            ],
        } )
        facade = TestBed.inject( ParticipantFacade )
        facade.fetchParticipantsPage( 2, 10 )
        findParticipants.mockClear()
    } )

    it( 'fetches the requested page for the selected project', () => {
        // Arrange
        const pageNumber: number = 3

        // Act
        facade.fetchParticipantsPage( pageNumber, 10 )

        // Assert
        expect( findParticipants ).toHaveBeenCalledWith( 'p1', 3, 10, expect.anything() )
    } )

    it( 'restarts from the first page when the search changed', () => {
        // Arrange
        facade.inputPageSearchParameters( 'ada', undefined, undefined )

        // Act
        facade.fetchParticipantsPage( 4, 10 )

        // Assert
        expect( findParticipants ).toHaveBeenCalledWith( 'p1', 0, 10, expect.anything() )
    } )

    it( 'announces a creation but not an update on the first-page reload channel', () => {
        // Arrange
        const received: string[] = []
        facade.handleParticipantFirstPageReload().subscribe( (event: unknown): number => received.push( (event as { command: string }).command ) )
        createParticipant.mockReturnValue( of( { id: 'pa1', firstName: 'Ada', lastName: 'L' } as ParticipantModel ) )
        updateParticipantById.mockReturnValue( of( { id: 'pa1', firstName: 'Ada', lastName: 'L' } as ParticipantModel ) )

        // Act
        facade.createParticipant( {} as never ).subscribe()
        facade.updateParticipant( 'pa1', {} as never ).subscribe()

        // Assert
        expect( received ).toEqual( [ 'create' ] )
    } )

    it( 'announces updates on the current-page reload channel', () => {
        // Arrange
        const received: string[] = []
        facade.handleParticipantCurrentPageReload().subscribe( (event: unknown): number => received.push( (event as { command: string }).command ) )
        updateParticipantById.mockReturnValue( of( { id: 'pa1', firstName: 'Ada', lastName: 'L' } as ParticipantModel ) )

        // Act
        facade.updateParticipant( 'pa1', {} as never ).subscribe()

        // Assert
        expect( received ).toEqual( [ 'update' ] )
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'participants.notifications.edit.title' } ) )
    } )

    it( 'lets the form handle a creation error other than 503', () => {
        // Arrange
        createParticipant.mockReturnValue( failing( ERROR_500 ) )
        let received: ErrorModel | undefined

        // Act
        facade.createParticipant( {} as never ).subscribe( { error: (error: ErrorModel): void => { received = error } } )

        // Assert
        expect( received ).toBe( ERROR_500 )
        expect( notify ).not.toHaveBeenCalled()
    } )

    it( 'notifies and refreshes the page after a deletion', () => {
        // Arrange
        deleteParticipantById.mockReturnValue( of( undefined ) )

        // Act
        facade.deleteParticipant( { id: 'pa1', firstName: 'Ada', lastName: 'L' } as ParticipantModel ).subscribe()

        // Assert
        expect( deleteParticipantById ).toHaveBeenCalledWith( undefined, 'pa1' )
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'participants.notifications.delete.title' } ) )
        expect( findParticipants ).toHaveBeenCalledWith( 'p1', 2, 10, expect.anything() )
    } )
} )
