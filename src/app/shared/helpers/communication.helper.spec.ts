import { describe, expect, it } from 'vitest'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { CommunicationHelper } from '@shared/helpers/communication.helper'

describe( 'CommunicationHelper', () => {
    it( 'attributes a communication to its movement when the movement has a reason', () => {
        // Arrange
        const communication: CommunicationModel = { movement: { id: 'm1', reason: { label: 'Arrival' } }, lastEdition: { user: { id: 'u1', firstName: 'Ada' } } } as unknown as CommunicationModel

        // Act
        const authorId: string | undefined = CommunicationHelper.getAuthorId( communication )

        // Assert
        expect( authorId ).toBe( 'm1' )
    } )

    it( 'falls back to the last editor when there is no movement reason', () => {
        // Arrange
        const communication: CommunicationModel = { movement: { id: 'm1', reason: { label: ' ' } }, lastEdition: { user: { id: 'u1', firstName: 'Ada' } } } as unknown as CommunicationModel

        // Act
        const authorId: string | undefined = CommunicationHelper.getAuthorId( communication )

        // Assert
        expect( authorId ).toBe( 'u1' )
    } )

    it( 'has no author when neither can be identified', () => {
        // Arrange
        const communication: CommunicationModel = {} as CommunicationModel

        // Act
        const authorId: string | undefined = CommunicationHelper.getAuthorId( communication )

        // Assert
        expect( authorId ).toBeUndefined()
    } )
} )
