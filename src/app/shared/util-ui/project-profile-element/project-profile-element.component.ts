import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    InputSignal,
    OnDestroy,
    signal,
    Signal,
} from '@angular/core'
import { ProjectProfileModel } from '../../util-model/model/project-profile.model'
import { ChipModule } from 'primeng/chip'
import { TitleCasePipe, UpperCasePipe } from '@angular/common'
import { ElementCardComponent } from '../element-card/element-card.component'
import { TranslateModule } from '@ngx-translate/core'
import { BadgeModule } from 'primeng/badge'
import { ActionModel } from '../../util-model/model/action.model'
import { Button } from 'primeng/button'
import { ConfirmationService } from 'primeng/api'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import {
    ProjectProfileFacade,
} from '../../../domains/project/configuration/project-profile/data/state/project-profile.facade'
import { AppRouteEnum } from '../../../app-route.enum'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { SeverityTagComponent } from '../severity-tag/severity-tag.component'
import { DateIntervalStatusModel } from '../../util-model/model/date-interval-status.model'
import { DateUtil } from '../../util-tool/util/date.util'
import { GenericElementComponent } from '../../util-tool/component/generic-element.component'
import { IntervalFormatPipe } from '../../util-tool/pipe/interval-format.pipe'
import { CustomDateFormatPipe } from '../../util-tool/pipe/custom-date-format.pipe'
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component'
import { Subscription, tap } from 'rxjs'
import { ProfileStatusEnum } from '../../util-model/enumeration/profile-status.enum'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'
import { ProjectAuthorityEnum } from '../../util-model/enumeration/project-authority.enum'
import { ElementActionEnum } from '../../util-model/enumeration/element-action.enum'
import { AppConfig } from '../../../app.config'

