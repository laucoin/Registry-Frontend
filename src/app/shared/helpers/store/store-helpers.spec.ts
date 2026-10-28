import { createEnvironmentInjector, EnvironmentInjector, runInInjectionContext } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { describe, expect, it } from 'vitest'
import { ProfileResetService } from '@shared/helpers/store/profile-reset.service'
import { selectState } from '@shared/helpers/store/state-observable.helper'
import { TestCounterStore } from '@shared/helpers/store/testing/test-counter.store'
import { TestProfileStore } from '@shared/helpers/store/testing/test-profile.store'

describe( 'withProfileScope', () => {
    it( 'resets the store on a profile switch', () => {
        // Arrange
        const store: InstanceType<typeof TestProfileStore> = TestBed.configureTestingModule( { providers: [ TestProfileStore ] } ).inject( TestProfileStore )
        store.add( 'a' )

        // Act
        TestBed.inject( ProfileResetService ).resetAll()

        // Assert
        expect( store.items() ).toEqual( [] )
    } )

    it( 'keeps the data the store chose to preserve', () => {
        // Arrange
        const store: InstanceType<typeof TestProfileStore> = TestBed.configureTestingModule( { providers: [ TestProfileStore ] } ).inject( TestProfileStore )
        store.setLanguage( 'en' )

        // Act
        TestBed.inject( ProfileResetService ).resetAll()

        // Assert
        expect( store.language() ).toBe( 'en' )
    } )

    it( 'stops resetting a store once it is destroyed', () => {
        // Arrange
        TestBed.configureTestingModule( { providers: [ TestProfileStore ] } )
        const injector: EnvironmentInjector = createEnvironmentInjector( [ TestProfileStore ], TestBed.inject( EnvironmentInjector ) )
        const store: InstanceType<typeof TestProfileStore> = injector.get( TestProfileStore )
        store.add( 'a' )

        // Act
        injector.destroy()
        TestBed.inject( ProfileResetService ).resetAll()

        // Assert
        expect( store.items() ).toEqual( [ 'a' ] )
    } )
} )

describe( 'ProfileResetService', () => {
    it( 'runs every registered reset and none after its unregistration', () => {
        // Arrange
        const service: ProfileResetService = TestBed.inject( ProfileResetService )
        const calls: string[] = []
        const unregisterFirst: () => void = service.register( (): number => calls.push( 'first' ) )
        service.register( (): number => calls.push( 'second' ) )

        // Act
        service.resetAll()
        unregisterFirst()
        service.resetAll()

        // Assert
        expect( calls ).toEqual( [ 'first', 'second', 'second' ] )
    } )
} )

describe( 'selectState', () => {
    it( 'emits the current value on subscribe, then each distinct change', () => {
        // Arrange
        const store: InstanceType<typeof TestCounterStore> = TestBed.inject( TestCounterStore )
        const received: number[] = []
        const observable: ReturnType<typeof selectState<{ count: number, other: number }, number>> = TestBed.runInInjectionContext(
            () => selectState( store as never, (state: { count: number, other: number }): number => state.count ),
        )
        observable.subscribe( (value: number): number => received.push( value ) )

        // Act
        store.setCount( 1 )
        store.setOther( 5 )
        store.setCount( 2 )

        // Assert
        expect( received ).toEqual( [ 0, 1, 2 ] )
    } )

    it( 'stops watching once the subscriber unsubscribes', () => {
        // Arrange
        const store: InstanceType<typeof TestCounterStore> = TestBed.inject( TestCounterStore )
        const received: number[] = []
        const subscription: { unsubscribe: () => void } = runInInjectionContext( TestBed.inject( EnvironmentInjector ),
            () => selectState( store as never, (state: { count: number, other: number }): number => state.count ) ).subscribe( (value: number): number => received.push( value ) )

        // Act
        subscription.unsubscribe()
        store.setCount( 9 )

        // Assert
        expect( received ).toEqual( [ 0 ] )
    } )
} )
