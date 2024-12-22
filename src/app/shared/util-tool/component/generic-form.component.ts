import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { GenericComponent } from './generic.component'
import { FormBuilder, FormGroup } from '@angular/forms'
import { FormUtil } from '../util/form.util'
import { AppRouteEnum } from '../../../app-route.enum'
import { combineLatest, map, Observable, of } from 'rxjs'
import { ToastMessageOptions } from 'primeng/api'

@Component( {
    template: '',
} )
export abstract class GenericFormComponent extends GenericComponent {
    @Input() public redirect: boolean = true
    @Output() public handleSubmit: EventEmitter<void> = new EventEmitter<void>()

    protected readonly formBuilder: FormBuilder = inject( FormBuilder )

    protected readonly loading$: Observable<boolean> = of( false )
    protected readonly error$: Observable<ToastMessageOptions | undefined> = of( undefined )

    protected form: FormGroup

    protected constructor (
        private readonly defaultRedirectPath: AppRouteEnum,
        loading$: Observable<boolean> = of( false ),
        error$: Observable<ToastMessageOptions | undefined> = of( undefined ),
    ) {
        super()

        this.form = this.initForm()
        this.loading$ = combineLatest( [ loading$, this.contextEventLoading$ ] ).pipe(
            map( ([ loading, contextEventLoading ]: [ boolean, boolean ]): boolean => loading || contextEventLoading ),
        )
        this.error$ = combineLatest( [ error$, this.contextEventError$ ] ).pipe(
            map( ([ error, contextEventError ]: [ ToastMessageOptions | undefined, ToastMessageOptions | undefined ]): ToastMessageOptions | undefined => error ?? contextEventError ),
        )

        this.fetchContextEventOnEventIdChange()
    }

    protected abstract initForm (): FormGroup

    protected submit (): void {
        if (this.isFormValid()) {
            this.handleSubmit.emit()
            this.next()
        } else {
            console.warn( this.translateService.instant( 'warning.message.invalid-form' ) )
        }
    }

    protected abstract next (): void

    protected get redirectPath (): string {
        return this.route.snapshot.queryParamMap.get( 'redirectPath' ) ?? this.defaultRedirectPath.toString()
    }

    protected navigateToRedirectUri (): void {
        if (this.redirect) {
            this.router.navigateByUrl( this.buildUri( this.redirectPath ) ).catch( console.error )
        }
    }

    protected isFormValid (): boolean {
        FormUtil.markAllControlsAsDirty( this.form )
        return !this.form.invalid
    }
}
