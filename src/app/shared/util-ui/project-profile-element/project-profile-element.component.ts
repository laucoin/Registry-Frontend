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
import { ProjectProfileModel } from '../../util-model/model/project-profile.model'
import { ChipModule } from 'primeng/chip'
import { TitleCasePipe, UpperCasePipe } from '@angular/common'
import { ElementCardComponent } from '../element-card/element-card.component'
import { TranslateModule } from '@ngx-translate/core'
import { BadgeModule } from 'primeng/badge'
import { Button } from 'primeng/button'
import { ConfirmationService, MenuItem } from 'primeng/api'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import {
    ProjectProfileFacade,
} from '../../../domains/project/configuration/project-profile/data/state/project-profile.facade'
import { AppRouteEnum } from '../../../app-route.enum'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { SeverityTagComponent } from '../severity-tag/severity-tag.component'
import { GenericElementComponent } from '../../util-tool/component/generic-element.component'
import { CustomDateFormatPipe } from '../../util-tool/pipe/custom-date-format.pipe'
import { Subscription, tap } from 'rxjs'
import { ProfileStatusEnum } from '../../util-model/enumeration/profile-status.enum'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'
import { ProjectAuthorityEnum } from '../../util-model/enumeration/project-authority.enum'
import { ElementActionEnum } from '../../util-model/enumeration/element-action.enum'
import { AvailabilityStatusEnum } from '../../util-model/enumeration/availability-status.enum'

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
        CustomDateFormatPipe,
    ],
    providers: [ ConfirmationService, ProjectProfileFacade ],
    templateUrl: './project-profile-element.component.html',
    styleUrl: './project-profile-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class ProjectProfileElementComponent extends GenericElementComponent implements OnDestroy {
    protected readonly facade: ProjectProfileFacade = inject( ProjectProfileFacade )
    protected readonly ProfileStatusEnum: typeof ProfileStatusEnum = ProfileStatusEnum
    protected readonly subscriptions: Subscription = new Subscription()

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly view: InputSignal<'user' | 'project'> = input.required()
    public readonly profile: InputSignal<ProjectProfileModel> = input.required()

    protected readonly actions: Signal<MenuItem[]> = computed( (): MenuItem[] => {
        const currentUser: CurrentUserModel | undefined = this.registryFacade.currentUser()
        const isCurrentUserProfile: boolean = currentUser?.id === this.profile().user.id

        return [
            {
                label: 'project-profiles.actions.select',
                icon: 'pi pi-arrow-right',
                visible: isCurrentUserProfile && this.actionIsEnable( ElementActionEnum.PROJECT_PROFILE_SELECT ),
                command: (): void => {
                    this.subscriptions.add(
                        this.registryFacade.selectUserProjectProfile( this.profile().id ).pipe(
                            tap( () => this.router.navigateByUrl( AppRouteEnum.PROJECTS_SELECTED ).catch( console.error ) ),
                        ).subscribe(),
                    )
                },
            },
            {
                label: 'project-profiles.actions.edit',
                icon: 'pi pi-pen-to-square',
                disabled: this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U ),
                visible: !isCurrentUserProfile && this.actionIsEnable( ElementActionEnum.PROJECT_PROFILE_UPDATE ),
                command: (): void => {
                    this.router.navigateByUrl(
                        AppRouteEnum.PROJECTS_CONFIGURATION_PROFILES_EDITION.replace( ':profileId', this.profile().id ),
                    ).catch( console.error )
                },
            },
            {
                label: 'project-profiles.actions.disable',
                icon: 'pi pi-ban',
                disabled: this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U ),
                visible: !isCurrentUserProfile && this.actionIsEnable( ElementActionEnum.PROJECT_PROFILE_BLOCK ) && this.profile().visible,
                command: (): void => {
                    this.confirmationService.confirm(
                        this.buildConfirmation(
                            'project-profiles.actions.confirmations.disable',
                            'pi pi-exclamation-triangle',
                            this.profile(),
                            SeverityEnum.WARNING,
                            (): void => this.facade.blockProjectProfile( this.profile() ),
                        ),
                    )
                },
            },
            {
                label: 'project-profiles.actions.enable',
                icon: 'pi pi-replay',
                disabled: this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U ),
                visible: !isCurrentUserProfile && this.actionIsEnable( ElementActionEnum.PROJECT_PROFILE_UNBLOCK ) && !this.profile().visible,
                command: (): void => {
                    this.confirmationService.confirm(
                        this.buildConfirmation(
                            'project-profiles.actions.confirmations.enable',
                            'pi pi-info-circle',
                            this.profile(),
                            SeverityEnum.INFO,
                            (): void => this.facade.unblockProjectProfile( this.profile() ),
                        ),
                    )
                },
            },
            {
                label: 'project-profiles.actions.delete',
                icon: 'pi pi-trash',
                disabled: this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_D ),
                visible: this.actionIsEnable( ElementActionEnum.PROJECT_PROFILE_DELETE ),
                command: (): void => {
                    this.confirmationService.confirm(
                        this.buildConfirmation(
                            'project-profiles.actions.confirmations.delete',
                            'pi pi-exclamation-triangle',
                            this.profile(),
                            SeverityEnum.DANGER,
                            (): void => this.facade.deleteProjectProfile( this.profile() ),
                        ),
                    )
                },
            },
        ]
    } )

    protected readonly availabilityStatusSeverity: Signal<SeverityEnum> = computed( (): SeverityEnum =>
        this.profile().availabilityStatus?.value === AvailabilityStatusEnum.AVAILABLE ? SeverityEnum.SUCCESS : SeverityEnum.INFO,
    )

    protected readonly statusSeverity: Signal<SeverityEnum> = computed( (): SeverityEnum => this.severityFromStatus(
        this.profile().status.value ) )

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    private severityFromStatus (status: ProfileStatusEnum): SeverityEnum {
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
