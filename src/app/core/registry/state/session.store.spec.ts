import { TestBed } from '@angular/core/testing'
import { beforeEach, describe, expect, it } from 'vitest'
import { SessionStore } from '@core/registry/state/session.store'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'

describe( 'SessionStore', () => {
    let store: InstanceType<typeof SessionStore>

    beforeEach( () => {
        store = TestBed.inject( SessionStore )
    } )

    it( 'updates the theme of the current user only when a user is set', () => {
        // Arrange
        store.setCurrentUserTheme( 'DARK' )
        store.setCurrentUser( { id: 'u1', preferences: { theme: 'LIGHT', language: 'fr' } } as CurrentUserModel )

        // Act
        store.setCurrentUserTheme( 'DARK' )

        // Assert
        expect( store.currentUser()?.preferences.theme ).toBe( 'DARK' )
    } )

    it( 'forgets the user and the project on reset', () => {
        // Arrange
        store.setCurrentUser( { id: 'u1' } as CurrentUserModel )
        store.setCurrentProject( 'p1', { id: 'pp1' } as ProjectProfileModel )

        // Act
        store.reset()

        // Assert
        expect( store.currentUser() ).toBeUndefined()
        expect( store.currentProject.id() ).toBeUndefined()
    } )

    it( 'raises and lowers the action loader', () => {
        // Arrange
        store.startActionLoader()
        const whileRunning: boolean = store.actionLoading()

        // Act
        store.stopActionLoader()

        // Assert
        expect( whileRunning ).toBe( true )
        expect( store.actionLoading() ).toBe( false )
    } )
} )
