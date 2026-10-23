import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree } from '@angular/forms/signals'
import { describe, expect, it } from 'vitest'
import {
    CommunicationFormModel,
    createCommunicationForm,
    emptyCommunicationFormModel,
    toCommunicationDto,
    toNewAlertDto,
} from '@shared/ui/domain/communication-form/communication.form'
import { AlertModel } from '@shared/models/model/alert.model'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { MovementModel } from '@shared/models/model/movement.model'

const MOVEMENT_ITEM: CommunicationFormModel[ 'movement' ] = { label: 'm', value: { id: 'm1' } as MovementModel }
const ALERT_ITEM: CommunicationFormModel[ 'alert' ] = { label: 'a', value: { id: 'al1' } as AlertModel }
const LINKED: CommunicationFormModel = { ...emptyCommunicationFormModel(), message: 'hello', movement: MOVEMENT_ITEM }

function kindsOf (field: { errors: () => readonly { kind: string }[] }): string[] {
    return field.errors().map( (error: { kind: string }): string => error.kind )
}

describe( 'communication form', () => {
    function build (initial: CommunicationFormModel, newAlert: boolean = false): FieldTree<CommunicationFormModel> {
        const model: WritableSignal<CommunicationFormModel> = signal( initial )
        return TestBed.runInInjectionContext( () => createCommunicationForm( model, { newAlert: (): boolean => newAlert } ) )
    }

    it( 'requires a message of at most 250 characters', () => {
        // Arrange
        const empty: FieldTree<CommunicationFormModel> = build( { ...LINKED, message: '  ' } )
        const long: FieldTree<CommunicationFormModel> = build( { ...LINKED, message: 'a'.repeat( 251 ) } )

        // Act
        const kinds: string[][] = [ kindsOf( empty.message() ), kindsOf( long.message() ) ]

        // Assert
        expect( kinds ).toEqual( [ [ 'blank' ], [ 'maxLength' ] ] )
    } )

    it( 'asks for a movement or an alert on the form itself', () => {
        // Arrange
        const none: FieldTree<CommunicationFormModel> = build( { ...LINKED, movement: null } )
        const withAlert: FieldTree<CommunicationFormModel> = build( { ...LINKED, movement: null, alert: ALERT_ITEM } )

        // Act
        const kinds: string[][] = [ kindsOf( none() ), kindsOf( withAlert() ) ]

        // Assert
        expect( kinds ).toEqual( [ [ 'atLeastOneRequired' ], [] ] )
    } )

    it( 'requires the title of a new alert only while an alert is being created', () => {
        // Arrange
        const creating: FieldTree<CommunicationFormModel> = build( LINKED, true )
        const idle: FieldTree<CommunicationFormModel> = build( LINKED, false )
        const tooLong: FieldTree<CommunicationFormModel> = build( { ...LINKED, newAlertTitle: 'a'.repeat( 51 ) }, true )

        // Act
        const kinds: string[][] = [ kindsOf( creating.newAlertTitle() ), kindsOf( idle.newAlertTitle() ), kindsOf( tooLong.newAlertTitle() ) ]

        // Assert
        expect( kinds ).toEqual( [ [ 'required', 'blank' ], [], [ 'maxLength' ] ] )
    } )

    it( 'builds the communication dto keeping the date of an existing communication', () => {
        // Arrange
        const existing: CommunicationModel = { dateTime: '2026-01-01T10:00:00.000Z' } as unknown as CommunicationModel

        // Act
        const dto: object = toCommunicationDto( { ...LINKED, alert: ALERT_ITEM }, existing )

        // Assert
        expect( dto ).toEqual( { dateTime: '2026-01-01T10:00:00.000Z', message: 'hello', movementId: 'm1', alertId: 'al1' } )
    } )

    it( 'builds the new alert dto from the title, the message and the movement', () => {
        // Arrange
        const model: CommunicationFormModel = { ...LINKED, newAlertTitle: 'Fire' }

        // Act
        const dto: object = toNewAlertDto( model )

        // Assert
        expect( dto ).toEqual( { title: 'Fire', dateTime: expect.any( String ), message: 'hello', movementId: 'm1' } )
    } )
} )
