import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree } from '@angular/forms/signals'
import { describe, expect, it } from 'vitest'
import {
    createProjectForm,
    createProjectOptionsForm,
    ProjectFormModel,
    ProjectOptionsFormModel,
    selectedOptionsState,
    toProjectDto,
    toProjectFormModel,
    toProjectOptionsFormModel,
    withAllOptions,
} from '@pages/projects/project-form/project.form'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { ProjectOptionModel } from '@shared/models/model/project-option.model'
import { ProjectModel } from '@shared/models/model/project.model'

const JUNE: CustomDatetimeModel = { date: '2026-06-01', time: '10:00:00' }
const AUGUST: CustomDatetimeModel = { date: '2026-08-01', time: '10:00:00' }
const OPTIONS: ProjectOptionModel[] = [
    { value: ProjectOptionEnum.ACTIVITY, label: 'Activity', ask: '', preRequired: [] },
    { value: ProjectOptionEnum.ALERT, label: 'Alert', ask: '', preRequired: [ { label: 'Activity', value: ProjectOptionEnum.ACTIVITY } ] },
]

function kindsOf (field: { errors: () => readonly { kind: string }[] }): string[] {
    return field.errors().map( (error: { kind: string }): string => error.kind )
}

describe( 'project form', () => {
    it( 'maps no project to a blank form and a project to its name and dates', () => {
        // Arrange
        const project: ProjectModel = { name: 'Camp', begin: JUNE, end: undefined } as ProjectModel

        // Act
        const results: ProjectFormModel[] = [ toProjectFormModel(), toProjectFormModel( project ) ]

        // Assert
        expect( results ).toEqual( [
            { name: '', beginDateTime: null, endDateTime: null },
            { name: 'Camp', beginDateTime: JUNE, endDateTime: null },
        ] )
    } )

    it( 'ticks the selected options among the available ones', () => {
        // Arrange
        const selected: { label: string, value: ProjectOptionEnum }[] = [ { label: 'Alert', value: ProjectOptionEnum.ALERT } ]

        // Act
        const options: ProjectOptionsFormModel = toProjectOptionsFormModel( OPTIONS, selected )

        // Assert
        expect( options ).toEqual( { ACTIVITY: false, ALERT: true } )
    } )

    it.each( [
        [ { A: false, B: false }, false ],
        [ { A: true, B: true }, true ],
        [ { A: true, B: false }, undefined ],
    ] )( 'judges the options %j as selected=%s', (options: ProjectOptionsFormModel, expected: boolean | undefined) => {
        // Arrange
        const model: ProjectOptionsFormModel = options

        // Act
        const state: boolean | undefined = selectedOptionsState( model )

        // Assert
        expect( state ).toBe( expected )
    } )

    it( 'ticks or clears every option at once', () => {
        // Arrange
        const options: ProjectOptionsFormModel = { A: false, B: true }

        // Act
        const results: ProjectOptionsFormModel[] = [ withAllOptions( options, true ), withAllOptions( options, false ) ]

        // Assert
        expect( results ).toEqual( [ { A: true, B: true }, { A: false, B: false } ] )
    } )

    it( 'builds the dto with the ticked options only', () => {
        // Arrange
        const model: ProjectFormModel = { name: 'Camp', beginDateTime: JUNE, endDateTime: null }

        // Act
        const dto: object = toProjectDto( model, { ACTIVITY: true, ALERT: false } )

        // Assert
        expect( dto ).toEqual( { name: 'Camp', begin: JUNE, end: undefined, options: [ 'ACTIVITY' ] } )
    } )

    it( 'requires a name and an end after the beginning', () => {
        // Arrange
        const model: WritableSignal<ProjectFormModel> = signal( { name: '', beginDateTime: AUGUST, endDateTime: JUNE } )
        const tree: FieldTree<ProjectFormModel> = TestBed.runInInjectionContext( () => createProjectForm( model ) )

        // Act
        const kinds: string[][] = [ kindsOf( tree.name() ), kindsOf( tree() ) ]

        // Assert
        expect( kinds ).toEqual( [ [ 'required', 'blank' ], [ 'beginDateBeforeEndDate' ] ] )
    } )

    it( 'rejects an option whose prerequisite is not ticked', () => {
        // Arrange
        const model: WritableSignal<ProjectOptionsFormModel> = signal( { ACTIVITY: false, ALERT: true } )
        const tree: FieldTree<ProjectOptionsFormModel> = TestBed.runInInjectionContext( () => createProjectOptionsForm( model, () => OPTIONS ) )

        // Act
        const before: string[] = kindsOf( tree() )
        model.set( { ACTIVITY: true, ALERT: true } )

        // Assert
        expect( [ before, kindsOf( tree() ) ] ).toEqual( [ [ 'preRequiredOptions' ], [] ] )
    } )
} )
