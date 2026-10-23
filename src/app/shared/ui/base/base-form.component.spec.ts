import { Location } from '@angular/common'
import { createEnvironmentInjector, EnvironmentInjector, runInInjectionContext, signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree, form, required, SchemaPathTree } from '@angular/forms/signals'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { Observable, Subject, of, throwError } from 'rxjs'
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures'
import { ErrorModel } from '@shared/models/model/error.model'
import { BaseFormComponent } from '@shared/ui/base/base-form.component'

class TestForm extends BaseFormComponent {
    public readonly calls: string[] = []

    public constructor () {
        super()
    }

    protected loadData (): void {
        this.calls.push( 'loadData' )
    }

    protected handleLoadedElement (): void {
        this.calls.push( 'handleLoadedElement' )
    }

    protected submit (): void {
        this.calls.push( 'submit' )
    }

    protected get idParam (): string | undefined {
        return undefined
    }

    public run<T> (command: Observable<T>, redirect?: boolean): void {
        this.save( command, redirect )
    }

    public get flags (): { saving: boolean, error: ErrorModel | undefined } {
        return { saving: this.saving(), error: this.error() }
    }

    public goTo (route?: RegistryRouteEnum): void {
        this.navigateToRedirectUri( route )
    }

    public checkValidity<T> (form: FieldTree<T>): boolean {
        return this.isFormValid( form )
    }

    public warnAbout (value: unknown): void {
        this.logInvalidForm( value )
    }
}

describe( 'BaseFormComponent', () => {
    let back: Mock<() => void>
    let navigateByUrl: Mock<(url: string) => Promise<boolean>>

    function create (): TestForm {
        return TestBed.runInInjectionContext( (): TestForm => new TestForm() )
    }

    beforeEach( () => {
        back = vi.fn()
        navigateByUrl = vi.fn( () => Promise.resolve( true ) )
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] } }
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        TestBed.configureTestingModule( {
            providers: [
                { provide: Location, useValue: { back } },
                { provide: Router, useValue: { navigateByUrl } },
                { provide: ActivatedRoute, useValue: {} },
                { provide: SessionFacade, useValue: autoMock() },
                { provide: UiFacade, useValue: autoMock() },
                { provide: RegistryFacade, useValue: autoMock() },
                { provide: CustomDateFormatPipe, useValue: { transform: (value: { date?: string } | undefined): string => value?.date ?? '' } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}` } },
            ],
        } )
    } )

    afterEach( () => {
        vi.restoreAllMocks()
    } )

    it( 'judges a signal form valid only once its rules pass, and reveals the errors', () => {
        // Arrange
        const page: TestForm = create()
        const model: WritableSignal<{ name: string }> = signal( { name: '' } )
        const tree: FieldTree<{ name: string }> = TestBed.runInInjectionContext( () => form( model, (path: SchemaPathTree<{ name: string }>): void => required( path.name ) ) )

        // Act
        const whenEmpty: boolean = page.checkValidity( tree )
        const touchedAfterCheck: boolean = tree.name().touched()
        model.set( { name: 'Ada' } )

        // Assert
        expect( [ whenEmpty, touchedAfterCheck, page.checkValidity( tree ) ] ).toEqual( [ false, true, true ] )
    } )

    it( 'goes back once a save succeeds', () => {
        // Arrange
        const form: TestForm = create()

        // Act
        form.run( of( 'saved' ) )

        // Assert
        expect( back ).toHaveBeenCalledTimes( 1 )
        expect( form.flags.saving ).toBe( false )
    } )

    it( 'stays on the form when the redirect is switched off', () => {
        // Arrange
        const form: TestForm = create()

        // Act
        form.run( of( 'saved' ), false )

        // Assert
        expect( back ).not.toHaveBeenCalled()
    } )

    it( 'shows the saving state while the command runs', () => {
        // Arrange
        const form: TestForm = create()
        const pending: Subject<string> = new Subject<string>()
        form.run( pending )
        const whileSaving: boolean = form.flags.saving

        // Act
        pending.complete()

        // Assert
        expect( whileSaving ).toBe( true )
        expect( form.flags.saving ).toBe( false )
    } )

    it( 'keeps the error of a failed save for display and does not leave the page', () => {
        // Arrange
        const form: TestForm = create()

        // Act
        form.run( throwError( (): ErrorModel => ERROR_500 ) )

        // Assert
        expect( form.flags.error ).toBe( ERROR_500 )
        expect( back ).not.toHaveBeenCalled()
    } )

    it( 'clears the previous error when saving again', () => {
        // Arrange
        const form: TestForm = create()
        form.run( throwError( (): ErrorModel => ERROR_500 ) )

        // Act
        form.run( of( 'saved' ), false )

        // Assert
        expect( form.flags.error ).toBeUndefined()
    } )

    it( 'finishes a save sent before the page was left but skips the redirect', () => {
        // Arrange
        const injector: EnvironmentInjector = createEnvironmentInjector( [], TestBed.inject( EnvironmentInjector ) )
        const form: TestForm = runInInjectionContext( injector, (): TestForm => new TestForm() )
        const pending: Subject<string> = new Subject<string>()
        form.run( pending )

        // Act
        injector.destroy()
        pending.next( 'saved' )

        // Assert
        expect( back ).not.toHaveBeenCalled()
        expect( form.flags.saving ).toBe( true )
    } )

    it( 'navigates to the given route and falls back to the previous page when it fails', async () => {
        // Arrange
        const form: TestForm = create()
        navigateByUrl.mockReturnValueOnce( Promise.reject( new Error( 'no route' ) ) )

        // Act
        form.goTo( RegistryRouteEnum.PROJECTS )
        await Promise.resolve()
        await Promise.resolve()

        // Assert
        expect( navigateByUrl ).toHaveBeenCalledWith( RegistryRouteEnum.PROJECTS )
        expect( back ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'logs an invalid form outside production only', () => {
        // Arrange
        const form: TestForm = create()
        const warn: ReturnType<typeof vi.spyOn> = vi.spyOn( console, 'warn' ).mockImplementation( (): void => undefined )

        // Act
        form.warnAbout( { a: 1 } )
        RegistryConfig.environment.production = true
        form.warnAbout( { a: 2 } )

        // Assert
        expect( warn ).toHaveBeenCalledTimes( 1 )
    } )
} )
