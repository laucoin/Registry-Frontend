import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree } from '@angular/forms/signals'
import { describe, expect, it } from 'vitest'
import {
    createProjectProfileForm,
    createProjectProfileInvitationForm,
    ProjectProfileFormModel,
    ProjectProfileInvitationFormModel,
    toProjectProfileDto,
    toProjectProfileFormModel,
    toProjectProfileInvitationFormModel,
    toProjectProfilesDto,
} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile.form'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { UserModel } from '@shared/models/model/user.model'

const JUNE: CustomDatetimeModel = { date: '2026-06-01', time: '10:00:00' }
const AUGUST: CustomDatetimeModel = { date: '2026-08-01', time: '10:00:00' }

function kindsOf (field: { errors: () => readonly { kind: string }[] }): string[] {
    return field.errors().map( (error: { kind: string }): string => error.kind )
}

describe( 'project profile form', () => {
    it( 'maps no profile to an empty form and a profile to its role and access dates', () => {
        // Arrange
        const profile: ProjectProfileModel = { role: { label: 'Chief', value: 'CHIEF' }, startAccess: JUNE, endAccess: undefined } as ProjectProfileModel

        // Act
        const results: ProjectProfileFormModel[] = [ toProjectProfileFormModel(), toProjectProfileFormModel( profile ) ]

        // Assert
        expect( results ).toEqual( [
            { role: '', beginDateTime: null, endDateTime: null },
            { role: 'CHIEF', beginDateTime: JUNE, endDateTime: null },
        ] )
    } )

    it( 'maps the models to the edition and invitation dtos', () => {
        // Arrange
        const model: ProjectProfileInvitationFormModel = {
            role: 'CHIEF', beginDateTime: JUNE, endDateTime: null, users: [ { id: 'u1' } as UserModel ],
        }

        // Act
        const dtos: object[] = [ toProjectProfileDto( model ), toProjectProfilesDto( model ) ]

        // Assert
        expect( dtos ).toEqual( [
            { role: 'CHIEF', startAccess: JUNE, endAccess: undefined },
            { role: 'CHIEF', startAccess: JUNE, endAccess: undefined, userIds: [ 'u1' ] },
        ] )
    } )

    it( 'requires a role and an end after the beginning', () => {
        // Arrange
        const model: WritableSignal<ProjectProfileFormModel> = signal( { role: '', beginDateTime: AUGUST, endDateTime: JUNE } )
        const tree: FieldTree<ProjectProfileFormModel> = TestBed.runInInjectionContext( () => createProjectProfileForm( model ) )

        // Act
        const kinds: string[][] = [ kindsOf( tree.role() ), kindsOf( tree() ) ]

        // Assert
        expect( kinds ).toEqual( [ [ 'required' ], [ 'beginDateBeforeEndDate' ] ] )
    } )

    it( 'requires at least one user to invite', () => {
        // Arrange
        const model: WritableSignal<ProjectProfileInvitationFormModel> = signal( toProjectProfileInvitationFormModel() )
        const tree: FieldTree<ProjectProfileInvitationFormModel> = TestBed.runInInjectionContext( () => createProjectProfileInvitationForm( model ) )

        // Act
        const empty: string[] = kindsOf( tree.users() )
        model.set( { ...model(), users: [ { id: 'u1' } as UserModel ] } )

        // Assert
        expect( [ empty, kindsOf( tree.users() ) ] ).toEqual( [ [ 'required' ], [] ] )
    } )
} )
