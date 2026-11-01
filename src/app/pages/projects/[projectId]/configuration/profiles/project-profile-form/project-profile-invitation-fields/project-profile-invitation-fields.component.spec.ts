import { signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileInvitationFieldsComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-invitation-fields/project-profile-invitation-fields.component'
import { InvitedUserModel } from '@shared/models/model/invited-user.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { UserModel } from '@shared/models/model/user.model'

interface FieldsApi {
    handleSearch: (searched: { query: string }) => void
    suggestions: () => SelectOptionModel<InvitedUserModel>[]
}

const EXISTING: SelectOptionModel<UserModel> = { label: 'ada@x.test', value: { id: 'u1', email: 'ada@x.test' } as UserModel }

describe( 'ProjectProfileInvitationFieldsComponent', () => {
    let searchUsers: Mock<(q: string, projectId: string | undefined) => void>
    let fetchFeatures: Mock<() => void>
    let inviteByEmailEnabled: WritableSignal<boolean>
    let searched: WritableSignal<SelectOptionModel<UserModel>[]>

    function create (projectId: string | undefined = undefined): FieldsApi {
        searchUsers = vi.fn()
        fetchFeatures = vi.fn()
        inviteByEmailEnabled = signal( true )
        searched = signal( [] )
        TestBed.configureTestingModule( {
            providers: [
                {
                    provide: ProjectProfileFacade,
                    useValue: { searchUsers, fetchFeatures, inviteByEmailEnabled, searchedUsersMetadata: searched, selectedProjectId: (): string => 'selected' },
                },
                { provide: TranslocoService, useValue: { translate: (key: string, params: { email: string }): string => `${key}:${params.email}` } },
            ],
        } )
        TestBed.overrideComponent( ProjectProfileInvitationFieldsComponent, { set: { template: '', imports: [] } } )
        const fixture: ComponentFixture<ProjectProfileInvitationFieldsComponent> = TestBed.createComponent( ProjectProfileInvitationFieldsComponent )
        fixture.componentRef.setInput( 'fields', {} )
        fixture.componentRef.setInput( 'projectId', projectId )
        return fixture.componentInstance as unknown as FieldsApi
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    it( 'loads the enabled features when it is created', () => {
        // Arrange & Act
        create()

        // Assert
        expect( fetchFeatures ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'searches the users to invite into the given project', () => {
        // Arrange
        const component: FieldsApi = create( 'created' )

        // Act
        component.handleSearch( { query: 'ada' } )

        // Assert
        expect( searchUsers ).toHaveBeenCalledWith( 'ada', 'created' )
    } )

    it( 'searches them into the selected project when no project is given', () => {
        // Arrange
        const component: FieldsApi = create( undefined )

        // Act
        component.handleSearch( { query: 'ada' } )

        // Assert
        expect( searchUsers ).toHaveBeenCalledWith( 'ada', 'selected' )
    } )

    it( 'offers to invite by email an address that matches no user', () => {
        // Arrange
        const component: FieldsApi = create()

        // Act
        component.handleSearch( { query: ' new@x.test ' } )

        // Assert
        expect( component.suggestions().map( (item: SelectOptionModel<InvitedUserModel>): string => item.label! ) )
            .toEqual( [ 'project-profiles.form.users.invite:new@x.test' ] )
        expect( component.suggestions()[ 0 ].value ).toEqual( expect.objectContaining( { email: 'new@x.test' } ) )
    } )

    it( 'keeps the found users and appends the invitation to them', () => {
        // Arrange
        const component: FieldsApi = create()
        searched.set( [ EXISTING ] )

        // Act
        component.handleSearch( { query: 'new@x.test' } )

        // Assert
        expect( component.suggestions() ).toHaveLength( 2 )
        expect( component.suggestions()[ 0 ] ).toBe( EXISTING )
    } )

    it( 'does not offer to invite by email when the feature is disabled', () => {
        // Arrange
        const component: FieldsApi = create()
        inviteByEmailEnabled.set( false )

        // Act
        component.handleSearch( { query: 'new@x.test' } )

        // Assert
        expect( component.suggestions() ).toEqual( [] )
    } )

    it( 'does not offer to invite something that is not an email address', () => {
        // Arrange
        const component: FieldsApi = create()

        // Act
        component.handleSearch( { query: 'ada' } )

        // Assert
        expect( component.suggestions() ).toEqual( [] )
    } )

    it( 'does not offer to invite an address that already matches a found user', () => {
        // Arrange
        const component: FieldsApi = create()
        searched.set( [ EXISTING ] )

        // Act
        component.handleSearch( { query: 'ADA@x.test' } )

        // Assert
        expect( component.suggestions() ).toEqual( [ EXISTING ] )
    } )
} )
