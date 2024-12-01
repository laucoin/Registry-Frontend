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
import { ProfileStatusEnum } from '../../util-model/enumeration/profile-status.enum'
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
    protected readonly ProfileStatusEnum: typeof ProfileStatusEnum = ProfileStatusEnum

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
            .filter( (action: ActionModel<EventProfileActionEnum>): boolean => this.leaveSelectIfCurrentUser( action ) )
            .filter( (action: ActionModel<EventProfileActionEnum>): boolean =>
                this.leaveEditBlockAndUnblockIfNotCurrentUser( action ),
            )
            .filter( (action: ActionModel<EventProfileActionEnum>): boolean =>
                this.leaveNecessaryBlockOrUnblock( action ),
            )
            .map( (action: ActionModel<EventProfileActionEnum>): ActionModel<EventProfileActionEnum> => ({
                    ...action,
                    disabled: (!this.element.visible && action.disabled) ||
                              !CurrentUserUtil.isFeasible(
                                  currentUser,
                                  this.element.event,
                                  action,
                              ) || (
                                  this.element.id === this.registryFacade.actualCurrentUser?.preferences?.selectedProfile?.id &&
                                  action.id === EventProfileActionEnum.SELECT_EVENT_PROFILE
                              ),
                }),
            )
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

    private leaveSelectIfCurrentUser (action: ActionModel<EventProfileActionEnum>): boolean {
        return action.id !== EventProfileActionEnum.SELECT_EVENT_PROFILE
               || this.registryFacade.actualCurrentUser?.id === this.element.user.id
    }

    private leaveEditBlockAndUnblockIfNotCurrentUser (action: ActionModel<EventProfileActionEnum>): boolean {
        const blockUnblockActions: EventProfileActionEnum[] = [
            EventProfileActionEnum.UPDATE_EVENT_PROFILE,
            EventProfileActionEnum.BLOCK_EVENT_PROFILE,
            EventProfileActionEnum.UNBLOCK_EVENT_PROFILE,
        ]

        return !blockUnblockActions.includes( action.id ) || this.registryFacade.actualCurrentUser?.id !== this.element.user.id
    }

    private leaveNecessaryBlockOrUnblock (action: ActionModel<EventProfileActionEnum>): boolean {
        return (action.id !== EventProfileActionEnum.UNBLOCK_EVENT_PROFILE && this.element.visible)
               || (action.id !== EventProfileActionEnum.BLOCK_EVENT_PROFILE && !this.element.visible)
    }

    protected severityFromStatus (status: ProfileStatusEnum): 'success' | 'danger' | 'help' {
        switch (status) {
            case ProfileStatusEnum.INVITED:
                return 'help'
            case ProfileStatusEnum.ACCEPTED:
                return 'success'
            case ProfileStatusEnum.REJECTED:
                return 'danger'
        }
    }

    protected confirmManageAcceptance (status: ProfileStatusEnum): void {
        this.confirmationService.confirm( {
            header: this.translateService.instant( `profile.action.confirmation.title.${status}` ),
            message: this.translateService.instant(
                `profile.action.confirmation.message.${status}`,
                { element: this.element },
            ),
            icon: status === ProfileStatusEnum.ACCEPTED ? 'pi pi-info-circle' : 'pi pi-exclamation-triangle',
            acceptLabel: this.translateService.instant( 'confirmation.confirm' ),
            rejectLabel: this.translateService.instant( 'confirmation.cancel' ),
            acceptButtonStyleClass: `p-button p-button-rounded p-button-outlined ${status === ProfileStatusEnum.ACCEPTED ? 'p-button-success' : 'p-button-danger'}`,
            rejectButtonStyleClass: 'p-button p-button-rounded p-button-text p-button-secondary',
            accept: (): void => this.manageAcceptance( status ),
        } )
    }

    protected manageAcceptance (status: ProfileStatusEnum): void {
        this.registryFacade.manageEventInvitationAcceptance( this.element.id, status )
    }
}
