import {
    Component,
    computed,
    inject,
    input,
    InputSignal,
    OnDestroy,
    Signal,
} from '@angular/core'
import {ProjectProfileModel} from '@shared/models/model/project-profile.model'
import {ChipModule} from 'primeng/chip'
import {TitleCasePipe, UpperCasePipe} from '@angular/common'
import {ElementCardComponent} from '@shared/ui/common/element-card/element-card.component'
import {TranslocoPipe} from '@jsverse/transloco'
import {BadgeModule} from 'primeng/badge'
import {Button} from 'primeng/button'
import {ConfirmationService, MenuItem} from 'primeng/api'
import {ConfirmDialogModule} from 'primeng/confirmdialog'
import {
    ProjectProfileFacade,
} from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import {RegistryRouteEnum} from '@core/routing/registry-route.enum'
import {SeverityTagComponent} from '@shared/ui/common/severity-tag/severity-tag.component'
import {GenericElementComponent} from '@shared/ui/base/generic-element.component'
import {CustomDateFormatPipe} from '@shared/helpers/pipe/custom-date-format.pipe'
import {Subscription} from 'rxjs'
import {ProfileStatusEnum} from '@shared/models/enumeration/profile-status.enum'
import {SeverityEnum} from '@shared/models/enumeration/severity.enum'
import {ProjectAuthorityEnum} from '@shared/models/enumeration/project-authority.enum'
import {ElementActionEnum} from '@shared/models/enumeration/element-action.enum'
import {AvailabilityStatusEnum} from '@shared/models/enumeration/availability-status.enum'

/**
 * Purpose: Card presenting one project profile with its actions.
 * Scope: Renders the details, the actions menu and the confirmations of the element.
 * Limits: Receives the element as an input and calls the facade for commands; it holds no list state.
 */
@Component({
    selector: 'app-project-profile-element',
    imports: [
        ChipModule,
        ElementCardComponent,
        TranslocoPipe,
        BadgeModule,
        Button,
        ConfirmDialogModule,
        TitleCasePipe,
        UpperCasePipe,
        SeverityTagComponent,
        CustomDateFormatPipe,
    ],
    providers: [ConfirmationService, ProjectProfileFacade],
    templateUrl: './project-profile-element.component.html',
    styleUrl: './project-profile-element.component.css',
})
export class ProjectProfileElementComponent extends GenericElementComponent implements OnDestroy {
    protected readonly facade: ProjectProfileFacade = inject(ProjectProfileFacade)
    protected readonly ProfileStatusEnum: typeof ProfileStatusEnum = ProfileStatusEnum
    protected readonly subscriptions: Subscription = new Subscription()

    public readonly actionMenuVisible: InputSignal<boolean> = input(true)
    public readonly view: InputSignal<'user' | 'project'> = input.required()
    public readonly profile: InputSignal<ProjectProfileModel> = input.required()

    private readonly isCurrentUserProfile: Signal<boolean> = computed((): boolean => this.sessionFacade.currentUser()?.id === this.profile().user.id)
    private readonly isSelectedProfile: Signal<boolean> = computed((): boolean => this.sessionFacade.selectedProject()?.id === this.profile().project.id)

    protected readonly actions: Signal<MenuItem[]> = computed((): MenuItem[] => [
        this.selectAction(),
        this.editAction(),
        this.disableAction(),
        this.enableAction(),
        this.deleteAction(),
    ])

    private selectAction(): MenuItem {
        return {
                label: 'project-profiles.actions.select',
                icon: 'pi pi-arrow-right',
                visible: this.isCurrentUserProfile() && !this.isSelectedProfile() && this.actionIsEnable(ElementActionEnum.PROJECT_PROFILE_SELECT),
                command: (): void => {
                    this.router.navigateByUrl(
                        RegistryRouteEnum.PROJECT.replace(':projectId', this.profile().project.id),
                    ).catch(console.error)
                },
            }
    }

