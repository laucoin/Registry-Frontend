import { Component, Input, OnChanges, signal, WritableSignal } from '@angular/core'
import { GenericElementComponent } from '../../util-tool/component/generic-element.component'
import { ParticipantModel } from '../../util-model/model/participant.model'
import { ParticipantActionEnum } from '../../../domains/participant/data/state/participant.action'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { ActionModel } from '../../util-model/model/action.model'
import { ParticipantFacade } from '../../../domains/participant/data/state/participant.facade'
import { AppConfig } from '../../../app.config'
import { CurrentUserUtil } from '../../util-authentication/tool/current-user.util'
import { ElementCardComponent } from '../element-card/element-card.component'
import { DatePipe, TitleCasePipe, UpperCasePipe } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { AppRouteEnum } from '../../../app-route.enum'
import { Avatar } from 'primeng/avatar'
import { Button } from 'primeng/button'
import { LayerComponent } from '../layer/layer.component'
import { Listbox } from 'primeng/listbox'
import { GroupActionEnum } from '../../../domains/group/data/state/group.action'
import { GroupFacade } from '../../../domains/group/data/state/group.facade'

@Component( {
    selector: 'app-participant-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TitleCasePipe,
        UpperCasePipe,
        DatePipe,
        TranslateModule,
        Avatar,
        Button,
        LayerComponent,
        Listbox,
    ],
    providers: [ GroupFacade ],
    templateUrl: './participant-element.component.html',
    styleUrl: './participant-element.component.scss',
} )
export class ParticipantElementComponent extends GenericElementComponent<ParticipantModel, ParticipantActionEnum | GroupActionEnum> implements OnChanges {
    @Input() public showActionMenu: boolean = true
    @Input() public groupIdToRemove: string | undefined
    protected layerOpened: boolean = false

    protected additionalTotal: WritableSignal<number> = signal( 0 )

    public constructor (
        private readonly facade: ParticipantFacade,
        private readonly groupFacade: GroupFacade,
    ) {super()}

    public ngOnChanges (): void {
        this.additionalTotal.set( this.element.groups.length - 1 )
        this.defineActions()
    }

    private defineActions (): void {
        const currentUser: CurrentUserModel = this.registryFacade.actualCurrentUser!
        this.actions = AppConfig
            .config.participant.action
            .map( (action: ActionModel<ParticipantActionEnum | GroupActionEnum>): ActionModel<ParticipantActionEnum | GroupActionEnum> => ({
                ...action,
                disabled: this.isActionDisabled( currentUser, action ),
            }) )
            .filter( (action: ActionModel<ParticipantActionEnum | GroupActionEnum>): boolean => !action.disabled )
    }

    protected override isActionDisabled (
        currentUser: CurrentUserModel,
        action: ActionModel<ParticipantActionEnum | GroupActionEnum>,
    ): boolean {
        const isActionFeasible: boolean = CurrentUserUtil.isFeasible(
            currentUser,
            this.element.event,
            action,
        )

        switch (action.id) {
            case GroupActionEnum.REMOVE_MEMBER_FROM_GROUP:
                return !(isActionFeasible && this.groupIdToRemove)
            case ParticipantActionEnum.DISABLE_PARTICIPANT:
                return !(isActionFeasible && this.element.visible)
            case ParticipantActionEnum.ENABLE_PARTICIPANT:
                return !(isActionFeasible && !this.element.visible)
            default:
                return !isActionFeasible
        }
    }

    protected handleAction (action: ParticipantActionEnum | GroupActionEnum): void {
        switch (action) {
            case ParticipantActionEnum.FETCH_PARTICIPANT_MOVEMENTS_PAGE:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.PARTICIPANTS_MOVEMENTS.replace( ':id', this.element.id ) ),
                ).catch( console.error )
                break
            case ParticipantActionEnum.UPDATE_PARTICIPANT:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.PARTICIPANTS_EDITION.replace( ':id', this.element.id ) ),
                ).catch( console.error )
                break
            case GroupActionEnum.REMOVE_MEMBER_FROM_GROUP:
                this.groupFacade.removeMemberFromGroup( this.groupIdToRemove!, this.element, this.contextEventId() )
                break
            case ParticipantActionEnum.DISABLE_PARTICIPANT:
                this.facade.disableParticipant( this.element.id, this.contextEventId() )
                break
            case ParticipantActionEnum.ENABLE_PARTICIPANT:
                this.facade.enableParticipant( this.element.id, this.contextEventId() )
                break
            case ParticipantActionEnum.DELETE_PARTICIPANT:
                this.facade.deleteParticipant( this.element, this.contextEventId() )
                break
            default:
                console.warn( this.translateService.instant( 'warning.message.invalid-action' ) )
        }
    }
}
