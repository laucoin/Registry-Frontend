import { Component, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { beforeEach, describe, expect, it } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { ProjectEyebrowDirective } from '@shared/directives/project-eyebrow.directive'
import { ProjectModel } from '@shared/models/model/project.model'

@Component( {
    imports: [ ProjectEyebrowDirective ],
    template: '<div appProjectEyebrow></div>',
} )
class HostComponent {}

describe( 'ProjectEyebrowDirective', () => {
    let selectedProject: WritableSignal<ProjectModel | undefined>
    let fixture: ComponentFixture<HostComponent>

    beforeEach( () => {
        selectedProject = signal<ProjectModel | undefined>( undefined )
        TestBed.configureTestingModule( { providers: [ { provide: SessionFacade, useValue: { selectedProject } } ] } )
        fixture = TestBed.createComponent( HostComponent )
    } )

    it( 'sets the eyebrow to the name of the selected project', async () => {
        // Arrange
        selectedProject.set( { name: 'Summer camp' } as ProjectModel )

        // Act
        await fixture.whenStable()

        // Assert
        expect( fixture.nativeElement.querySelector( 'div' ).getAttribute( 'eyebrow' ) ).toBe( 'Summer camp' )
    } )

    it( 'leaves the eyebrow empty when no project is selected', async () => {
        // Arrange
        selectedProject.set( undefined )

        // Act
        await fixture.whenStable()

        // Assert
        expect( fixture.nativeElement.querySelector( 'div' ).hasAttribute( 'eyebrow' ) ).toBe( false )
    } )
} )
