import { Component, signal, WritableSignal } from '@angular/core'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { Observable } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { UserModel } from '../../../shared/util-model/model/user.model'
import { AppRouteEnum } from '../../../app-route.enum'
import { UserFacade } from '../data/state/user.facade'
import { StringUtils } from '../../../shared/util-tool/util/string.util'
import { Params } from '@angular/router'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'
import { FormUtil } from '../../../shared/util-tool/util/form.util'
import { AsyncPipe } from '@angular/common'
import { Button } from 'primeng/button'
import { Card } from 'primeng/card'
import { FormComponent } from '../../../shared/util-ui/form/form.component'
import { RegistryRequiredDirective } from '../../../shared/util-tool/directive/registry-required.directive'
import { TranslatePipe } from '@ngx-translate/core'
import { Select } from 'primeng/select'

@Component( {
    selector: 'app-user-form',
    imports: [
        AsyncPipe,
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
export class UserFormComponent extends GenericFormComponent {
    protected readonly assignableRoles$: Observable<SelectItem<string>[]>
    protected readonly user: WritableSignal<UserModel | undefined> = signal( undefined )

    public constructor (protected readonly facade: UserFacade) {
        super(
            AppRouteEnum.USERS,
            facade.userLoading,
        )

        facade.resetUser()

        this.handleIdParam()
        this.handleLoadedUser()

        this.assignableRoles$ = facade.assignableRolesMetadata
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            role: this.formBuilder.control( {} ),
        } )
    }

    private handleIdParam (): void {
        if (!StringUtils.isRouteActive( AppRouteEnum.USERS )) {
            return
        }
        this.subscriptions.add(
            this.route.params.subscribe( (params: Params): void => {
                if (GenericUtil.isNull( params['id'] )) {
                    this.router.navigateByUrl( this.buildUri( AppRouteEnum.USERS ) ).catch( console.error )
                } else {
                    this.facade.fetchUser( params['id'] )
                }
            } ),
        )
    }

    private handleLoadedUser (): void {
        this.subscriptions.add(
            this.facade.user?.subscribe( (user: UserModel | undefined): void => {
                this.user.set( user )
                if (!user) return
                this.role.setValue( user.role )
                FormUtil.markAllControlsAsDirty( this.form )
            } ),
        )
    }

    protected next (): void {
        this.subscriptions.add(
            this.facade.updateUserRole(
                this.user()!.id,
                this.role.value,
            ).subscribe( (): void => this.navigateToRedirectUri() ),
        )
    }

    protected get role (): FormControl {
        return this.form.get( 'role' ) as FormControl
    }
}
