import { FormControl, FormGroup } from '@angular/forms'
import { GenericComponent } from '@shared/ui/base/generic.component'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { Observable, Subscription } from 'rxjs'
import { ErrorModel } from '@shared/models/model/error.model'
import { withLoading } from '@shared/helpers/util/rx.util'
import { ProjectModel } from '@shared/models/model/project.model'
import { RegistryValidators } from '@shared/helpers/util/registry.validator'
import { DestroyRef, inject, signal, WritableSignal } from '@angular/core'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { Location } from '@angular/common'
import { GenericUtil } from '@shared/helpers/util/generic.util'
import { RegistryConfig } from '@core/config/registry.config'

export abstract class GenericFormComponent<M, D> extends GenericComponent {
    protected readonly datePipe: CustomDateFormatPipe = inject( CustomDateFormatPipe )
    private readonly location: Location = inject( Location )

    protected readonly subscriptions: Subscription = new Subscription()

    protected readonly loading: WritableSignal<boolean> = signal( false )
    protected readonly saving: WritableSignal<boolean> = signal( false )
    protected readonly error: WritableSignal<ErrorModel | undefined> = signal( undefined )

    private destroyed: boolean = false

    protected readonly invalidFormMessage: string = this.translateService.instant( 'global.messages.invalid-form' )
    protected readonly startDateExample: Date = GenericFormComponent.startDateExample
    protected readonly endDateExample: Date = GenericFormComponent.endDateExample

    protected constructor () {
        super()
        inject( DestroyRef ).onDestroy( (): void => {
            this.destroyed = true
        } )
    }

    // Deliberately not tied to the component lifetime: once sent, a save must finish (toast, list refresh)
    // even if the user navigates away; only the redirect is skipped.
    protected save<T> (command: Observable<T>, redirect: boolean = true): void {
        this.error.set( undefined )
        command.pipe( withLoading( this.saving ) ).subscribe( {
            next: (): void => {
                if (redirect && !this.destroyed) this.navigateToRedirectUri()
            },
            error: (error: ErrorModel): void => this.error.set( error ),
        } )
    }

    // Form values may carry participants' personal data — kept out of the console in production.
    protected logInvalidForm (value: unknown): void {
        if (!RegistryConfig.environment.production) console.warn( this.invalidFormMessage, value )
    }

    private static get startDateExample (): Date {
        const now: Date = new Date()

        if (now.getMonth() > 6) {
            now.setFullYear( now.getFullYear() + 1 )
        }

        now.setMonth( 6, 20 )
        now.setHours(
            Math.floor( Math.random() * 23 ),
            Math.floor( Math.random() * 59 ),
        )
        return now
    }

    private static get endDateExample (): Date {
        const now: Date = this.startDateExample
        now.setMonth( 7, 2 )
        now.setHours(
            Math.floor( Math.random() * 23 ),
            Math.floor( Math.random() * 59 ),
        )
        return now
    }

    protected abstract loadData (): void

    protected abstract initForm (): FormGroup

    protected abstract handleLoadedElement (): void

    protected addProjectDateValidators (
        project: ProjectModel | undefined,
        control: FormControl,
    ): void {
        if (project?.begin) {
            control.addValidators( RegistryValidators.minDateTime(
                project?.begin,
                this.datePipe.transform( project?.begin ),
            ) )
        }
        if (project?.end) {
            control.addValidators( RegistryValidators.maxDateTime(
                project?.end,
                this.datePipe.transform( project?.end ),
            ) )
        }
    }

    protected abstract fillForm (element: M | undefined): void

    protected abstract submit (): void

    protected abstract buildDto (): D

    protected navigateToRedirectUri (route: RegistryRouteEnum | undefined = undefined): void {
        if (GenericUtil.nonNull( route )) this.router.navigateByUrl( route! ).catch( (): void => this.location.back() )
        else this.location.back()
    }

    protected abstract get idParam (): string | undefined
}
