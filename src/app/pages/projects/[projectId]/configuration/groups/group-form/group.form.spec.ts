import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree } from '@angular/forms/signals'
import { describe, expect, it } from 'vitest'
import {
    createGroupForm,
    GroupFormModel,
    toGroupDto,
    toGroupFormModel,
} from '@pages/projects/[projectId]/configuration/groups/group-form/group.form'
import { ProjectDateContext } from '@shared/helpers/form/registry.schemas'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { GroupModel } from '@shared/models/model/group.model'
import { ParticipantModel } from '@shared/models/model/participant.model'

const JUNE: CustomDatetimeModel = { date: '2026-06-01', time: '10:00:00' }
const AUGUST: CustomDatetimeModel = { date: '2026-08-01', time: '10:00:00' }
const MEMBER: ParticipantModel = { id: 'pa1' } as ParticipantModel
const VALID: GroupFormModel = { name: 'Wolves', beginDateTime: null, endDateTime: null, participants: [ MEMBER ] }

function kindsOf (field: { errors: () => readonly { kind: string }[] }): string[] {
    return field.errors().map( (error: { kind: string }): string => error.kind )
}

describe( 'group form', () => {
    function build (initial: GroupFormModel): FieldTree<GroupFormModel> {
        const model: WritableSignal<GroupFormModel> = signal( initial )
        const context: ProjectDateContext = { project: (): undefined => undefined, formatDate: (date: CustomDatetimeModel): string => date.date! }
        return TestBed.runInInjectionContext( () => createGroupForm( model, context ) )
    }

    it( 'maps an empty group to a blank form', () => {
        // Arrange
        const group: GroupModel | undefined = undefined

        // Act
        const model: GroupFormModel = toGroupFormModel( group )

        // Assert
        expect( model ).toEqual( { name: '', beginDateTime: null, endDateTime: null, participants: [] } )
    } )

    it( 'maps a group to the model and the model back to a dto with member ids', () => {
        // Arrange
        const group: GroupModel = { name: 'Wolves', startAvailability: JUNE, endAvailability: undefined, members: [ MEMBER ] } as GroupModel

        // Act
        const dto: object = toGroupDto( toGroupFormModel( group ) )

        // Assert
        expect( dto ).toEqual( { name: 'Wolves', startAvailability: JUNE, endAvailability: undefined, members: [ 'pa1' ] } )
    } )

    it( 'requires a name and at least one member', () => {
        // Arrange
        const tree: FieldTree<GroupFormModel> = build( { ...VALID, name: '', participants: [] } )

        // Act
        const kinds: string[][] = [ kindsOf( tree.name() ), kindsOf( tree.participants() ) ]

        // Assert
        expect( kinds ).toEqual( [ [ 'required', 'blank' ], [ 'required' ] ] )
    } )

    it( 'accepts a valid form and rejects an end before the beginning on the form itself', () => {
        // Arrange
        const valid: FieldTree<GroupFormModel> = build( VALID )
        const reversed: FieldTree<GroupFormModel> = build( { ...VALID, beginDateTime: AUGUST, endDateTime: JUNE } )

        // Act
        const results: unknown[] = [ valid().valid(), kindsOf( reversed() ) ]

        // Assert
        expect( results ).toEqual( [ true, [ 'beginDateBeforeEndDate' ] ] )
    } )
} )
