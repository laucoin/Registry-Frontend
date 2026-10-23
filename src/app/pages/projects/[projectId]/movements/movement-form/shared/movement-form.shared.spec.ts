import { describe, expect, it } from 'vitest'
import {
    contentOfChoice,
    interpretedPresence,
    reasonChoices,
    reasonFieldsOf,
    reasonKeyOf,
} from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared'
import { PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { GroupModel } from '@shared/models/model/group.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementReasonModel } from '@shared/models/model/movement-reason.model'
import { ParticipantModel } from '@shared/models/model/participant.model'

const REASON: MovementReasonModel = { kind: 'REASON', value: 'r1', label: 'Reason' }
const ACTIVITY: MovementReasonModel = { kind: 'ACTIVITY', value: 'a1', label: 'Activity' }

describe( 'movement form shared rules', () => {
    it.each( [
        [ MovementTypeEnum.IN, [ PresenceStatusEnum.IN ] ],
        [ MovementTypeEnum.OUT, [ PresenceStatusEnum.UNAVAILABLE, PresenceStatusEnum.OUT ] ],
        [ '', [] ],
    ] )( 'interprets the %s type as %j', (type: string, expected: PresenceStatusEnum[]) => {
        // Arrange
        const given: string = type

        // Act
        const statuses: PresenceStatusEnum[] = interpretedPresence( given )

        // Assert
        expect( statuses ).toEqual( expected )
    } )

    it( 'identifies a reason by its kind and value, and nothing by an empty key', () => {
        // Arrange
        const none: MovementReasonModel | null = null

        // Act
        const keys: string[] = [ reasonKeyOf( REASON ), reasonKeyOf( ACTIVITY ), reasonKeyOf( none ) ]

        // Assert
        expect( keys ).toEqual( [ 'REASON:r1', 'ACTIVITY:a1', '' ] )
    } )

    it( 'adds the chosen reason to the searched ones only when it is missing', () => {
        // Arrange
        const searched: MovementReasonModel[] = [ ACTIVITY ]

        // Act
        const missing: MovementReasonModel[] = reasonChoices( searched, REASON )
        const known: MovementReasonModel[] = reasonChoices( searched, ACTIVITY )
        const none: MovementReasonModel[] = reasonChoices( searched, null )

        // Assert
        expect( [ missing, known, none ] ).toEqual( [ [ REASON, ACTIVITY ], [ ACTIVITY ], [ ACTIVITY ] ] )
    } )

    it( 'sends the reason as a reason or as an activity depending on its kind', () => {
        // Arrange
        const none: MovementReasonModel | null = null

        // Act
        const fields: object[] = [ reasonFieldsOf( REASON ), reasonFieldsOf( ACTIVITY ), reasonFieldsOf( none ) ]

        // Assert
        expect( fields ).toEqual( [
            { reason: 'r1', activityId: undefined },
            { reason: undefined, activityId: 'a1' },
            { reason: undefined, activityId: undefined },
        ] )
    } )

    it( 'turns a chosen participant into one content and a chosen group into one content per member', () => {
        // Arrange
        const participant: ParticipantModel = structuredClone( PARTICIPANT_DTO ) as unknown as ParticipantModel
        const group: GroupModel = { name: 'team', members: [ participant, { ...participant, id: 'pa2' } ] } as unknown as GroupModel

        // Act
        const single: MovementContentModel[] = contentOfChoice( participant )
        const grouped: MovementContentModel[] = contentOfChoice( group )
        const empty: MovementContentModel[] = contentOfChoice( { name: 'void', members: undefined } as unknown as GroupModel )

        // Assert
        expect( single ).toEqual( [ { poolName: undefined, participant, vehicle: undefined } ] )
        expect( grouped.map( (content: MovementContentModel): string | undefined => content.poolName ) ).toEqual( [ 'team', 'team' ] )
        expect( empty ).toEqual( [] )
    } )
} )
