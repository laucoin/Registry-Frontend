import { describe, expect, it } from 'vitest'
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper'
import { PARTICIPANT_DTO, GROUP_DTO, VEHICLE_DTO } from '@shared/helpers/testing/response-fixtures'
import { GroupMapper } from '@shared/mappers/group.mapper'
import { ParticipantMapper } from '@shared/mappers/participant.mapper'
import { VehicleMapper } from '@shared/mappers/vehicle.mapper'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { GroupModel } from '@shared/models/model/group.model'
import { MonitoringRowModel, MonitoringStatusVariant } from '@shared/models/model/monitoring-row.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

describe( 'MonitoringRowHelper', () => {
    it.each<[ PresenceStatusEnum, MonitoringStatusVariant ]>( [
        [ PresenceStatusEnum.IN, 'success' ],
        [ PresenceStatusEnum.OUT, 'warning' ],
        [ PresenceStatusEnum.OVERDUE, 'danger' ],
        [ PresenceStatusEnum.UNAVAILABLE, 'neutral' ],
    ] )( 'colors the %s presence status %s', (status: PresenceStatusEnum, expected: MonitoringStatusVariant) => {
        // Arrange
        const given: PresenceStatusEnum = status

        // Act
        const variant: MonitoringStatusVariant = MonitoringRowHelper.statusVariant( given )

        // Assert
        expect( variant ).toBe( expected )
    } )

    it( 'falls back to the neutral color for an unknown status', () => {
        // Arrange
        const unknown: PresenceStatusEnum = 'OTHER' as PresenceStatusEnum

        // Act
        const variant: MonitoringStatusVariant = MonitoringRowHelper.statusVariant( unknown )

        // Assert
        expect( variant ).toBe( 'neutral' )
    } )

    it( 'builds a participant row with the upper-cased last name and the names of the groups', () => {
        // Arrange
        const group: GroupModel = GroupMapper.toModel( GROUP_DTO )
        const participant: ParticipantModel = { ...ParticipantMapper.toModel( PARTICIPANT_DTO ), groups: [ group, { ...group, name: 'Owls' } ] }

        // Act
        const row: MonitoringRowModel = MonitoringRowHelper.fromParticipant( participant )

        // Assert
        expect( row ).toEqual( { id: 'pa1', title: 'A B', subtitle: 'Wolves, Owls', statusLabel: 'In', statusVariant: 'success', icon: 'user' } )
    } )

    it( 'describes a participant without group by its type', () => {
        // Arrange
        const participant: ParticipantModel = ParticipantMapper.toModel( PARTICIPANT_DTO )

        // Act
        const row: MonitoringRowModel = MonitoringRowHelper.fromParticipant( participant )

        // Assert
        expect( row.subtitle ).toBe( 'Registered' )
    } )

    it( 'builds a vehicle row with its brand, model and license plate', () => {
        // Arrange
        const vehicle: VehicleModel = VehicleMapper.toModel( VEHICLE_DTO )

        // Act
        const row: MonitoringRowModel = MonitoringRowHelper.fromVehicle( vehicle )

        // Assert
        expect( row ).toEqual( { id: 'v1', title: 'Ford T', subtitle: 'AB-123', statusLabel: 'In', statusVariant: 'success', icon: 'car' } )
    } )

    it( 'keeps the title of a participant without last name free of stray spaces', () => {
        // Arrange
        const participant: ParticipantModel = { ...ParticipantMapper.toModel( PARTICIPANT_DTO ), lastName: undefined as never }

        // Act
        const row: MonitoringRowModel = MonitoringRowHelper.fromParticipant( participant )

        // Assert
        expect( row.title ).toBe( 'A' )
    } )

    it( 'describes a participant whose groups are empty by its type', () => {
        // Arrange
        const participant: ParticipantModel = { ...ParticipantMapper.toModel( PARTICIPANT_DTO ), groups: [] }

        // Act
        const row: MonitoringRowModel = MonitoringRowHelper.fromParticipant( participant )

        // Assert
        expect( row.subtitle ).toBe( 'Registered' )
    } )

    it( 'titles a vehicle without brand by its model only', () => {
        // Arrange
        const vehicle: VehicleModel = { ...VehicleMapper.toModel( VEHICLE_DTO ), brand: '' }

        // Act
        const row: MonitoringRowModel = MonitoringRowHelper.fromVehicle( vehicle )

        // Assert
        expect( row.title ).toBe( 'T' )
    } )

    it( 'builds a participant row without status when the backend sends none', () => {
        // Arrange
        const participant: ParticipantModel = { ...ParticipantMapper.toModel( PARTICIPANT_DTO ), status: undefined as never, groups: undefined }

        // Act
        const row: MonitoringRowModel = MonitoringRowHelper.fromParticipant( participant )

        // Assert
        expect( row.statusLabel ).toBeUndefined()
        expect( row.statusVariant ).toBe( 'neutral' )
        expect( row.title ).toBe( 'A B' )
    } )

    it( 'names a participant and describes him by his group or his type', () => {
        // Arrange
        const participant: ParticipantModel = ParticipantMapper.toModel( PARTICIPANT_DTO )

        // Act
        const name: string = MonitoringRowHelper.fullName( participant )
        const detail: string | undefined = MonitoringRowHelper.participantDetail( participant )

        // Assert
        expect( name ).toBe( 'A B' )
        expect( detail ).toBe( 'Registered' )
    } )
} )
