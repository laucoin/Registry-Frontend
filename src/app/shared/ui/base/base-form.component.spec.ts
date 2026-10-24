import { Location } from '@angular/common'
import { createEnvironmentInjector, EnvironmentInjector, runInInjectionContext, signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree, form, required, SchemaPathTree } from '@angular/forms/signals'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { Observable, Subject, of, throwError } from 'rxjs'
import { RegistryConfig } from '@core/config/registry.config'
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
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

}

class TestDialogForm extends TestForm {
    protected override readonly closesToParentRoute: boolean = true
}

describe( 'BaseFormComponent', () => {
    let back: Mock<() => void>
    let navigateByUrl: Mock<(url: string) => Promise<boolean>>
    let navigate: Mock<(commands: string[]) => Promise<boolean>>

    function create (): TestForm {
        return TestBed.runInInjectionContext( (): TestForm => new TestForm() )
    }

    beforeEach( () => {
        back = vi.fn()
        navigateByUrl = vi.fn( () => Promise.resolve( true ) )
        navigate = vi.fn( () => Promise.resolve( true ) )
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] }, hosting: { providerName: null, providerAddress: null } }
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        TestBed.configureTestingModule( {
            providers: [
                { provide: Location, useValue: { back } },
                { provide: Router, useValue: { navigateByUrl, navigate } },
                { provide: ActivatedRoute, useValue: {} },
                { provide: SessionFacade, useValue: autoMock() },
                { provide: UiFacade, useValue: autoMock() },
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

    it.each( [
        [ 'a create route of one segment', [ { path: 'create' } ], [ '..' ] ],
        [ 'an edit route of two segments', [ { path: 'v1' }, { path: 'edit' } ], [ '../..' ] ],
        [ 'a route without segment', [], [ '..' ] ],
    ] )( 'closes a dialog form on the parent route from %s', (_label: string, url: object[], expected: string[]) => {
        // Arrange : le cas vient de la table
        TestBed.overrideProvider( ActivatedRoute, { useValue: { snapshot: { url } } } )
        const form: TestDialogForm = TestBed.runInInjectionContext( (): TestDialogForm => new TestDialogForm() )

        // Act
        form.run( of( 'saved' ) )

        // Assert
        expect( navigate.mock.calls[ 0 ][ 0 ] ).toEqual( expected )
        expect( back ).not.toHaveBeenCalled()
    } )

    it( 'goes to the given route instead of the parent one', () => {
        // Arrange
        TestBed.overrideProvider( ActivatedRoute, { useValue: { snapshot: { url: [ { path: 'create' } ] } } } )
        const form: TestDialogForm = TestBed.runInInjectionContext( (): TestDialogForm => new TestDialogForm() )

        // Act
        form.goTo( RegistryRouteEnum.PROJECTS )

        // Assert
        expect( navigateByUrl ).toHaveBeenCalledWith( RegistryRouteEnum.PROJECTS )
        expect( navigate ).not.toHaveBeenCalled()
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
} )
