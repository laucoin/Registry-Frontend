import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { BrowserService } from '@core/browser/browser.service'
import { SessionFacade } from '@core/registry/state/session.facade'
import { MovementPrefillService } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-prefill.service'
import { MovementPrefillModel } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-prefill.model'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model'

const PARTICIPANT: ParticipantModel = { id: 'pa1', type: { label: 'Guest', value: ParticipantTypeEnum.GUEST } } as ParticipantModel

describe( 'MovementPrefillService', () => {
    let service: MovementPrefillService
    let navigateByUrl: Mock<Router['navigateByUrl']>
    let historyState: unknown
    let currentUser: WritableSignal<CurrentUserModel | undefined>

    beforeEach( () => {
        navigateByUrl = vi.fn( () => Promise.resolve( true ) )
        historyState = null
        currentUser = signal<CurrentUserModel | undefined>( { id: 'u1', authorities: [ `p1_${ ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_C }` ] } as CurrentUserModel )
        TestBed.configureTestingModule( {
            providers: [
                MovementPrefillService,
                { provide: Router, useValue: { navigateByUrl } },
                { provide: BrowserService, useValue: { get historyState (): unknown { return historyState } } },
                { provide: SessionFacade, useValue: { currentUser, currentProjectId: signal( 'p1' ) } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${ key }` } },
            ],
        } )
        service = TestBed.inject( MovementPrefillService )
    } )

    it( 'opens the guest form with the planned participants and the planned reason', () => {
        // Arrange
        const planned: PlannedMovementModel = { type: { value: MovementTypeEnum.IN }, contentType: ParticipantTypeEnum.GUEST, poolName: 'Bus', participants: [ PARTICIPANT ], reason: undefined } as unknown as PlannedMovementModel

        // Act
        service.openPlanned( planned )

        // Assert
        const [ url, extras ]: Parameters<Router['navigateByUrl']> = navigateByUrl.mock.calls[ 0 ]
        expect( url ).toMatch( /\/create\/guest$/ )
        expect( ( extras?.state as Record<string, MovementPrefillModel> )[ 'movementPrefill' ].content[ 0 ].poolName ).toBe( 'Bus' )
    } )

    it( 'opens the registered form with a definitive departure to regularize a participant', () => {
        // Arrange
        const registered: ParticipantModel = { id: 'pa2', type: { label: 'Registered', value: ParticipantTypeEnum.REGISTERED } } as ParticipantModel

        // Act
        service.openRegularization( registered )

        // Assert
        const [ url, extras ]: Parameters<Router['navigateByUrl']> = navigateByUrl.mock.calls[ 0 ]
        const prefill: MovementPrefillModel = ( extras?.state as Record<string, MovementPrefillModel> )[ 'movementPrefill' ]
        expect( url ).toMatch( /\/create\/registered$/ )
        expect( prefill.type ).toBe( MovementTypeEnum.OUT )
        expect( prefill.reason?.value ).toBe( 'DEFINITIVE_DEPARTURE' )
    } )

    it( 'opens the reverse movement without the vehicle of the original one', () => {
        // Arrange
        const movement: MovementModel = { type: { value: MovementTypeEnum.OUT }, contentType: ParticipantTypeEnum.REGISTERED, content: [ { participant: PARTICIPANT, vehicle: { id: 'v1' } } ] } as unknown as MovementModel

        // Act
        service.openReverse( movement )

        // Assert
        const prefill: MovementPrefillModel = ( navigateByUrl.mock.calls[ 0 ][ 1 ]?.state as Record<string, MovementPrefillModel> )[ 'movementPrefill' ]
        expect( prefill.type ).toBe( MovementTypeEnum.IN )
        expect( prefill.content[ 0 ].vehicle ).toBeUndefined()
        expect( prefill.reason ).toBeUndefined()
    } )

    it( 'opens nothing when the user cannot create movements', () => {
        // Arrange
        currentUser.set( { id: 'u1', authorities: [] } as unknown as CurrentUserModel )

        // Act
        service.openRegularization( PARTICIPANT )

        // Assert
        expect( service.canCreate() ).toBe( false )
        expect( navigateByUrl ).not.toHaveBeenCalled()
    } )

    it( 'reads the prefill carried by the navigation state', () => {
        // Arrange
        const prefill: MovementPrefillModel = { type: MovementTypeEnum.IN, reason: undefined, content: [] }
        historyState = { movementPrefill: prefill }

        // Act
        const read: MovementPrefillModel | undefined = service.read()

        // Assert
        expect( read ).toBe( prefill )
    } )

    it.each( [ null, {}, { movementPrefill: {} } ] )( 'reads no prefill from the state %j', (state: unknown) => {
        // Arrange
        historyState = state

        // Act
        const read: MovementPrefillModel | undefined = service.read()

        // Assert
        expect( read ).toBeUndefined()
    } )

    it( 'swallows a refused navigation', async () => {
        // Arrange
        navigateByUrl.mockReturnValue( Promise.reject( new Error( 'refused' ) ) )

        // Act
        service.openRegularization( PARTICIPANT )
        await Promise.resolve()

        // Assert
        expect( navigateByUrl ).toHaveBeenCalledTimes( 1 )
    } )
} )
