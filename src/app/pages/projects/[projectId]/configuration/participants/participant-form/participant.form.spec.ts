import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree } from '@angular/forms/signals'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { describe, expect, it } from 'vitest'
import {
    createParticipantForm,
    ParticipantFormModel,
    toParticipantDto,
    toParticipantFormModel,
    withSelectedUser,
} from '@pages/projects/[projectId]/configuration/participants/participant-form/participant.form'
import { ProjectDateContext } from '@shared/helpers/form/registry.schemas'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { GroupModel } from '@shared/models/model/group.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { UserModel } from '@shared/models/model/user.model'

const JUNE: CustomDatetimeModel = { date: '2026-06-01', time: '10:00:00' }
const AUGUST: CustomDatetimeModel = { date: '2026-08-01', time: '10:00:00' }
const GRACE: SelectOptionModel<UserModel> = { label: 'g', value: { id: 'u1', firstName: 'Grace', lastName: 'H' } as UserModel }
const NO_NAMES: SelectOptionModel<UserModel> = { label: 'n', value: { id: 'u2', firstName: undefined, lastName: undefined } as unknown as UserModel }
const VALID: ParticipantFormModel = {
    firstName: 'Ada', lastName: 'L', birthday: new Date( 2010, 0, 5 ), user: null, groups: [], beginDateTime: null, endDateTime: null,
}

function kindsOf (field: { errors: () => readonly { kind: string }[] }): string[] {
    return field.errors().map( (error: { kind: string }): string => error.kind )
}

describe( 'participant form', () => {
    function build (initial: ParticipantFormModel): FieldTree<ParticipantFormModel> {
        const model: WritableSignal<ParticipantFormModel> = signal( initial )
        const context: ProjectDateContext = { project: (): undefined => undefined, formatDate: (date: CustomDatetimeModel): string => date.date! }
        return TestBed.runInInjectionContext( () => createParticipantForm( model, context ) )
    }

    it( 'maps no participant to a blank form and a participant to its identity, user and groups', () => {
        // Arrange
        const participant: ParticipantModel = {
            firstName: 'A', lastName: 'B', birthday: '2010-01-05', user: GRACE.value, groups: [ { id: 'g1' } as GroupModel ],
        } as unknown as ParticipantModel

        // Act
        const results: ParticipantFormModel[] = [ toParticipantFormModel(), toParticipantFormModel( participant ) ]

        // Assert
        expect( results[ 0 ] ).toEqual( { ...VALID, firstName: '', lastName: '', birthday: null } )
        expect( results[ 1 ] ).toMatchObject( { firstName: 'A', lastName: 'B', groups: [ { id: 'g1' } ] } )
        expect( results[ 1 ].user!.value ).toEqual( GRACE.value )
        expect( results[ 1 ].user!.value ).not.toBe( GRACE.value )
    } )

    it( 'builds the dto with the user id and the default group appended once', () => {
        // Arrange
        const model: ParticipantFormModel = { ...VALID, user: GRACE, groups: [ { id: 'g9' } as GroupModel ] }

        // Act
        const dtos: object[] = [ toParticipantDto( model, { id: 'g9' } as GroupModel ), toParticipantDto( VALID, { id: 'g9' } as GroupModel ) ]

        // Assert
        expect( dtos ).toEqual( [
            expect.objectContaining( { userId: 'u1', groupIds: [ 'g9' ], birthday: '2010-01-05' } ),
            expect.objectContaining( { userId: undefined, groupIds: [ 'g9' ] } ),
        ] )
    } )

    it( 'overwrites the names with the ones of the selected user and keeps its own when it has none', () => {
        // Arrange
        const previous: { firstName: string | undefined, lastName: string | undefined } = { firstName: undefined, lastName: undefined }

        // Act
        const withNames: ParticipantFormModel = withSelectedUser( VALID, GRACE, previous )
        const withoutNames: ParticipantFormModel = withSelectedUser( VALID, NO_NAMES, previous )

        // Assert
        expect( [ withNames.firstName, withNames.lastName, withoutNames.firstName ] ).toEqual( [ 'Grace', 'H', 'Ada' ] )
    } )

    it( 'restores the previous names when the user is removed and keeps the current ones when none were saved', () => {
        // Arrange
        const selected: ParticipantFormModel = withSelectedUser( VALID, GRACE, { firstName: undefined, lastName: undefined } )

        // Act
        const restored: ParticipantFormModel = withSelectedUser( selected, null, { firstName: 'Ada', lastName: 'L' } )
        const untouched: ParticipantFormModel = withSelectedUser( selected, null, { firstName: undefined, lastName: undefined } )

        // Assert
        expect( [ restored.firstName, restored.user, untouched.firstName ] ).toEqual( [ 'Ada', null, 'Grace' ] )
    } )

    it( 'locks only the names the selected user provides', () => {
        // Arrange
        const tree: FieldTree<ParticipantFormModel> = build( { ...VALID, user: { label: 'p', value: { id: 'u3', firstName: 'Linus' } as UserModel } } )

        // Act
        const locked: boolean[] = [ tree.firstName().disabled(), tree.lastName().disabled() ]

        // Assert
        expect( locked ).toEqual( [ true, false ] )
    } )

    it( 'requires the names and a birthday that is not in the future', () => {
        // Arrange
        const empty: FieldTree<ParticipantFormModel> = build( { ...VALID, firstName: '', birthday: null } )
        const future: FieldTree<ParticipantFormModel> = build( { ...VALID, birthday: new Date( Date.now() + 10 * 86400000 ) } )

        // Act
        const kinds: string[][] = [ kindsOf( empty.firstName() ), kindsOf( empty.birthday() ), kindsOf( future.birthday() ) ]

        // Assert
        expect( kinds ).toEqual( [ [ 'required', 'blank' ], [ 'required' ], [ 'maxDate' ] ] )
    } )

    it( 'rejects an end before the beginning on the form itself', () => {
        // Arrange
        const tree: FieldTree<ParticipantFormModel> = build( { ...VALID, beginDateTime: AUGUST, endDateTime: JUNE } )

        // Act
        const kinds: string[] = kindsOf( tree() )

        // Assert
        expect( kinds ).toEqual( [ 'beginDateBeforeEndDate' ] )
    } )
} )
