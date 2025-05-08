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
import { ProjectModel } from '../../../shared/util-model/model/project.model'
import { ElementCardComponent } from '../../../shared/util-ui/element-card/element-card.component'
import { TagModule } from 'primeng/tag'
import { TranslateModule } from '@ngx-translate/core'
import { ChipModule } from 'primeng/chip'
import { ActionModel } from '../../../shared/util-model/model/action.model'
import { ProjectFacade } from '../data/state/project.facade'
import { AppRouteEnum } from '../../../app-route.enum'
import { SeverityTagComponent } from '../../../shared/util-ui/severity-tag/severity-tag.component'
import { DateUtil } from '../../../shared/util-tool/util/date.util'
import { DateIntervalStatusModel } from '../../../shared/util-model/model/date-interval-status.model'
import { LayerComponent } from '../../../shared/util-ui/layer/layer.component'
import { Listbox } from 'primeng/listbox'
import { GenericElementComponent } from '../../../shared/util-tool/component/generic-element.component'
import { CurrentUserUtil } from '../../../shared/util-authentication/tool/current-user.util'
import { ConfirmationDialogComponent } from '../../../shared/util-ui/confirmation-dialog/confirmation-dialog.component'
import { Subscription, tap } from 'rxjs'
import { UserAuthorityEnum } from '../../../shared/util-model/enumeration/user-authority.enum'
import { ProjectAuthorityEnum } from '../../../shared/util-model/enumeration/project-authority.enum'
import { Button } from 'primeng/button'
import { PluralTranslationPipe } from '../../../shared/util-tool/pipe/plural-translation.pipe'
import { CustomDateFormatPipe } from '../../../shared/util-tool/pipe/custom-date-format.pipe'
import { IntervalFormatPipe } from '../../../shared/util-tool/pipe/interval-format.pipe'
import { SeverityCircleComponent } from '../../../shared/util-ui/severity-circle/severity-circle.component'
import { SeverityEnum } from '../../../shared/util-model/enumeration/severity.enum'
import { ElementActionEnum } from '../../../shared/util-model/enumeration/element-action.enum'
import { AppConfig } from '../../../app.config'

