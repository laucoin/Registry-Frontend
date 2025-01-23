import { Component, Input, OnChanges } from '@angular/core'
import { GenericElementComponent } from '../../util-tool/component/generic-element.component'
import { EventProfileModel } from '../../util-model/model/event-profile.model'
import { EventProfileActionEnum } from '../../util-model/enumeration/event-profile-action.enum'
import { ChipModule } from 'primeng/chip'
import { AsyncPipe, DatePipe, NgIf, TitleCasePipe, UpperCasePipe } from '@angular/common'
import { ElementCardComponent } from '../element-card/element-card.component'
import { TranslateModule } from '@ngx-translate/core'
import { DateIsPastPipe } from '../../util-tool/pipe/date-is-past.pipe'
import { BadgeModule } from 'primeng/badge'
import { AppConfig } from '../../../app.config'
import { ActionModel } from '../../util-model/model/action.model'
import { Button } from 'primeng/button'
import { ConfirmationService } from 'primeng/api'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { breakPoint } from '../../util-tool/util/breakpoint.const'
import { EventProfileFacade } from '../../../domains/event-profile/data/state/event-profile.facade'
import { CurrentUserUtil } from '../../util-authentication/tool/current-user.util'
import { AppRouteEnum } from '../../../app-route.enum'
import { CurrentUserModel } from '../../util-model/model/current-user.model'

@Component( {
    selector: 'app-event-profile-element',
    standalone: true,
    imports: [
        ChipModule,
        DatePipe,
        ElementCardComponent,
        TranslateModule,
        DateIsPastPipe,
        BadgeModule,
        AsyncPipe,
        NgIf,
        Button,
        ConfirmDialogModule,
        TitleCasePipe,
        UpperCasePipe,
    ],
    providers: [ ConfirmationService, EventProfileFacade ],
    templateUrl: './event-profile-element.component.html',
    styleUrl: './event-profile-element.component.scss',
} )
export class EventProfileElementComponent extends GenericElementComponent<EventProfileModel, EventProfileActionEnum> implements OnChanges {
    @Input( { required: true } ) public view!: 'user' | 'event'

    protected readonly breakpoint: object = breakPoint

    public constructor (
        private readonly confirmationService: ConfirmationService,
        private readonly facade: EventProfileFacade,
    ) {
        super()
    }

    public ngOnChanges (): void {
        this.defineActions()
    }

    private defineActions (): void {
        const currentUser: CurrentUserModel = this.registryFacade.actualCurrentUser!
        this.actions = AppConfig
            .config.profile.event.action
            .map( (action: ActionModel<EventProfileActionEnum>): ActionModel<EventProfileActionEnum> => ({
                    ...action,
                    disabled: this.isActionDisabled( currentUser, action ),
                }),
            )
            .filter( (action: ActionModel<EventProfileActionEnum>): boolean => !action.disabled )
    }

    protected override isActionDisabled (
        currentUser: CurrentUserModel,
        action: ActionModel<EventProfileActionEnum>,
    ): boolean {
        const isActionFeasible: boolean = CurrentUserUtil.isFeasible(
            currentUser,
            this.element.event,
            action,
        )
        const isCurrentUserProfile: boolean = this.registryFacade.actualCurrentUser?.id === this.element.user.id

        switch (action.id) {
            case EventProfileActionEnum.SELECT_EVENT_PROFILE:
                return !isCurrentUserProfile || this.registryFacade.actualCurrentUser?.preferences?.selectedProfile?.id === this.element.id
            case EventProfileActionEnum.UPDATE_EVENT_PROFILE:
                return isCurrentUserProfile || !isActionFeasible
            case EventProfileActionEnum.BLOCK_EVENT_PROFILE:
                return isCurrentUserProfile || !(isActionFeasible && this.element.visible)
            case EventProfileActionEnum.UNBLOCK_EVENT_PROFILE:
                return isCurrentUserProfile || !(isActionFeasible && !this.element.visible)
            default:
                return !isActionFeasible
        }
    }

    protected handleAction (action: EventProfileActionEnum): void {
        switch (action) {
            case EventProfileActionEnum.SELECT_EVENT_PROFILE:
                this.registryFacade.selectUserEventProfile( this.element )
                break
            case EventProfileActionEnum.UPDATE_EVENT_PROFILE:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.PROFILES_EDITION ).replace( ':id', this.element.id ),
                ).catch( console.error )
                break
            case EventProfileActionEnum.BLOCK_EVENT_PROFILE:
                this.facade.blockEventProfile( this.element )
                break
            case EventProfileActionEnum.UNBLOCK_EVENT_PROFILE:
                this.facade.unblockEventProfile( this.element )
                break
            case EventProfileActionEnum.DELETE_EVENT_PROFILE:
                if (this.element.user.id === this.registryFacade.actualCurrentUser?.id) {
                    this.registryFacade.deleteUserEventProfile( this.element )
                } else {
                    this.facade.deleteElement( this.element )
                }
                break
            default:
                console.warn( this.translateService.instant( 'warning.message.invalid-action' ) )
        }
    }

    protected severityFromStatus (status: string): 'success' | 'danger' | 'help' {
        switch (status) {
            case 'ACCEPTED':
                return 'success'
            case 'REJECTED':
                return 'danger'
            default:
                return 'help'
        }
    }

    protected confirmManageAcceptance (status: string): void {
        this.confirmationService.confirm( {
            header: this.translateService.instant( `profile.action.confirmation.title.${status}` ),
            message: this.translateService.instant(
                `profile.action.confirmation.message.${status}`,
                { element: this.element },
            ),
            icon: status === 'ACCEPTED' ? 'pi pi-info-circle' : 'pi pi-exclamation-triangle',
            acceptLabel: this.translateService.instant( 'confirmation.confirm' ),
            rejectLabel: this.translateService.instant( 'confirmation.cancel' ),
            acceptButtonStyleClass: `p-button p-button-rounded p-button-outlined ${status === 'ACCEPTED' ? 'p-button-success' : 'p-button-danger'}`,
            rejectButtonStyleClass: 'p-button p-button-rounded p-button-text p-button-secondary',
            accept: (): void => this.manageAcceptance( status === 'ACCEPTED' ),
        } )
    }

    protected manageAcceptance (accepted: boolean): void {
        this.registryFacade.manageEventInvitationAcceptance( this.element.id, accepted )
    }
}
