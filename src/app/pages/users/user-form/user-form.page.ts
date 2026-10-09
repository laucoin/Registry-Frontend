import { Component, inject, OnDestroy, signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { UserModel } from '@shared/models/model/user.model'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { UserFacade } from '@pages/users/data/state/user.facade'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { Button } from 'primeng/button'
import { Card } from 'primeng/card'
import { FormComponent } from '@shared/ui/common/form/form.component'
import { RegistryRequiredDirective } from '@shared/directives/registry-required.directive'
import {TranslocoPipe} from '@jsverse/transloco'
import { Select } from 'primeng/select'
import { BaseFormComponent } from '@shared/ui/base/base-form.component'
import { filter, map } from 'rxjs'
import { FieldErrorComponent } from '@shared/ui/common/field-error/field-error.component'
import { createUserForm, toUserFormModel, UserFormModel } from '@pages/users/user-form/user.form'

/**
 * Purpose: Page with the form to create or edit a user.
 * Scope: Builds the form, submits it through the facade and navigates back.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component( {
    selector: 'app-user-form',
    imports: [
        Button,
        Card,
        FormComponent,
        RegistryRequiredDirective,
        TranslocoPipe,
        Select,
        FormField,
        FieldErrorComponent,
    ],
    templateUrl: './user-form.page.html',
} )
export class UserFormPage extends BaseFormComponent implements OnDestroy {
    protected readonly facade: UserFacade = inject( UserFacade )

    protected readonly model: WritableSignal<UserFormModel> = signal( toUserFormModel() )
    protected readonly form: FieldTree<UserFormModel> = createUserForm( this.model )

    public constructor () {
        super()

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
        this.subscriptions.add(
            this.facade.user$.pipe(
                filter( (user: UserModel | undefined): boolean => GenericHelper.nonNull( user ) ),
                map( (user: UserModel | undefined): void => this.fillForm( user! ) ),
            ).subscribe(),
        )
    }

    protected fillForm (element: UserModel): void {
        this.model.set( toUserFormModel( element ) )
    }

    protected submit (): void {
        if (!this.isFormValid( this.form )) {
            this.logInvalidForm( this.model() )
            return
        }

        this.subscriptions.add(
            this.facade.updateUserRole(
                this.facade.user()!.id,
                this.model().role,
            ).subscribe( (): void => this.navigateToRedirectUri() ),
        )
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['userId']
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
