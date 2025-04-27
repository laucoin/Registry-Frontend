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
import { EventProfileModel } from '../../util-model/model/event-profile.model'
import { EventProfileActionEnum } from '../../util-model/enumeration/event-profile-action.enum'
import { ChipModule } from 'primeng/chip'
import { TitleCasePipe, UpperCasePipe } from '@angular/common'
import { ElementCardComponent } from '../element-card/element-card.component'
import { TranslateModule } from '@ngx-translate/core'
import { BadgeModule } from 'primeng/badge'
import { AppConfig } from '../../../app.config'
import { ActionModel } from '../../util-model/model/action.model'
import { Button } from 'primeng/button'
import { ConfirmationService } from 'primeng/api'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { EventProfileFacade } from '../../../domains/event-profile/data/state/event-profile.facade'
import { AppRouteEnum } from '../../../app-route.enum'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { SeverityTagComponent } from '../severity-tag/severity-tag.component'
import { DateIntervalStatusModel } from '../../util-model/model/date-interval-status.model'
import { DateUtil } from '../../util-tool/util/date.util'
import { GenericElementComponent } from '../../util-tool/component/generic-element.component'
import { IntervalFormatPipe } from '../../util-tool/pipe/interval-format.pipe'
import { CustomDateFormatPipe } from '../../util-tool/pipe/custom-date-format.pipe'
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component'
import { Observable, tap } from 'rxjs'
import { ActionCompletion } from '@ngxs/store'

@Component( {
    selector: 'app-event-profile-element',
    standalone: true,
    imports: [
        ChipModule,
        ElementCardComponent,
        TranslateModule,
        BadgeModule,
        Button,
        ConfirmDialogModule,
        TitleCasePipe,
        UpperCasePipe,
        SeverityTagComponent,
        IntervalFormatPipe,
        CustomDateFormatPipe,
        ConfirmationDialogComponent,
    ],
    providers: [ ConfirmationService, EventProfileFacade ],
    templateUrl: './event-profile-element.component.html',
    styleUrl: './event-profile-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class EventProfileElementComponent extends GenericElementComponent<EventProfileModel, EventProfileActionEnum> implements OnDestroy {
    protected readonly facade: EventProfileFacade = inject( EventProfileFacade )
    private readonly confirmationService: ConfirmationService = inject( ConfirmationService )

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly view: InputSignal<'user' | 'event'> = input.required()
    public readonly profile: InputSignal<EventProfileModel> = input.required()

    protected readonly actions: Signal<ActionModel<EventProfileActionEnum>[]>
    protected readonly intervalStatus: Signal<DateIntervalStatusModel | undefined>

    public constructor () {
        super()

        this.intervalStatus = computed( (): DateIntervalStatusModel => DateUtil.dateRangeStatus(
            this.profile().startAccess,
            this.profile().endAccess,
        ) )

        this.actions = computed( (): ActionModel<EventProfileActionEnum>[] => this.buildActions(
            this.profile(),
            AppConfig.config.profile.event.action,
        ) )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected isActionVisible (element: EventProfileModel, action: ActionModel<EventProfileActionEnum>): boolean {
        const currentUser: CurrentUserModel | undefined = this.registryFacade.currentUser()
        const isCurrentUserProfile: boolean = currentUser?.id === element.user.id

        switch (action.id) {
            case EventProfileActionEnum.SELECT_EVENT_PROFILE:
                return isCurrentUserProfile
            case EventProfileActionEnum.UPDATE_EVENT_PROFILE:
                return !isCurrentUserProfile
            case EventProfileActionEnum.BLOCK_EVENT_PROFILE:
                return !isCurrentUserProfile && element.visible
            case EventProfileActionEnum.UNBLOCK_EVENT_PROFILE:
                return !isCurrentUserProfile && !element.visible
            default:
                return true
        }
    }

    protected override disabledAction (
        element: EventProfileModel,
        action: ActionModel<EventProfileActionEnum>,
    ): boolean {
        const isNotFeasible: boolean = super.disabledAction( element, action )

        if (action.id === EventProfileActionEnum.SELECT_EVENT_PROFILE) {
            const currentUser: CurrentUserModel | undefined = this.registryFacade.currentUser()
            const isCurrentUserSelectedProfile: boolean = currentUser?.preferences?.selectedProfile?.id === element.id

            return isCurrentUserSelectedProfile || isNotFeasible
        }

        return isNotFeasible
    }

    protected handleAction (action: EventProfileActionEnum): void {
        switch (action) {
            case EventProfileActionEnum.SELECT_EVENT_PROFILE:
                this.subscriptions.add(
                    this.registryFacade.selectUserEventProfile( this.profile() ).pipe(
                        tap( (): void => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            case EventProfileActionEnum.UPDATE_EVENT_PROFILE:
                this.router.navigateByUrl(
                    AppRouteEnum.PROFILES_EDITION.replace( ':profileId', this.profile().id ),
                ).catch( console.error )
                break
            case EventProfileActionEnum.BLOCK_EVENT_PROFILE:
                this.subscriptions.add(
                    this.facade.blockEventProfile( this.profile() ).pipe(
                        tap( (): void => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            case EventProfileActionEnum.UNBLOCK_EVENT_PROFILE:
                this.subscriptions.add(
                    this.facade.unblockEventProfile( this.profile() ).pipe(
                        tap( (): void => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            case EventProfileActionEnum.DELETE_EVENT_PROFILE: {
                const actionCompletion: Observable<ActionCompletion<unknown>> =
                    this.profile().user.id === this.registryFacade.currentUser()?.id
                    ? this.registryFacade.deleteUserEventProfile( this.profile() )
                    : this.facade.deleteEventProfile( this.profile() )

                this.subscriptions.add( actionCompletion.pipe(
                        tap( (): void => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            }
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }

    protected severityFromStatus (status: string): 'success' | 'info' | 'warn' | 'danger' {
        switch (status) {
            case 'ACCEPTED':
                return 'success'
            case 'REJECTED':
                return 'warn'
            case 'BLOCKED':
                return 'danger'
            default:
                return 'info'
        }
    }

    protected confirmManageAcceptance (status: string): void {
        this.confirmationService.confirm( {
            header: this.translateService.instant( `event-profiles.actions.confirmations.${status}.title` ),
            message: this.translateService.instant(
                `event-profiles.actions.confirmations.${status}.message`,
                { element: this.profile() },
            ),
            icon: status === 'ACCEPTED' ? 'pi pi-info-circle' : 'pi pi-exclamation-triangle',
            acceptLabel: this.translateService.instant( 'global.actions.confirm' ),
            rejectLabel: this.translateService.instant( 'global.actions.cancel' ),
            acceptButtonStyleClass: `p-button p-button-rounded p-button-outlined ${status === 'ACCEPTED' ? 'p-button-success' : 'p-button-danger'}`,
            rejectButtonStyleClass: 'p-button p-button-rounded p-button-text p-button-secondary',
            accept: (): void => this.manageAcceptance( status === 'ACCEPTED' ),
        } )
    }

    protected manageAcceptance (accepted: boolean): void {
        this.registryFacade.manageEventInvitationAcceptance( this.profile().id, accepted )
    }
}
