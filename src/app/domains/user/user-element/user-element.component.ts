import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal } from '@angular/core'
import { UserModel } from '../../../shared/util-model/model/user.model'
import { ChipModule } from 'primeng/chip'
import { TitleCasePipe, UpperCasePipe } from '@angular/common'
import { ElementCardComponent } from '../../../shared/util-ui/element-card/element-card.component'
import { TranslateModule } from '@ngx-translate/core'
import { TagModule } from 'primeng/tag'
import { ClipboardModule } from '@angular/cdk/clipboard'
import { ToastModule } from 'primeng/toast'
import { StateUtil } from '../../../shared/util-tool/state/state.util'
import { UserFacade } from '../data/state/user.facade'
import { IconFieldModule } from 'primeng/iconfield'
import { InputIconModule } from 'primeng/inputicon'
import { InputTextModule } from 'primeng/inputtext'
import { ListboxModule } from 'primeng/listbox'
import { ReactiveFormsModule } from '@angular/forms'
import { AppRouteEnum } from '../../../app-route.enum'
import { SeverityTagComponent } from '../../../shared/util-ui/severity-tag/severity-tag.component'
import { GenericElementComponent } from '../../../shared/util-tool/component/generic-element.component'
import { DateFormatPipe } from '../../../shared/util-tool/pipe/date-format.pipe'
import { VisibilityNamePipe } from '../../../shared/util-tool/pipe/visibility.pipe'
import { SeverityEnum } from '../../../shared/util-model/enumeration/severity.enum'
import { UserAuthorityEnum } from '../../../shared/util-model/enumeration/user-authority.enum'
import { ElementActionEnum } from '../../../shared/util-model/enumeration/element-action.enum'
import { MenuItem } from 'primeng/api'

@Component( {
    selector: 'app-user-element',
    standalone: true,
    imports: [
        ChipModule,
        ElementCardComponent,
        TranslateModule,
        ClipboardModule,
        TitleCasePipe,
        UpperCasePipe,
        TagModule,
        ToastModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        ListboxModule,
        ReactiveFormsModule,
        SeverityTagComponent,
        DateFormatPipe,
        VisibilityNamePipe,
    ],
    templateUrl: './user-element.component.html',
    styleUrl: './user-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class UserElementComponent extends GenericElementComponent {
    protected readonly facade: UserFacade = inject( UserFacade )

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly user: InputSignal<UserModel> = input.required()

    protected readonly actions: Signal<MenuItem[]> = computed( (): MenuItem[] => {
        const isCurrentUser: boolean = this.registryFacade.currentUser()?.id == this.user().id
        return [
            {
                label: 'users.actions.update-role',
                icon: 'pi pi-user-edit',
                disabled: !this.hasAuthority( UserAuthorityEnum.REGISTRY_USER_U ),
                visible: this.actionIsEnable( ElementActionEnum.USER_UPDATE ) && !isCurrentUser,
                command: (): void => {
                    this.router.navigateByUrl(
                        AppRouteEnum.USERS_EDITION.replace( ':userId', this.user().id ),
                    ).catch( console.error )
                },
            },
            {
                label: 'users.actions.disable',
                icon: 'pi pi-ban',
                disabled: !this.hasAuthority( UserAuthorityEnum.REGISTRY_USER_U ),
                visible: this.actionIsEnable( ElementActionEnum.USER_BLOCK ) && this.user().visible && !isCurrentUser,
                command: (): void => {
                    this.confirmationService.confirm(
                        this.buildConfirmation(
                            'users.actions.confirmations.disable',
                            'pi pi-exclamation-triangle',
                            this.user(),
                            SeverityEnum.WARNING,
                            (): void => this.facade.bockUser( this.user().id ),
                        ),
                    )
                },
            },
            {
                label: 'users.actions.enable',
                icon: 'pi pi-replay',
                disabled: !this.hasAuthority( UserAuthorityEnum.REGISTRY_USER_U ),
                visible: this.actionIsEnable( ElementActionEnum.USER_UNBLOCK ) && !this.user().visible && !isCurrentUser,
                command: (): void => {
                    this.confirmationService.confirm(
                        this.buildConfirmation(
                            'users.actions.confirmations.enable',
                            'pi pi-info-circle',
                            this.user(),
                            SeverityEnum.INFO,
                            (): void => this.facade.unblockUser( this.user().id ),
                        ),
                    )
                },
            },
            {
                label: 'users.actions.impersonate',
                icon: 'pi pi-eraser',
                disabled: !this.hasAuthority( UserAuthorityEnum.REGISTRY_USER_D ),
                visible: this.actionIsEnable( ElementActionEnum.USER_IMPERSONATE ) && !isCurrentUser,
                command: (): void => {
                    this.confirmationService.confirm(
                        this.buildConfirmation(
                            'users.actions.confirmations.impersonate',
                            'pi pi-exclamation-circle',
                            this.user(),
                            SeverityEnum.DANGER,
                            (): void => this.facade.impersonateUser( this.user() ),
                        ),
                    )
                },
            },
            {
                label: 'users.actions.delete',
                icon: 'pi pi-trash',
                disabled: !this.hasAuthority( UserAuthorityEnum.REGISTRY_USER_D ),
                visible: this.actionIsEnable( ElementActionEnum.USER_DELETE ) && !isCurrentUser,
                command: (): void => {
                    this.confirmationService.confirm(
                        this.buildConfirmation(
                            'users.actions.confirmations.delete',
                            'pi pi-exclamation-circle',
                            this.user(),
                            SeverityEnum.DANGER,
                            (): void => this.facade.deleteUser( this.user() ),
                        ),
                    )
                },
            },
        ]
    } )

    protected copied (): void {
        this.registryFacade.notify( StateUtil.buildNotificationMessage(
            SeverityEnum.INFO,
            undefined,
            'users.notifications.email-copied',
            undefined,
            { element: this.user() },
        ) )
    }
}
