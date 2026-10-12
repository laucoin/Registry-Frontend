import { describe, expect, it } from 'vitest'
import { ActivityHelper } from '@shared/helpers/activity.helper'
import { GroupHelper } from '@shared/helpers/group.helper'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { UserHelper } from '@shared/helpers/user.helper'
import { VehicleHelper } from '@shared/helpers/vehicle.helper'
import { ActivityModel } from '@shared/models/model/activity.model'
import { GroupModel } from '@shared/models/model/group.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { UserModel } from '@shared/models/model/user.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

describe( 'select item helpers', () => {
    it( 'labels an activity with its name', () => {
        // Arrange
        const activity: ActivityModel = { name: 'Hike' } as ActivityModel

        // Act
        const item: { label?: string, value: ActivityModel } = ActivityHelper.toSelectItem( activity ) as { label?: string, value: ActivityModel }

        // Assert
        expect( item.label ).toBe( 'Hike' )
        expect( item.value ).toBe( activity )
    } )

    it( 'labels a group with its name', () => {
        // Arrange
        const group: GroupModel = { name: 'Wolves' } as GroupModel

        // Act
        const item: { label?: string } = GroupHelper.toSelectItem( group )

        // Assert
        expect( item.label ).toBe( 'Wolves' )
    } )

    it( 'labels a participant with the first and last name', () => {
        // Arrange
        const participant: ParticipantModel = { firstName: 'Ada', lastName: 'Lovelace' } as ParticipantModel

        // Act
        const item: { label?: string } = ParticipantHelper.toSelectItem( participant )

        // Assert
        expect( item.label ).toBe( 'Ada Lovelace' )
    } )

    it( 'labels a user with the email and the name', () => {
        // Arrange
        const user: UserModel = { email: 'a@b.c', firstName: 'Ada', lastName: 'Lovelace' } as UserModel

        // Act
        const item: { label?: string } = UserHelper.toSelectItem( user )

        // Assert
        expect( item.label ).toBe( 'a@b.c (Ada Lovelace)' )
    } )

    it( 'labels a vehicle with its brand, model and plate', () => {
        // Arrange
        const vehicle: VehicleModel = { brand: 'Ford', model: 'Transit', licensePlate: 'AB-123-CD' } as VehicleModel

        // Act
        const item: { label?: string } = VehicleHelper.toSelectItem( vehicle )

        // Assert
        expect( item.label ).toBe( 'Ford Transit (AB-123-CD)' )
    } )
} )
