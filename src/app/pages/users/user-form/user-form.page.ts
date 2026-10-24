import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal, signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { UserModel } from '@shared/models/model/user.model'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { UserFacade } from '@pages/users/data/state/user.facade'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/option'
import '@sgdf/ui/select'
import { FieldErrorDirective } from '@shared/directives/field-error.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { FormDialogComponent } from '@shared/ui/common/form-dialog/form-dialog.component'
import { BaseFormComponent } from '@shared/ui/base/base-form.component'
import { filter, map } from 'rxjs'
import { NotificationModel } from '@shared/models/model/notification.model'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'
import { createUserForm, toUserFormModel, UserFormModel } from '@pages/users/user-form/user.form'

/**
 * Purpose: Dialog page with the form to edit a user, opened over the users list.
 * Scope: Builds the form, submits it through the facade and navigates back; shows the failure of the user or roles load instead of the form.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component( {
    selector: 'app-user-form',
    imports: [
        FormDialogComponent,
        SgdfFieldDirective,
        FieldErrorDirective,
        TranslocoPipe,
        FormField,
        SectionErrorComponent,
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    templateUrl: './user-form.page.html',
} )
export class UserFormPage extends BaseFormComponent {
    protected override readonly closesToParentRoute: boolean = true
    protected readonly facade: UserFacade = inject( UserFacade )

    protected readonly model: WritableSignal<UserFormModel> = signal( toUserFormModel() )
    protected readonly form: FieldTree<UserFormModel> = createUserForm( this.model )
    protected readonly loadError: Signal<NotificationModel | undefined> = computed( (): NotificationModel | undefined =>
        this.facade.userError() ?? this.facade.metadataErrors()[ 'assignableRoles' ],
    )

    public constructor () {
        super()

        this.destroyRef.onDestroy( (): void => this.facade.resetUser() )

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData (): void {
        this.facade.resetUser()

        if (!this.idParam) {
            this.router.navigateByUrl( RegistryRouteEnum.USERS ).catch( console.error )
        } else {
            this.facade.fetchAssignableRoles()
            this.facade.fetchUser( this.idParam! )
        }
    }

    protected handleLoadedElement (): void {
        this.facade.user$.pipe(
                filter( (user: UserModel | undefined): boolean => GenericHelper.nonNull( user ) ),
                map( (user: UserModel | undefined): void => this.fillForm( user! ) ),
            ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe()
    }

    protected fillForm (element: UserModel): void {
        this.model.set( toUserFormModel( element ) )
    }

    protected submit (): void {
        if (!this.isFormValid( this.form )) {
            this.logInvalidForm( this.model() )
            return
        }

        this.save( this.facade.updateUserRole( this.facade.user()!.id, this.model().role ) )
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['userId']
    }
}
