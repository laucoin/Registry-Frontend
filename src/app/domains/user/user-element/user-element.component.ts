import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    InputSignal,
    signal,
    Signal,
} from '@angular/core'
import { UserModel } from '../../../shared/util-model/model/user.model'
import { ChipModule } from 'primeng/chip'
import { TitleCasePipe, UpperCasePipe } from '@angular/common'
import { ElementCardComponent } from '../../../shared/util-ui/element-card/element-card.component'
import { TranslateModule } from '@ngx-translate/core'
import { TagModule } from 'primeng/tag'
import { ClipboardModule } from '@angular/cdk/clipboard'
import { ToastModule } from 'primeng/toast'
import { StateUtil } from '../../../shared/util-tool/state/state.util'
import { ActionModel } from '../../../shared/util-model/model/action.model'
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
import { ConfirmationDialogComponent } from '../../../shared/util-ui/confirmation-dialog/confirmation-dialog.component'
import { SeverityEnum } from '../../../shared/util-model/enumeration/severity.enum'
import { UserAuthorityEnum } from '../../../shared/util-model/enumeration/user-authority.enum'
import { ElementActionEnum } from '../../../shared/util-model/enumeration/element-action.enum'
import { AppConfig } from '../../../app.config'

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
        ConfirmationDialogComponent,
    ],
    templateUrl: './user-element.component.html',
    styleUrl: './user-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class UserElementComponent extends GenericElementComponent<UserModel> {
    protected readonly facade: UserFacade = inject( UserFacade )

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly user: InputSignal<UserModel> = input.required()

    private readonly allActions: Signal<ActionModel[]> = signal( [
        {
            id: ElementActionEnum.USER_UPDATE,
            label: 'users.actions.update-role',
            icon: 'pi pi-user-edit',
            disabled: false,
            requiredUserAuthority: UserAuthorityEnum.REGISTRY_USER_U,
            requiredProjectAuthority: undefined,
            requiredProjectOption: undefined,
            confirmation: undefined,
        },
        {
            id: ElementActionEnum.USER_BLOCK,
            label: 'users.actions.disable',
            icon: 'pi pi-ban',
            disabled: false,
            requiredUserAuthority: UserAuthorityEnum.REGISTRY_USER_U,
            requiredProjectAuthority: undefined,
            requiredProjectOption: undefined,
            confirmation: {
                header: 'users.actions.confirmations.disable.title',
                message: 'users.actions.confirmations.disable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: undefined,
            },
        },
        {
            id: ElementActionEnum.USER_UNBLOCK,
            label: 'users.actions.enable',
            icon: 'pi pi-replay',
            disabled: true,
            requiredUserAuthority: UserAuthorityEnum.REGISTRY_USER_U,
            requiredProjectAuthority: undefined,
            requiredProjectOption: undefined,
            confirmation: {
                header: 'users.actions.confirmations.enable.title',
                message: 'users.actions.confirmations.enable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: undefined,
            },
        },
        {
            id: ElementActionEnum.USER_IMPERSONATE,
            label: 'users.actions.impersonate',
            icon: 'pi pi-eraser',
            disabled: false,
            requiredUserAuthority: UserAuthorityEnum.REGISTRY_USER_D,
            requiredProjectAuthority: undefined,
            requiredProjectOption: undefined,
            confirmation: {
                header: 'users.actions.confirmations.impersonate.other.title',
                message: 'users.actions.confirmations.impersonate.other.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.DANGER,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: 'firstName',
            },
        },
        {
            id: ElementActionEnum.USER_DELETE,
            label: 'users.actions.delete',
            icon: 'pi pi-trash',
            disabled: false,
            requiredUserAuthority: UserAuthorityEnum.REGISTRY_USER_D,
            requiredProjectAuthority: undefined,
            requiredProjectOption: undefined,
            confirmation: {
                header: 'users.actions.confirmations.delete.title',
                message: 'users.actions.confirmations.delete.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.DANGER,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: 'firstName',
            },
        },
    ] )
    protected readonly actions: Signal<ActionModel[]>

    public constructor () {
        super()

        this.actions = computed( (): ActionModel[] => this.buildActions(
            this.user(),
            this.allActions(),
        ) )
    }

    protected isActionVisible (element: UserModel, action: ActionModel): boolean {
        if (!AppConfig.config.user.actions.includes( action.id )) return false
        const isCurrentUser: boolean = this.registryFacade.currentUser()?.id == element.id

        switch (action.id) {
            case ElementActionEnum.USER_UPDATE:
                return !isCurrentUser
            case ElementActionEnum.USER_BLOCK:
                return !isCurrentUser && element.visible
            case ElementActionEnum.USER_UNBLOCK:
                return !isCurrentUser && !element.visible
            case ElementActionEnum.USER_IMPERSONATE:
                return !isCurrentUser
            case ElementActionEnum.USER_DELETE:
                return !isCurrentUser
            default:
                return true
        }
    }

    protected handleAction (action: ElementActionEnum): void {
        switch (action) {
            case ElementActionEnum.USER_UPDATE:
                this.router.navigateByUrl(
                    AppRouteEnum.USERS_EDITION.replace( ':userId', this.user().id ),
                ).catch( console.error )
                break
            case ElementActionEnum.USER_BLOCK:
                this.facade.bockUser( this.user().id )
                break
            case ElementActionEnum.USER_UNBLOCK:
                this.facade.unblockUser( this.user().id )
                break
            case ElementActionEnum.USER_IMPERSONATE:
                this.facade.impersonateUser( this.user() )
                break
            case ElementActionEnum.USER_DELETE:
                this.facade.deleteUser( this.user() )
                break
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }

    protected copied (): void {
        this.registryFacade.notify( StateUtil.buildNotificationMessage(
            SeverityEnum.INFO,
            undefined,
            'user.notifications.email-copied',
            undefined,
            { element: this.user() },
        ) )
    }
}
