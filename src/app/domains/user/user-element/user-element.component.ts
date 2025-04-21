import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    InputSignal,
    OnDestroy,
    Signal,
} from '@angular/core'
import { UserModel } from '../../../shared/util-model/model/user.model'
import { UserActionEnum } from '../data/state/user.action'
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
import { AppConfig } from '../../../app.config'
import { DateFormatPipe } from '../../../shared/util-tool/pipe/date-format.pipe'
import { VisibilityNamePipe } from '../../../shared/util-tool/pipe/visibility.pipe'
import { ConfirmationDialogComponent } from '../../../shared/util-ui/confirmation-dialog/confirmation-dialog.component'
import { tap } from 'rxjs'

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
export class UserElementComponent extends GenericElementComponent<UserModel, UserActionEnum> implements OnDestroy {
    protected readonly facade: UserFacade = inject( UserFacade )

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly user: InputSignal<UserModel> = input.required()

    protected readonly actions: Signal<ActionModel<UserActionEnum>[]>

    public constructor () {
        super()

        this.actions = computed( (): ActionModel<UserActionEnum>[] => this.buildActions(
            this.user(),
            AppConfig.config.user.action,
        ) )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected isActionVisible (element: UserModel, action: ActionModel<UserActionEnum>): boolean {
        const isCurrentUser: boolean = this.registryFacade.currentUser()?.id == element.id

        switch (action.id) {
            case UserActionEnum.UPDATE_USER_ROLE:
                return !isCurrentUser
            case UserActionEnum.BLOCK_USER:
                return !isCurrentUser && element.visible
            case UserActionEnum.UNBLOCK_USER:
                return !isCurrentUser && !element.visible
            case UserActionEnum.IMPERSONATE_USER:
                return !isCurrentUser
            case UserActionEnum.DELETE_USER:
                return !isCurrentUser
            default:
                return true
        }
    }

    protected handleAction (action: UserActionEnum): void {
        switch (action) {
            case UserActionEnum.UPDATE_USER_ROLE:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.USERS_EDITION.replace( ':userId', this.user().id ) ),
                ).catch( console.error )
                break
            case UserActionEnum.BLOCK_USER:
                this.subscriptions.add(
                    this.facade.bockUser( this.user().id ).pipe(
                        tap( () => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            case UserActionEnum.UNBLOCK_USER:
                this.subscriptions.add(
                    this.facade.unblockUser( this.user().id ).pipe(
                        tap( () => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            case UserActionEnum.IMPERSONATE_USER:
                this.subscriptions.add(
                    this.facade.impersonateUser( this.user() ).pipe(
                        tap( () => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            case UserActionEnum.DELETE_USER:
                this.subscriptions.add(
                    this.facade.deleteUser( this.user() ).pipe(
                        tap( () => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }

    protected copied (): void {
        this.registryFacade.notify( StateUtil.buildNotificationMessage(
            'info',
            undefined,
            'user.notifications.email-copied',
            undefined,
            { element: this.user() },
        ) )
    }
}