    private editAction(): MenuItem {
        return {
                label: 'project-profiles.actions.edit',
                icon: 'pi pi-pen-to-square',
                disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U),
                visible: !this.isCurrentUserProfile() && this.actionIsEnable(ElementActionEnum.PROJECT_PROFILE_UPDATE),
                command: (): void => {
                    this.router.navigateByUrl(
                        RegistryRouteEnum.PROJECTS_CONFIGURATION_PROFILES_EDITION.replace(':profileId', this.profile().id).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
                    ).catch(console.error)
                },
            }
    }

    private disableAction(): MenuItem {
        return {
                label: 'project-profiles.actions.disable',
                icon: 'pi pi-ban',
                disabled: this.busy() || !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U),
                visible: !this.isCurrentUserProfile() && this.actionIsEnable(ElementActionEnum.PROJECT_PROFILE_BLOCK) && this.profile().visible && this.profile().status?.value === ProfileStatusEnum.ACCEPTED,
                command: this.confirmThen(
                    'project-profiles.actions.confirmations.disable',
                    'pi pi-exclamation-triangle',
                    this.profile(),
                    SeverityEnum.WARNING,
                    (): void => this.run(this.facade.blockProjectProfile(this.profile())),
                ),
            }
    }

    private enableAction(): MenuItem {
        return {
                label: 'project-profiles.actions.enable',
                icon: 'pi pi-replay',
                disabled: this.busy() || !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U),
                visible: !this.isCurrentUserProfile() && this.actionIsEnable(ElementActionEnum.PROJECT_PROFILE_UNBLOCK) && !this.profile().visible,
                command: this.confirmThen(
                    'project-profiles.actions.confirmations.enable',
                    'pi pi-info-circle',
                    this.profile(),
                    SeverityEnum.INFO,
                    (): void => this.run(this.facade.unblockProjectProfile(this.profile())),
                ),
            }
    }

    private deleteAction(): MenuItem {
        return {
                label: 'project-profiles.actions.delete',
                icon: 'pi pi-trash',
                disabled: this.busy() || !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_D),
                visible: this.actionIsEnable(ElementActionEnum.PROJECT_PROFILE_DELETE),
                command: this.confirmThen(
                    'project-profiles.actions.confirmations.delete',
                    'pi pi-exclamation-triangle',
                    this.profile(),
                    SeverityEnum.DANGER,
                    (): void => this.run(this.facade.deleteProjectProfile(this.profile())),
                ),
            }
    }

    protected readonly availabilityStatusSeverity: Signal<SeverityEnum> = computed((): SeverityEnum =>
        this.profile().availabilityStatus?.value === AvailabilityStatusEnum.AVAILABLE ? SeverityEnum.SUCCESS : SeverityEnum.INFO,
    )

    protected readonly statusSeverity: Signal<SeverityEnum> = computed((): SeverityEnum => this.severityFromStatus(
        this.profile().status.value))

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

    private severityFromStatus(status: ProfileStatusEnum): SeverityEnum {
        switch (status) {
            case ProfileStatusEnum.ACCEPTED:
                return SeverityEnum.SUCCESS
            case ProfileStatusEnum.REJECTED:
                return SeverityEnum.WARNING
            case ProfileStatusEnum.BLOCKED:
                return SeverityEnum.DANGER
            default:
                return SeverityEnum.INFO
        }
    }

    protected confirmManageAcceptance(status: ProfileStatusEnum): void {
        this.confirmationService.confirm({
            header: this.translateService.translate(`project-profiles.actions.confirmations.${status}.title`),
            message: this.translateService.translate(
                `project-profiles.actions.confirmations.${status}.message`,
                {element: this.profile()},
            ),
            icon: status === ProfileStatusEnum.ACCEPTED ? 'pi pi-info-circle' : 'pi pi-exclamation-triangle',
            acceptLabel: this.translateService.translate('global.actions.confirm'),
            rejectLabel: this.translateService.translate('global.actions.cancel'),
            acceptButtonStyleClass: `p-button p-button-rounded p-button-outlined ${status === ProfileStatusEnum.ACCEPTED ? 'p-button-success' : 'p-button-danger'}`,
            rejectButtonStyleClass: 'p-button p-button-rounded p-button-text p-button-secondary',
            accept: (): void => this.manageAcceptance(status === ProfileStatusEnum.ACCEPTED),
        })
    }

    protected manageAcceptance(accepted: boolean): void {
        this.registryFacade.manageProjectInvitationAcceptance(this.profile().id, accepted)
    }
}
