import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal } from '@angular/core'
import { ElementCardComponent } from '../../../shared/util-ui/element-card/element-card.component'
import { TagModule } from 'primeng/tag'
import { TranslateModule } from '@ngx-translate/core'
import { AppConfig } from '../../../app.config'
import { ChipModule } from 'primeng/chip'
import { ActionModel } from '../../../shared/util-model/model/action.model'
import { AppRouteEnum } from '../../../app-route.enum'
import { ActivityActionEnum } from '../data/state/activity.action'
import { ActivityFacade } from '../data/state/activity.facade'
import { SeverityTagComponent } from '../../../shared/util-ui/severity-tag/severity-tag.component'
import { DateIntervalStatusModel } from '../../../shared/util-model/model/date-interval-status.model'
import { DateUtil } from '../../../shared/util-tool/util/date.util'
import { GenericElementComponent } from '../../../shared/util-tool/component/generic-element.component'
import { ActivityModel } from '../../../shared/util-model/model/activity.model'
import { IntervalFormatPipe } from '../../../shared/util-tool/pipe/interval-format.pipe'
import { VisibilityNamePipe } from '../../../shared/util-tool/pipe/visibility.pipe'
import { CustomDateFormatPipe } from '../../../shared/util-tool/pipe/custom-date-format.pipe'

@Component( {
    selector: 'app-activity-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TagModule,
        TranslateModule,
        ChipModule,
        SeverityTagComponent,
        IntervalFormatPipe,
        VisibilityNamePipe,
        CustomDateFormatPipe,
    ],
    templateUrl: './activity-element.component.html',
    styleUrl: './activity-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class ActivityElementComponent extends GenericElementComponent<ActivityModel, ActivityActionEnum> {
    private readonly facade: ActivityFacade = inject( ActivityFacade )

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly activity: InputSignal<ActivityModel> = input.required()

    protected readonly actions: Signal<ActionModel<ActivityActionEnum>[]>
    protected readonly intervalStatus: Signal<DateIntervalStatusModel | undefined>

    public constructor () {
        super()

        this.intervalStatus = computed( (): DateIntervalStatusModel => DateUtil.dateRangeStatus(
            this.activity().startAvailability,
            this.activity().endAvailability,
        ) )

        this.actions = computed( (): ActionModel<ActivityActionEnum>[] => this.buildActions(
            this.activity(),
            AppConfig.config.activity.action,
        ) )
    }

    protected isActionVisible (element: ActivityModel, action: ActionModel<ActivityActionEnum>): boolean {
        switch (action.id) {
            case ActivityActionEnum.DISABLE_ACTIVITY:
                return element.visible
            case ActivityActionEnum.ENABLE_ACTIVITY:
                return !element.visible
            default:
                return true
        }
    }

    protected handleAction (action: ActivityActionEnum): void {
        switch (action) {
            case ActivityActionEnum.FETCH_ACTIVITY_MOVEMENTS_PAGE:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.ACTIVITIES_MOVEMENTS.replace( ':activityId', this.activity().id ) ),
                ).catch( console.error )
                break
            case ActivityActionEnum.UPDATE_ACTIVITY:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.ACTIVITIES_EDITION.replace( ':activityId', this.activity().id ) ),
                ).catch( console.error )
                break
            case ActivityActionEnum.DISABLE_ACTIVITY:
                this.facade.disableActivity( this.activity().id, this.contextEventId() )
                break
            case ActivityActionEnum.ENABLE_ACTIVITY:
                this.facade.enableActivity( this.activity().id, this.contextEventId() )
                break
            case ActivityActionEnum.DELETE_ACTIVITY:
                this.facade.deleteActivity( this.activity(), this.contextEventId() )
                break
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }
}
