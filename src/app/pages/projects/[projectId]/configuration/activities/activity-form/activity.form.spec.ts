import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree } from '@angular/forms/signals'
import { describe, expect, it } from 'vitest'
import {
    ActivityFormModel,
    createActivityForm,
    toActivityDto,
    toActivityFormModel,
} from '@pages/projects/[projectId]/configuration/activities/activity-form/activity.form'
import { ProjectDateContext } from '@shared/helpers/form/registry.schemas'
import { ActivityModel } from '@shared/models/model/activity.model'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'

const JUNE: CustomDatetimeModel = { date: '2026-06-01', time: '10:00:00' }
const AUGUST: CustomDatetimeModel = { date: '2026-08-01', time: '10:00:00' }
const VALID: ActivityFormModel = { name: 'Hike', description: '', duration: null, allowedParticipants: null, beginDateTime: null, endDateTime: null }

function kindsOf (field: { errors: () => readonly { kind: string }[] }): string[] {
    return field.errors().map( (error: { kind: string }): string => error.kind )
}

describe( 'activity form', () => {
    function build (initial: ActivityFormModel): FieldTree<ActivityFormModel> {
        const model: WritableSignal<ActivityFormModel> = signal( initial )
        const context: ProjectDateContext = { project: (): undefined => undefined, formatDate: (date: CustomDatetimeModel): string => date.date! }
        return TestBed.runInInjectionContext( () => createActivityForm( model, context ) )
    }

    it( 'maps an empty activity to a blank form', () => {
        // Arrange
        const activity: ActivityModel | undefined = undefined

        // Act
        const model: ActivityFormModel = toActivityFormModel( activity )

        // Assert
        expect( model ).toEqual( { ...VALID, name: '' } )
    } )

    it( 'maps an activity to the model and the model back to a dto with an iso duration', () => {
        // Arrange
        const activity: ActivityModel = {
            name: 'Hike', description: 'd', duration: { label: '1h30', value: 'PT1H30M' },
            allowedParticipants: { lower: 1, upper: 5 }, startAvailability: JUNE, endAvailability: undefined,
        } as ActivityModel

        // Act
        const dto: object = toActivityDto( toActivityFormModel( activity ) )

        // Assert
        expect( dto ).toEqual( {
            name: 'Hike', description: 'd', duration: 'PT1H30M', allowedParticipants: { lower: 1, upper: 5 },
            startAvailability: JUNE, endAvailability: undefined,
        } )
    } )

    it( 'sends no duration when none is chosen', () => {
        // Arrange
        const model: ActivityFormModel = { ...VALID, duration: null }

        // Act
        const dto: { duration: string | undefined } = toActivityDto( model )

        // Assert
        expect( dto.duration ).toBeUndefined()
    } )

    it( 'requires a name and limits the description', () => {
        // Arrange
        const tree: FieldTree<ActivityFormModel> = build( { ...VALID, name: '', description: 'a'.repeat( 2001 ) } )

        // Act
        const kinds: string[][] = [ kindsOf( tree.name() ), kindsOf( tree.description() ) ]

        // Assert
        expect( kinds ).toEqual( [ [ 'required', 'blank' ], [ 'maxLength' ] ] )
    } )

    it.each( [
        [ { lower: 5, upper: 2 }, [ 'rangeMin' ] ],
        [ { lower: 0, upper: 2 }, [ 'min' ] ],
        [ { lower: 1, upper: 2147483648 }, [ 'max' ] ],
        [ { lower: 1, upper: undefined }, [ 'rangeBothDefined' ] ],
        [ { lower: 1, upper: 5 }, [] ],
    ] )( 'judges the allowed participants %j as %j', (range: { lower: number, upper: number | undefined }, expected: string[]) => {
        // Arrange
        const tree: FieldTree<ActivityFormModel> = build( { ...VALID, allowedParticipants: range } )

        // Act
        const kinds: string[] = kindsOf( tree.allowedParticipants() )

        // Assert
        expect( kinds ).toEqual( expected )
    } )

    it( 'rejects an end before the beginning on the form itself', () => {
        // Arrange
        const tree: FieldTree<ActivityFormModel> = build( { ...VALID, beginDateTime: AUGUST, endDateTime: JUNE } )

        // Act
        const kinds: string[] = kindsOf( tree() )

        // Assert
        expect( kinds ).toEqual( [ 'beginDateBeforeEndDate' ] )
    } )
} )
