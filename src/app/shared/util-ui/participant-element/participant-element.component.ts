import { Component, Input, OnChanges } from '@angular/core'
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
import { ParticipantRoutesEnum } from '../../../domains/participant/participant-routes.enum'

@Component( {
    selector: 'app-participant-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TitleCasePipe,
        UpperCasePipe,
        DatePipe,
        TranslateModule,
    ],
    templateUrl: './participant-element.component.html',
    styleUrl: './participant-element.component.scss',
} )
export class ParticipantElementComponent extends GenericElementComponent<ParticipantModel, ParticipantActionEnum> implements OnChanges {
    @Input() public showActionMenu: boolean = true

    public constructor (private readonly facade: ParticipantFacade) {super()}

    public ngOnChanges (): void {
        this.defineActions()
    }

    private defineActions (): void {
        const currentUser: CurrentUserModel = this.registryFacade.actualCurrentUser!
        this.actions = AppConfig
            .config.participant.action
            .map( (action: ActionModel<ParticipantActionEnum>): ActionModel<ParticipantActionEnum> => ({
                ...action,
                disabled: this.isActionDisabled( currentUser, action ),
            }) )
            .filter( (action: ActionModel<ParticipantActionEnum>): boolean => !action.disabled )
    }

    protected override isActionDisabled (
        currentUser: CurrentUserModel,
        action: ActionModel<ParticipantActionEnum>,
    ): boolean {
        const isActionFeasible: boolean = CurrentUserUtil.isFeasible(
            currentUser,
            this.element.event,
            action,
        )

        switch (action.id) {
            case ParticipantActionEnum.DISABLE_PARTICIPANT:
                return !(isActionFeasible && this.element.visible)
            case ParticipantActionEnum.ENABLE_PARTICIPANT:
                return !(isActionFeasible && !this.element.visible)
            default:
                return !isActionFeasible
        }
    }

    protected handleAction (action: ParticipantActionEnum): void {
        switch (action) {
            case ParticipantActionEnum.UPDATE_PARTICIPANT:
                this.router.navigate(
                    [ ParticipantRoutesEnum.EDIT.replace( ':id', this.element.id ) ],
                    { relativeTo: this.route },
                ).catch( console.error )
                break
            case ParticipantActionEnum.DISABLE_PARTICIPANT:
                this.facade.disableElement( this.element.id, this.contextEventId() )
                break
            case ParticipantActionEnum.ENABLE_PARTICIPANT:
                this.facade.enableElement( this.element.id, this.contextEventId() )
                break
            case ParticipantActionEnum.DELETE_PARTICIPANT:
                this.facade.deleteElement( this.element, this.contextEventId() )
                break
            default:
                console.warn( this.translateService.instant( 'warning.message.invalid-action' ) )
        }
    }
}
