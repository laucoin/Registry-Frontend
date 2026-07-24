import {ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal} from '@angular/core'
import {ElementCardComponent} from '../../../../../shared/util-ui/element-card/element-card.component'
import {TagModule} from 'primeng/tag'
import {TranslatePipe} from '@ngx-translate/core'
import {ChipModule} from 'primeng/chip'
import {AppRouteEnum} from '../../../../../app-route.enum'
import {ActivityFacade} from '../data/state/activity.facade'
import {SeverityTagComponent} from '../../../../../shared/util-ui/severity-tag/severity-tag.component'
import {GenericElementComponent} from '../../../../../shared/util-tool/component/generic-element.component'
import {ActivityModel} from '../../../../../shared/util-model/model/activity.model'
import {CustomDateFormatPipe} from '../../../../../shared/util-tool/pipe/custom-date-format.pipe'
import {ReactiveFormsModule} from '@angular/forms'
import {SeverityCircleComponent} from '../../../../../shared/util-ui/severity-circle/severity-circle.component'
import {ProjectAuthorityEnum} from '../../../../../shared/util-model/enumeration/project-authority.enum'
import {SeverityEnum} from '../../../../../shared/util-model/enumeration/severity.enum'
import {ElementActionEnum} from '../../../../../shared/util-model/enumeration/element-action.enum'
import {ProjectOptionIconPipe} from '../../../../../shared/util-tool/pipe/project-option-icon.pipe'
import {MenuItem} from 'primeng/api'
import {AvailabilityStatusEnum} from '../../../../../shared/util-model/enumeration/availability-status.enum'
import {MessageComponent} from '../../../../../shared/util-ui/message/message.component'

@Component({
    selector: 'app-activity-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TagModule,
        TranslatePipe,
        ChipModule,
        SeverityTagComponent,
        CustomDateFormatPipe,
        ReactiveFormsModule,
        SeverityCircleComponent,
        ProjectOptionIconPipe,
        MessageComponent,
    ],
    templateUrl: './activity-element.component.html',
    styleUrl: './activity-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityElementComponent extends GenericElementComponent {
    protected readonly facade: ActivityFacade = inject(ActivityFacade)

    public readonly actionMenuVisible: InputSignal<boolean> = input(true)
    public readonly activity: InputSignal<ActivityModel> = input.required()

    protected readonly actions: Signal<MenuItem[]> = computed((): MenuItem[] => [
        {
            label: 'activities.actions.movements-history',
            icon: 'pi pi-history',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_HISTORY_R),
            visible: this.actionIsEnable(ElementActionEnum.ACTIVITY_CONSULT_MOVEMENTS),
            command: (): void => {
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_CONFIGURATION_ACTIVITIES_MOVEMENTS.replace(
                        ':activityId',
                        this.activity().id,
                    ),
                ).catch(console.error)
            },
        },
        {
            label: 'activities.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_U),
            visible: this.actionIsEnable(ElementActionEnum.ACTIVITY_UPDATE),
            command: (): void => {
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_CONFIGURATION_ACTIVITIES_EDITION.replace(':activityId', this.activity().id),
                ).catch(console.error)
            },
        },
        {
            label: 'activities.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_U),
            visible: this.actionIsEnable(ElementActionEnum.ACTIVITY_DISABLE) && this.activity().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'activities.actions.confirmations.disable',
                        'pi pi-exclamation-triangle',
                        this.activity(),
                        SeverityEnum.WARNING,
                        (): void => this.facade.disableActivity(this.activity().id),
                    ),
                )
            },
        },
        {
            label: 'activities.actions.enable',
            icon: 'pi pi-replay',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_U),
            visible: this.actionIsEnable(ElementActionEnum.ACTIVITY_ENABLE) && !this.activity().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'activities.actions.confirmations.enable',
                        'pi pi-info-circle',
                        this.activity(),
                        SeverityEnum.INFO,
                        (): void => this.facade.enableActivity(this.activity().id),
                    ),
                )
            },
        },
        {
            id: ElementActionEnum.ACTIVITY_DELETE,
            label: 'activities.actions.delete',
            icon: 'pi pi-trash',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_D),
            visible: this.actionIsEnable(ElementActionEnum.ACTIVITY_DELETE),
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'activities.actions.confirmations.delete',
                        'pi pi-exclamation-triangle',
                        this.activity(),
                        SeverityEnum.DANGER,
                        (): void => this.facade.deleteActivity(this.activity()),
                    ),
                )
            },
        },
    ])

    protected readonly statusSeverity: Signal<SeverityEnum> = computed((): SeverityEnum =>
        this.activity().status?.value === AvailabilityStatusEnum.AVAILABLE ? SeverityEnum.SUCCESS : SeverityEnum.INFO,
    )
}
