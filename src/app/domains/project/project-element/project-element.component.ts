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
import {ProjectModel} from '../../../shared/util-model/model/project.model'
import {ElementCardComponent} from '../../../shared/util-ui/element-card/element-card.component'
import {TagModule} from 'primeng/tag'
import {TranslatePipe} from '@ngx-translate/core'
import {ChipModule} from 'primeng/chip'
import {ProjectFacade} from '../data/state/project/project.facade'
import {AppRouteEnum} from '../../../app-route.enum'
import {SeverityTagComponent} from '../../../shared/util-ui/severity-tag/severity-tag.component'
import {LayerComponent} from '../../../shared/util-ui/layer/layer.component'
import {Listbox} from 'primeng/listbox'
import {GenericElementComponent} from '../../../shared/util-tool/component/generic-element.component'
import {UserAuthorityEnum} from '../../../shared/util-model/enumeration/user-authority.enum'
import {ProjectAuthorityEnum} from '../../../shared/util-model/enumeration/project-authority.enum'
import {Button} from 'primeng/button'
import {PluralTranslationPipe} from '../../../shared/util-tool/pipe/plural-translation.pipe'
import {CustomDateFormatPipe} from '../../../shared/util-tool/pipe/custom-date-format.pipe'
import {SeverityCircleComponent} from '../../../shared/util-ui/severity-circle/severity-circle.component'
import {SeverityEnum} from '../../../shared/util-model/enumeration/severity.enum'
import {ElementActionEnum} from '../../../shared/util-model/enumeration/element-action.enum'
import {MenuItem} from 'primeng/api'
import {Subscription, tap} from 'rxjs'
import {AvailabilityStatusEnum} from '../../../shared/util-model/enumeration/availability-status.enum'

@Component({
    selector: 'app-project-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TagModule,
        TranslatePipe,
        ChipModule,
        SeverityTagComponent,
        LayerComponent,
        Listbox,
        Button,
        PluralTranslationPipe,
        CustomDateFormatPipe,
        SeverityCircleComponent,
    ],
    templateUrl: './project-element.component.html',
    styleUrl: './project-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectElementComponent extends GenericElementComponent implements OnDestroy {
    protected readonly facade: ProjectFacade = inject(ProjectFacade)
    protected readonly subscriptions: Subscription = new Subscription()

    protected layerOpened: boolean = false

    public readonly actionMenuVisible: InputSignal<boolean> = input(true)
    public readonly project: InputSignal<ProjectModel> = input.required()

    protected readonly actions: Signal<MenuItem[]> = computed((): MenuItem[] => [
        {
            label: 'projects.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_U, this.project().id),
            visible: this.actionIsEnable(ElementActionEnum.PROJECT_UPDATE),
            command: (): void => {
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_EDITION.replace(':projectId', this.project().id),
                ).catch(console.error)
            },
        },
        {
            label: 'projects.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_U, this.project().id),
            visible: this.actionIsEnable(ElementActionEnum.PROJECT_DISABLE) && this.project().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'projects.actions.confirmations.disable',
                        'pi pi-exclamation-triangle',
                        this.project(),
                        SeverityEnum.WARNING,
                        (): void => this.facade.disableProject(this.project().id),
                    ),
                )
            },
        },
        {
            label: 'projects.actions.enable',
            icon: 'pi pi-replay',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_U, this.project().id),
            visible: this.actionIsEnable(ElementActionEnum.PROJECT_ENABLE) && !this.project().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'projects.actions.confirmations.enable',
                        'pi pi-info-circle',
                        this.project(),
                        SeverityEnum.INFO,
                        (): void => this.facade.enableProject(this.project().id),
                    ),
                )
            },
        },
        {
            label: 'projects.actions.delete',
            icon: 'pi pi-trash',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_D, this.project().id),
            visible: this.actionIsEnable(ElementActionEnum.PROJECT_DELETE),
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'projects.actions.confirmations.delete',
                        'pi pi-exclamation-triangle',
                        this.project(),
                        SeverityEnum.DANGER,
                        (): void => this.facade.deleteProject(this.project()),
                    ),
                )
            },
        },
    ])

    protected readonly joinable: Signal<boolean> = computed((): boolean => this.hasAnyProjectAuthority(this.project()))
    protected readonly supportable: Signal<boolean> = computed((): boolean =>
        !this.hasAnyProjectAuthority(this.project())
        && this.actionIsEnable(ElementActionEnum.PROJECT_CREATE_SUPPORT_PROFILE)
        && this.hasAuthority(UserAuthorityEnum.REGISTRY_PROFILE_C),
    )

    protected readonly statusSeverity: Signal<SeverityEnum> = computed((): SeverityEnum =>
        this.project().status?.value === AvailabilityStatusEnum.AVAILABLE ? SeverityEnum.SUCCESS : SeverityEnum.INFO,
    )

    private hasAnyProjectAuthority(element: ProjectModel): boolean {
        return this.registryFacade.currentUser()!.authorities.some(
            (authority: string): boolean => authority.startsWith(`${element.id}_REGISTRY_PROJECT`),
        )
    }

    protected selectProject(): void {
        this.subscriptions.add(
            this.registryFacade.selectUserProjectProfileByProject(this.project().id).pipe(
                tap(() => this.router.navigateByUrl(AppRouteEnum.PROJECTS_SELECTED).catch(console.error)),
            ).subscribe(),
        )
    }

    protected confirmSupportProfileCreation(): void {
        this.confirmationService.confirm({
            header: this.translateService.instant('projects.actions.confirmations.create-support.title'),
            message: this.translateService.instant(
                'projects.actions.confirmations.create-support.message',
                {element: this.project()},
            ),
            icon: 'pi pi-exclamation-triangle',
            rejectButtonProps: {
                severity: SeverityEnum.SECONDARY,
                outlined: true,
                rounded: true,
            },
            acceptButtonProps: {
                severity: SeverityEnum.WARNING,
                outlined: true,
                rounded: true,
            },
            accept: (): void => this.createSupportProfile(),
        })

    }

    private createSupportProfile(): void {
        this.subscriptions.add(
            this.registryFacade.createSupportProjectProfile(this.project().id).pipe(
                tap(() => this.router.navigateByUrl(AppRouteEnum.PROJECTS_SELECTED).catch(console.error)),
            ).subscribe(),
        )
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }
}
