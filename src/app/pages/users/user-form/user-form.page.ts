import { Component, inject, OnDestroy } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { UserModel } from '@shared/models/model/user.model'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { UserFacade } from '@pages/users/data/state/user.facade'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { Button } from 'primeng/button'
import { Card } from 'primeng/card'
import { FormComponent } from '@shared/ui/form/form.component'
import { RegistryRequiredDirective } from '@shared/directives/registry-required.directive'
import { TranslatePipe } from '@ngx-translate/core'
import { Select } from 'primeng/select'
import { GenericFormComponent } from '@shared/ui/base/generic-form.component'
import { UserDto } from '@shared/models/dto/user.dto'
import { filter, map } from 'rxjs'
import { FormHelper } from '@shared/helpers/form.helper'
import { FormFieldErrorComponent } from '@shared/ui/form-field-error/form-field-error.component'

@Component( {
    selector: 'app-user-form',
    imports: [
        Button,
        Card,
        FormComponent,
        FormsModule,
        RegistryRequiredDirective,
        TranslatePipe,
        Select,
        ReactiveFormsModule,
        FormFieldErrorComponent,
    ],
    templateUrl: './user-form.page.html',
} )
export class UserFormPage extends GenericFormComponent<UserModel, UserDto> implements OnDestroy {
    protected readonly facade: UserFacade = inject( UserFacade )

    protected readonly form: FormGroup

    public constructor () {
        super()

        this.form = this.initForm()

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

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            role: this.formBuilder.control( undefined, [ Validators.required ] ),
        } )
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
        this.role.patchValue( element.role?.value )
    }

    protected submit (): void {
        if (!FormHelper.isFormValid( this.form )) {
            this.logInvalidForm( this.form.value )
            return
        }

        this.subscriptions.add(
            this.facade.updateUserRole(
                this.facade.user()!.id,
                this.role.value,
            ).subscribe( (): void => this.navigateToRedirectUri() ),
        )
    }

    protected buildDto (): UserDto {
        throw new Error( this.translateService.instant( 'global.messages.not-implemented' ) )
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['userId']
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected get role (): FormControl {
        return this.form.get( 'role' ) as FormControl
    }
}