@Component( {
    selector: 'app-project-profile-element',
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
    providers: [ ConfirmationService, ProjectProfileFacade ],
    templateUrl: './project-profile-element.component.html',
    styleUrl: './project-profile-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class ProjectProfileElementComponent extends GenericElementComponent<ProjectProfileModel> implements OnDestroy {
    protected readonly facade: ProjectProfileFacade = inject( ProjectProfileFacade )
    private readonly confirmationService: ConfirmationService = inject( ConfirmationService )
    protected readonly ProfileStatusEnum: typeof ProfileStatusEnum = ProfileStatusEnum
    protected readonly subscriptions: Subscription = new Subscription()

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly view: InputSignal<'user' | 'project'> = input.required()
    public readonly profile: InputSignal<ProjectProfileModel> = input.required()

    private readonly allActions: Signal<ActionModel[]> = signal( [
        {
            id: ElementActionEnum.PROJECT_PROFILE_SELECT,
            label: 'project-profiles.actions.select',
            icon: 'pi pi-arrow-right',
            disabled: false,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: undefined,
            requiredProjectOption: undefined,
        },
        {
            id: ElementActionEnum.PROJECT_PROFILE_UPDATE,
            label: 'project-profiles.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: false,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U,
            requiredProjectOption: undefined,
            confirmation: undefined,
        },
        {
            id: ElementActionEnum.PROJECT_PROFILE_BLOCK,
            label: 'project-profiles.actions.disable',
            icon: 'pi pi-ban',
            disabled: false,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U,
            requiredProjectOption: undefined,
            confirmation: {
                header: 'project-profiles.actions.confirmations.disable.title',
                message: 'project-profiles.actions.confirmations.disable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: undefined,
            },
        },
        {
            id: ElementActionEnum.PROJECT_PROFILE_UNBLOCK,
            label: 'project-profiles.actions.enable',
            icon: 'pi pi-replay',
            disabled: false,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U,
            requiredProjectOption: undefined,
            confirmation: {
                header: 'project-profiles.actions.confirmations.enable.title',
                message: 'project-profiles.actions.confirmations.enable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.SUCCESS,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: undefined,
            },
        },
        {
            id: ElementActionEnum.PROJECT_PROFILE_DELETE,
            label: 'project-profiles.actions.delete',
            icon: 'pi pi-trash',
            disabled: false,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_D,
            requiredProjectOption: undefined,
            confirmation: {
                header: 'project-profiles.actions.confirmations.delete.title',
                message: 'project-profiles.actions.confirmations.delete.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.DANGER,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: undefined,
            },
        },
    ] )
    protected readonly actions: Signal<ActionModel[]>
    protected readonly intervalStatus: Signal<DateIntervalStatusModel | undefined>

    public constructor () {
        super()

        this.intervalStatus = computed( (): DateIntervalStatusModel => DateUtil.dateRangeStatus(
            this.profile().startAccess,
            this.profile().endAccess,
        ) )

        this.actions = computed( (): ActionModel[] => this.buildActions(
            this.profile(),
            this.allActions(),
        ) )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected isActionVisible (element: ProjectProfileModel, action: ActionModel): boolean {
        if (!AppConfig.config.projectProfile.actions.includes( action.id )) return false

        const currentUser: CurrentUserModel | undefined = this.registryFacade.currentUser()
        const isCurrentUserProfile: boolean = currentUser?.id === element.user.id

        switch (action.id) {
            case ElementActionEnum.PROJECT_PROFILE_SELECT:
                return isCurrentUserProfile
            case ElementActionEnum.PROJECT_PROFILE_UPDATE:
                return !isCurrentUserProfile
            case ElementActionEnum.PROJECT_PROFILE_BLOCK:
                return !isCurrentUserProfile && element.visible
            case ElementActionEnum.PROJECT_PROFILE_UNBLOCK:
                return !isCurrentUserProfile && !element.visible
            default:
                return true
        }
    }

    protected override disabledAction (
        element: ProjectProfileModel,
        action: ActionModel,
    ): boolean {
        const isNotFeasible: boolean = super.disabledAction( element, action )

        if (action.id === ElementActionEnum.PROJECT_PROFILE_SELECT) {
            const currentUser: CurrentUserModel | undefined = this.registryFacade.currentUser()
            const isCurrentUserSelectedProfile: boolean = currentUser?.preferences?.selectedProfile?.id === element.id

            return isCurrentUserSelectedProfile || isNotFeasible
        }

        return isNotFeasible
    }

    protected handleAction (action: ElementActionEnum): void {
        switch (action) {
            case ElementActionEnum.PROJECT_PROFILE_SELECT:
                this.subscriptions.add(
                    this.registryFacade.selectUserProjectProfile( this.profile().id ).pipe(
                        tap( () => this.router.navigateByUrl( AppRouteEnum.PROJECTS_SELECTED ).catch( console.error ) ),
                    ).subscribe(),
                )
                break
            case ElementActionEnum.PROJECT_PROFILE_UPDATE:
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_CONFIGURATION_PROFILES_EDITION.replace( ':profileId', this.profile().id ),
                ).catch( console.error )
                break
            case ElementActionEnum.PROJECT_PROFILE_BLOCK:
                this.facade.blockProjectProfile( this.profile() )
                break
            case ElementActionEnum.PROJECT_PROFILE_UNBLOCK:
                this.facade.unblockProjectProfile( this.profile() )
                break
            case ElementActionEnum.PROJECT_PROFILE_DELETE: {
                if (this.profile().user.id === this.registryFacade.currentUser()?.id) {
                    this.registryFacade.deleteUserProjectProfile( this.profile() )
                } else {
                    this.facade.deleteProjectProfile( this.profile() )
                }
                break
            }
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }

    protected severityFromStatus (status: ProfileStatusEnum): SeverityEnum {
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

    protected confirmManageAcceptance (status: ProfileStatusEnum): void {
        this.confirmationService.confirm( {
            header: this.translateService.instant( `project-profiles.actions.confirmations.${status}.title` ),
            message: this.translateService.instant(
                `project-profiles.actions.confirmations.${status}.message`,
                { element: this.profile() },
            ),
            icon: status === ProfileStatusEnum.ACCEPTED ? 'pi pi-info-circle' : 'pi pi-exclamation-triangle',
            acceptLabel: this.translateService.instant( 'global.actions.confirm' ),
            rejectLabel: this.translateService.instant( 'global.actions.cancel' ),
            acceptButtonStyleClass: `p-button p-button-rounded p-button-outlined ${status === ProfileStatusEnum.ACCEPTED ? 'p-button-success' : 'p-button-danger'}`,
            rejectButtonStyleClass: 'p-button p-button-rounded p-button-text p-button-secondary',
            accept: (): void => this.manageAcceptance( status === ProfileStatusEnum.ACCEPTED ),
        } )
    }

    protected manageAcceptance (accepted: boolean): void {
        this.registryFacade.manageProjectInvitationAcceptance( this.profile().id, accepted )
    }
}
