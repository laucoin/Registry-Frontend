import { Component, inject, OnDestroy } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { UserModel } from '../../../shared/util-model/model/user.model'
import { AppRouteEnum } from '../../../app-route.enum'
import { UserFacade } from '../data/state/user.facade'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'
import { Button } from 'primeng/button'
import { Card } from 'primeng/card'
import { FormComponent } from '../../../shared/util-ui/form/form.component'
import { RegistryRequiredDirective } from '../../../shared/util-tool/directive/registry-required.directive'
import { TranslatePipe } from '@ngx-translate/core'
import { Select } from 'primeng/select'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { UserDto } from '../../../shared/util-model/dto/user.dto'
import { filter, map } from 'rxjs'
import { FormUtil } from '../../../shared/util-tool/util/form.util'

@Component( {
    selector: 'app-user-form',
    standalone: true,
    imports: [
        Button,
        Card,
        FormComponent,
        FormsModule,
        RegistryRequiredDirective,
        TranslatePipe,
        Select,
        ReactiveFormsModule,
    ],
    templateUrl: './user-form.component.html',
} )
export class UserFormComponent extends GenericFormComponent<UserModel, UserDto> implements OnDestroy {
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
            this.router.navigateByUrl( AppRouteEnum.USERS ).catch( console.error )
        } else {
            this.facade.fetchAssignableRoles()
            this.facade.fetchUser( this.idParam! )
        }
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            role: this.formBuilder.control( {} ),
        } )
    }

    protected handleLoadedElement (): void {
        this.subscriptions.add(
            this.facade.user$.pipe(
                filter( (user: UserModel | undefined): boolean => GenericUtil.nonNull( user ) ),
                map( (user: UserModel | undefined): void => this.fillForm( user! ) ),
            ).subscribe(),
        )
    }

    protected fillForm (element: UserModel): void {
        this.role.patchValue( element.role )
    }

    protected submit (): void {
        if (!FormUtil.isFormValid( this.form )) {
            console.warn( this.invalidFormMessage, this.form.value )
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
