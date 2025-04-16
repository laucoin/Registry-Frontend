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
import { ParticipantModel } from '../../util-model/model/participant.model'
import { ParticipantActionEnum } from '../../../domains/participant/data/state/participant.action'
import { ActionModel } from '../../util-model/model/action.model'
import { ParticipantFacade } from '../../../domains/participant/data/state/participant.facade'
import { AppConfig } from '../../../app.config'
import { ElementCardComponent } from '../element-card/element-card.component'
import { TitleCasePipe, UpperCasePipe } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { AppRouteEnum } from '../../../app-route.enum'
import { Avatar } from 'primeng/avatar'
import { LayerComponent } from '../layer/layer.component'
import { Listbox } from 'primeng/listbox'
import { GroupActionEnum } from '../../../domains/group/data/state/group.action'
import { GroupFacade } from '../../../domains/group/data/state/group.facade'
import { SeverityTagComponent } from '../severity-tag/severity-tag.component'
import { GenericElementComponent } from '../../util-tool/component/generic-element.component'
import { DateIntervalStatusModel } from '../../util-model/model/date-interval-status.model'
import { DateUtil } from '../../util-tool/util/date.util'
import { PluralTranslationPipe } from '../../util-tool/pipe/plural-translation.pipe'
import { VisibilityNamePipe } from '../../util-tool/pipe/visibility.pipe'
import { CustomDateFormatPipe } from '../../util-tool/pipe/custom-date-format.pipe'
import { IntervalFormatPipe } from '../../util-tool/pipe/interval-format.pipe'
import { GenericUtil } from '../../util-tool/util/generic.util'
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component'
import { tap } from 'rxjs'

@Component( {
    selector: 'app-participant-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TitleCasePipe,
        UpperCasePipe,
        TranslateModule,
        Avatar,
        LayerComponent,
        Listbox,
        SeverityTagComponent,
        PluralTranslationPipe,
        VisibilityNamePipe,
        CustomDateFormatPipe,
        IntervalFormatPipe,
        ConfirmationDialogComponent,
    ],
    providers: [ GroupFacade ],
    templateUrl: './participant-element.component.html',
    styleUrl: './participant-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class ParticipantElementComponent extends GenericElementComponent<ParticipantModel, ParticipantActionEnum | GroupActionEnum> implements OnDestroy {
    protected readonly facade: ParticipantFacade = inject( ParticipantFacade )
    private readonly groupFacade: GroupFacade = inject( GroupFacade )

    protected layerOpened: boolean = false

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly groupIdToRemove: InputSignal<string | undefined> = input()
    public readonly participant: InputSignal<ParticipantModel> = input.required()

    protected readonly participantStatusSeverity: Signal<'success' | 'warn' | 'secondary'>
    protected readonly actions: Signal<ActionModel<ParticipantActionEnum | GroupActionEnum>[]>
    protected readonly intervalStatus: Signal<DateIntervalStatusModel | undefined>
    protected readonly additionalTotal: Signal<number>

    public constructor () {
        super()

        this.intervalStatus = computed( (): DateIntervalStatusModel => DateUtil.dateRangeStatus(
            this.participant().startAvailability,
            this.participant().endAvailability,
        ) )

        this.participantStatusSeverity = computed( (): 'success' | 'warn' | 'secondary' => {
            switch (this.participant().status.value) {
                case 'IN':
                    return 'success'
                case 'OUT':
                    return 'warn'
                default:
                    return 'secondary'
            }
        } )

        this.actions = computed( (): ActionModel<ParticipantActionEnum | GroupActionEnum>[] => this.buildActions(
            this.participant(),
            AppConfig.config.participant.action,
        ) )

        this.additionalTotal = computed( (): number => this.participant().groups.length - 1 )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected isActionVisible (
        element: ParticipantModel,
        action: ActionModel<ParticipantActionEnum | GroupActionEnum>,
    ): boolean {
        switch (action.id) {
            case GroupActionEnum.REMOVE_MEMBER_FROM_GROUP:
                return GenericUtil.nonNull( this.groupIdToRemove() )
            case ParticipantActionEnum.DISABLE_PARTICIPANT:
                return element.visible
            case ParticipantActionEnum.ENABLE_PARTICIPANT:
                return !element.visible
            default:
                return true
        }
    }

    protected handleAction (action: ParticipantActionEnum | GroupActionEnum): void {
        switch (action) {
            case ParticipantActionEnum.FETCH_PARTICIPANT_MOVEMENTS_PAGE:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.PARTICIPANTS_MOVEMENTS.replace(
                        ':participantId',
                        this.participant().id,
                    ) ),
                ).catch( console.error )
                break
            case ParticipantActionEnum.UPDATE_PARTICIPANT:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.PARTICIPANTS_EDITION.replace(
                        ':participantId',
                        this.participant().id,
                    ) ),
                ).catch( console.error )
                break
            case GroupActionEnum.REMOVE_MEMBER_FROM_GROUP:
                this.subscriptions.add(
                    this.groupFacade.removeMemberFromGroup(
                        this.groupIdToRemove()!,
                        this.participant(),
                        this.contextEventId(),
                    ).pipe( tap( (): void => this.action.set( undefined ) ) ).subscribe(),
                )
                break
            case ParticipantActionEnum.DISABLE_PARTICIPANT:
                this.subscriptions.add(
                    this.facade.disableParticipant( this.participant().id ).pipe(
                        tap( (): void => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            case ParticipantActionEnum.ENABLE_PARTICIPANT:
                this.subscriptions.add(
                    this.facade.enableParticipant( this.participant().id ).pipe(
                        tap( (): void => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            case ParticipantActionEnum.DELETE_PARTICIPANT:
                this.subscriptions.add(
                    this.facade.deleteParticipant( this.participant() ).pipe(
                        tap( (): void => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }
}
