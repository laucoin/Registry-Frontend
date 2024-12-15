import { Component, Input, OnChanges } from '@angular/core'
import { GenericElementComponent } from '../../../shared/util-tool/component/generic-element.component'
import { UserModel } from '../../../shared/util-model/model/user.model'
import { UserActionEnum } from '../data/state/user.action'
import { ChipModule } from 'primeng/chip'
import { DatePipe, TitleCasePipe, UpperCasePipe } from '@angular/common'
import { ElementCardComponent } from '../../../shared/util-ui/element-card/element-card.component'
import { TranslateModule } from '@ngx-translate/core'
import { TagModule } from 'primeng/tag'
import { ClipboardModule } from '@angular/cdk/clipboard'
import { ToastModule } from 'primeng/toast'
import { StateUtil } from '../../../shared/util-tool/state/state.util'
import { AppConfig } from '../../../app.config'
import { ActionModel } from '../../../shared/util-model/model/action.model'
import { CurrentUserUtil } from '../../../shared/util-authentication/tool/current-user.util'
import { CurrentUserModel } from '../../../shared/util-model/model/current-user.model'
import { UserFacade } from '../data/state/user.facade'
import { IconFieldModule } from 'primeng/iconfield'
import { InputIconModule } from 'primeng/inputicon'
import { InputTextModule } from 'primeng/inputtext'
import { ListboxModule } from 'primeng/listbox'
import { ReactiveFormsModule } from '@angular/forms'

@Component( {
    selector: 'app-user-element',
    standalone: true,
    imports: [
        ChipModule,
        DatePipe,
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

    ],
    templateUrl: './user-element.component.html',
    styleUrl: './user-element.component.scss',
} )
export class UserElementComponent extends GenericElementComponent<UserModel, UserActionEnum> implements OnChanges {
    @Input() public showActionMenu: boolean = true

    public constructor (
        private readonly facade: UserFacade,
    ) {super()}

    public ngOnChanges (): void {
        this.defineActions()
    }

    protected copied (): void {
        this.registryFacade.notify( StateUtil.buildNotificationMessage(
            'info',
            undefined,
            'info.message.email-copied',
            undefined,
            { element: this.element },
        ) )
    }

    private defineActions (): void {
        const currentUser: CurrentUserModel = this.registryFacade.actualCurrentUser!
        this.actions = AppConfig
            .config.user.action
            .map( (action: ActionModel<UserActionEnum>): ActionModel<UserActionEnum> => ({
                ...action, disabled: this.isActionDisabled( currentUser, action ),
            }) )
            .filter( (action: ActionModel<UserActionEnum>): boolean => !action.disabled )
    }

    protected override isActionDisabled (currentUser: CurrentUserModel, action: ActionModel<UserActionEnum>): boolean {
        const isActionFeasible: boolean = CurrentUserUtil.isFeasible(
            currentUser,
            undefined,
            action,
        )
        const isCurrentUser: boolean = this.element.id == currentUser?.id

        switch (action.id) {
            case UserActionEnum.BLOCK_USER:
                return !isCurrentUser || !(isActionFeasible && this.element.visible)
            case UserActionEnum.UNBLOCK_USER:
                return !isCurrentUser || !(isActionFeasible && !this.element.visible)
            default:
                return !isActionFeasible
        }
    }

    protected handleAction (action: UserActionEnum): void {
        switch (action) {
            case UserActionEnum.BLOCK_USER:
                this.facade.bockElement( this.element.id )
                break
            case UserActionEnum.UNBLOCK_USER:
                this.facade.unblockElement( this.element.id )
                break
            case UserActionEnum.DELETE_USER:
                this.facade.deleteElement( this.element )
                break
            default:
                console.warn( this.translateService.instant( 'warning.message.invalid-action' ) )
        }
    }
}
