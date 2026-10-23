import { Location } from '@angular/common'
import { createEnvironmentInjector, EnvironmentInjector, runInInjectionContext } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { TestBed } from '@angular/core/testing'
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
import { ProjectModel } from '@shared/models/model/project.model'
import { GenericFormComponent } from '@shared/ui/base/generic-form.component'

class TestForm extends GenericFormComponent<object, object> {
    public readonly calls: string[] = []

    public constructor () {
        super()
    }

    protected loadData (): void {
        this.calls.push( 'loadData' )
    }

    protected initForm (): FormGroup {
        return new FormGroup( {} )
    }

    protected handleLoadedElement (): void {
        this.calls.push( 'handleLoadedElement' )
    }

    protected fillForm (): void {
        this.calls.push( 'fillForm' )
    }

    protected submit (): void {
        this.calls.push( 'submit' )
    }

    protected buildDto (): object {
        return {}
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

    public validatorsFor (project: ProjectModel | undefined, control: FormControl): void {
        this.addProjectDateValidators( project, control )
    }

    public warnAbout (value: unknown): void {
        this.logInvalidForm( value )
    }
}

describe( 'GenericFormComponent', () => {
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

    it( 'adds the project dates as bounds of a date control', () => {
        // Arrange
        const form: TestForm = create()
        const control: FormControl = new FormControl( { date: '2026-06-01', time: '10:00:00' } )
        const project: ProjectModel = { begin: { date: '2026-07-01', time: undefined }, end: { date: '2026-07-31', time: undefined } } as ProjectModel

        // Act
        form.validatorsFor( project, control )
        control.updateValueAndValidity()

        // Assert
        expect( control.valid ).toBe( false )
    } )

    it( 'adds no bound for a project without dates', () => {
        // Arrange
        const form: TestForm = create()
        const control: FormControl = new FormControl( { date: '2026-06-01', time: '10:00:00' } )

        // Act
        form.validatorsFor( {} as ProjectModel, control )
        control.updateValueAndValidity()

        // Assert
        expect( control.valid ).toBe( true )
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