@Component( {
    selector: 'app-project-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TagModule,
        TranslateModule,
        ChipModule,
        SeverityTagComponent,
        LayerComponent,
        Listbox,
        ConfirmationDialogComponent,
        Button,
        PluralTranslationPipe,
        CustomDateFormatPipe,
        IntervalFormatPipe,
        SeverityCircleComponent,
    ],
    templateUrl: './project-element.component.html',
    styleUrl: './project-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class ProjectElementComponent extends GenericElementComponent<ProjectModel> implements OnDestroy {
    protected readonly facade: ProjectFacade = inject( ProjectFacade )
    protected readonly subscriptions: Subscription = new Subscription()

    protected layerOpened: boolean = false

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly project: InputSignal<ProjectModel> = input.required()

    private readonly allActions: Signal<ActionModel[]> = signal( [
        {
            id: ElementActionEnum.PROJECT_UPDATE,
            label: 'projects.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_U,
        },
        {
            id: ElementActionEnum.PROJECT_DISABLE,
            label: 'projects.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_U,
            confirmation: {
                header: 'projects.actions.confirmations.disable.title',
                message: 'projects.actions.confirmations.disable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
            },
        },
        {
            id: ElementActionEnum.PROJECT_ENABLE,
            label: 'projects.actions.enable',
            icon: 'pi pi-replay',
            disabled: true,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_U,
            confirmation: {
                header: 'projects.actions.confirmations.enable.title',
                message: 'projects.actions.confirmations.enable.message',
                icon: 'pi pi-info-circle',
                acceptSeverity: SeverityEnum.SUCCESS,
                rejectSeverity: SeverityEnum.SECONDARY,
            },
        },
        {
            id: ElementActionEnum.PROJECT_DELETE,
            label: 'projects.actions.delete',
            icon: 'pi pi-trash',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_D,
            confirmation: {
                header: 'projects.actions.confirmations.delete.title',
                message: 'projects.actions.confirmations.delete.message',
                hint: 'projects.actions.confirmations.delete.hint',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: 'danger',
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: 'name',
            },
        },
    ] )

    protected readonly buttonAction: Signal<ActionModel | undefined> = computed( (): ActionModel | undefined =>
        this.hasAnyProjectAuthority( this.project() )
        ? {
                id: ElementActionEnum.PROJECT_SELECT_PROFILE,
                label: 'projects.actions.select',
                icon: 'pi pi-arrow-right',
                disabled: false,
            } : AppConfig.config.project.actions.includes( ElementActionEnum.PROJECT_CREATE_SUPPORT_PROFILE ) ? {
            id: ElementActionEnum.PROJECT_CREATE_SUPPORT_PROFILE,
            label: 'projects.actions.create-support',
            icon: 'pi pi-user-plus',
            disabled: false,
            requiredUserAuthority: UserAuthorityEnum.REGISTRY_PROFILE_C,
            confirmation: {
                header: 'projects.actions.confirmations.create-support.title',
                message: 'projects.actions.confirmations.create-support.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
            },
        } : undefined,
    )
    protected readonly actions: Signal<ActionModel[]>
    protected readonly intervalStatus: Signal<DateIntervalStatusModel | undefined>

    public constructor () {
        super()

        this.actions = computed( (): ActionModel[] => this.buildActions(
            this.project(),
            this.allActions(),
        ) )

        this.intervalStatus = computed( (): DateIntervalStatusModel => DateUtil.dateRangeStatus(
            this.project().begin,
            this.project().end,
        ) )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected isActionVisible (
        element: ProjectModel,
        action: ActionModel,
    ): boolean {
        if (!AppConfig.config.project.actions.includes( action.id )) return false

        const hasAnyProjectAuthority: boolean = this.hasAnyProjectAuthority( element )
        switch (action.id) {
            case ElementActionEnum.PROJECT_SELECT_PROFILE:
                return hasAnyProjectAuthority
            case ElementActionEnum.PROJECT_CREATE_SUPPORT_PROFILE:
                return !hasAnyProjectAuthority
            case ElementActionEnum.PROJECT_DISABLE:
                return element.visible
            case ElementActionEnum.PROJECT_ENABLE:
                return !element.visible
            default:
                return true
        }
    }

    private hasAnyProjectAuthority (element: ProjectModel): boolean {
        return this.registryFacade.currentUser()!.authorities.some(
            (authority: string): boolean => authority.startsWith( `${element.id}_REGISTRY_PROJECT` ),
        )
    }

    protected override disabledAction (
        element: ProjectModel,
        action: ActionModel,
    ): boolean {
        return action.id === ElementActionEnum.PROJECT_SELECT_PROFILE
               && this.registryFacade.currentUser()?.preferences?.selectedProfile?.project?.id === element.id
               ? true : !CurrentUserUtil.isFeasible( this.registryFacade.currentUser(), element, action )
    }

    protected handleAction (action: ElementActionEnum): void {
        switch (action) {
            case ElementActionEnum.PROJECT_SELECT_PROFILE:
                this.subscriptions.add(
                    this.registryFacade.selectUserProjectProfileByProject( this.project().id ).pipe(
                        tap( () => this.router.navigateByUrl( AppRouteEnum.PROJECTS_SELECTED ).catch( console.error ) ),
                    ).subscribe(),
                )
                break
            case ElementActionEnum.PROJECT_CREATE_SUPPORT_PROFILE:
                this.registryFacade.createSupportProjectProfile( this.project().id )
                break
            case ElementActionEnum.PROJECT_UPDATE:
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_EDITION.replace( ':projectId', this.project().id ),
                ).catch( console.error )
                break
            case ElementActionEnum.PROJECT_DISABLE:
                this.facade.disableProject( this.project().id )
                break
            case ElementActionEnum.PROJECT_ENABLE:
                this.facade.enableProject( this.project().id )
                break
            case ElementActionEnum.PROJECT_DELETE:
                this.facade.deleteProject( this.project() )
                break
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }
}
