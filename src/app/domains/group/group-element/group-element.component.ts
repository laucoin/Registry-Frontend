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
import { GroupModel } from '../../../shared/util-model/model/group.model'
import { GroupActionEnum } from '../data/state/group.action'
import { AppConfig } from '../../../app.config'
import { ActionModel } from '../../../shared/util-model/model/action.model'
import { GroupFacade } from '../data/state/group.facade'
import { ElementCardComponent } from '../../../shared/util-ui/element-card/element-card.component'
import { TranslatePipe } from '@ngx-translate/core'
import { TitleCasePipe, UpperCasePipe } from '@angular/common'
import { LayerComponent } from '../../../shared/util-ui/layer/layer.component'
import { Listbox } from 'primeng/listbox'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs'
import { ParticipantModel } from '../../../shared/util-model/model/participant.model'
import { Avatar } from 'primeng/avatar'
import { AppRouteEnum } from '../../../app-route.enum'
import { Tag } from 'primeng/tag'
import { SeverityTagComponent } from '../../../shared/util-ui/severity-tag/severity-tag.component'
import { Skeleton } from 'primeng/skeleton'
import { DateIntervalStatusModel } from '../../../shared/util-model/model/date-interval-status.model'
import { DateUtil } from '../../../shared/util-tool/util/date.util'
import { GenericElementComponent } from '../../../shared/util-tool/component/generic-element.component'
import { GroupUtil } from '../../../shared/util-tool/util/group.util'
import { PluralTranslationPipe } from '../../../shared/util-tool/pipe/plural-translation.pipe'
import { VisibilityNamePipe } from '../../../shared/util-tool/pipe/visibility.pipe'
import { IntervalFormatPipe } from '../../../shared/util-tool/pipe/interval-format.pipe'
import { CustomDateFormatPipe } from '../../../shared/util-tool/pipe/custom-date-format.pipe'
import { ConfirmationDialogComponent } from '../../../shared/util-ui/confirmation-dialog/confirmation-dialog.component'
import { tap } from 'rxjs'

@Component( {
    selector: 'app-group-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TranslatePipe,
        TitleCasePipe,
        UpperCasePipe,
        LayerComponent,
        Listbox,
        Tab,
        TabList,
        TabPanel,
        TabPanels,
        Tabs,
        Avatar,
        Tag,
        SeverityTagComponent,
        Skeleton,
        PluralTranslationPipe,
        VisibilityNamePipe,
        IntervalFormatPipe,
        CustomDateFormatPipe,
        ConfirmationDialogComponent,
    ],
    templateUrl: './group-element.component.html',
    styleUrl: './group-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class GroupElementComponent extends GenericElementComponent<GroupModel, GroupActionEnum> implements OnDestroy {
    protected readonly facade: GroupFacade = inject( GroupFacade )

    protected layerOpened: boolean = false
    protected activeTab: number = 1

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly group: InputSignal<GroupModel> = input.required()

    protected readonly actions: Signal<ActionModel<GroupActionEnum>[]>
    protected readonly intervalStatus: Signal<DateIntervalStatusModel | undefined>
    protected readonly additionalTotal: Signal<number>
    protected readonly adults: Signal<ParticipantModel[]>
    protected readonly children: Signal<ParticipantModel[]>

    public constructor () {
        super()

        this.intervalStatus = computed( (): DateIntervalStatusModel => DateUtil.dateRangeStatus(
            this.group().startAvailability,
            this.group().endAvailability,
        ) )

        this.actions = computed( (): ActionModel<GroupActionEnum>[] => this.buildActions(
            this.group(),
            AppConfig.config.group.action,
        ) )

        this.additionalTotal = computed( (): number => this.group().members.length - 1 )
        this.adults = computed( (): ParticipantModel[] => GroupUtil.getAdults( this.group() ) )
        this.children = computed( (): ParticipantModel[] => GroupUtil.getChildren( this.group() ) )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected isActionVisible (element: GroupModel, action: ActionModel<GroupActionEnum>): boolean {
        switch (action.id) {
            case GroupActionEnum.DISABLE_GROUP:
                return element.visible
            case GroupActionEnum.ENABLE_GROUP:
                return !element.visible
            default:
                return true
        }
    }

    protected handleAction (action: GroupActionEnum): void {
        switch (action) {
            case GroupActionEnum.FETCH_GROUP_MEMBERS_PAGE:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.GROUP_MEMBERS.replace( ':groupId', this.group().id ) ),
                ).catch( console.error )
                break
            case GroupActionEnum.UPDATE_GROUP:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.GROUPS_EDITION.replace( ':groupId', this.group().id ) ),
                ).catch( console.error )
                break
            case GroupActionEnum.DISABLE_GROUP:
                this.subscriptions.add(
                    this.facade.disableGroup( this.group().id ).pipe(
                        tap( () => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            case GroupActionEnum.ENABLE_GROUP:
                this.subscriptions.add(
                    this.facade.enableGroup( this.group().id ).pipe(
                        tap( () => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            case GroupActionEnum.DELETE_GROUP:
                this.subscriptions.add(
                    this.facade.deleteGroup( this.group() ).pipe(
                        tap( () => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }
}
