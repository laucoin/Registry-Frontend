import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileInvitationFieldsComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-invitation-fields/project-profile-invitation-fields.component'

interface FieldsApi {
    handleSearch: (searched: { query: string }) => void
}

describe( 'ProjectProfileInvitationFieldsComponent', () => {
    let searchUsers: Mock<(q: string, projectId: string | undefined) => void>

    function create (projectId: string | undefined): FieldsApi {
        searchUsers = vi.fn()
        TestBed.configureTestingModule( {
            providers: [ { provide: ProjectProfileFacade, useValue: { searchUsers, selectedProjectId: (): string => 'selected' } } ],
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
} )
