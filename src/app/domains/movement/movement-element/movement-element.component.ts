import { Component, Input, OnChanges, signal, WritableSignal } from '@angular/core'
import { GenericElementComponent } from '../../../shared/util-tool/component/generic-element.component'
import { MovementModel } from '../data/model/movement.model'
import { MovementActionEnum } from '../data/state/movement.action'
import { ActionModel } from '../../../shared/util-model/model/action.model'
import { MovementFacade } from '../data/state/movement.facade'
import { ElementCardComponent } from '../../../shared/util-ui/element-card/element-card.component'
import { DatePipe, TitleCasePipe, UpperCasePipe } from '@angular/common'
import { AppConfig } from '../../../app.config'
import { CurrentUserModel } from '../../../shared/util-model/model/current-user.model'
import { CurrentUserUtil } from '../../../shared/util-authentication/tool/current-user.util'
import { MovementTypeEnum } from '../data/model/movement-type.enum'
import { MovementRoutesEnum } from '../movement-routes.enum'
import { TranslateModule } from '@ngx-translate/core'
import { TagModule } from 'primeng/tag'
import { ParticipantModel } from '../../../shared/util-model/model/participant.model'
import { MovementContentModel } from '../data/model/movement-content.model'
import { LayerComponent } from '../../../shared/util-ui/layer/layer.component'
import { Button } from 'primeng/button'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { TabViewModule } from 'primeng/tabview'
import {
    MovementParticipantElementComponent,
} from '../movement-participant-element/movement-participant-element.component'
import { ListboxModule } from 'primeng/listbox'

@Component( {
    selector: 'app-movement-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        DatePipe,
        TranslateModule,
        TagModule,
        TitleCasePipe,
        UpperCasePipe,
        LayerComponent,
        Button,
        RegistryTemplateDirective,
        TabViewModule,
        MovementParticipantElementComponent,
        ListboxModule,

    ],
    templateUrl: './movement-element.component.html',
    styleUrl: './movement-element.component.scss',
} )
export class MovementElementComponent extends GenericElementComponent<MovementModel, MovementActionEnum> implements OnChanges {
    @Input() public showActionMenu: boolean = true

    private readonly majority: number = AppConfig.config.majority
    protected readonly MovementTypeEnum: typeof MovementTypeEnum = MovementTypeEnum
    protected layerOpened: boolean = false

    protected others: WritableSignal<number> = signal( 0 )
    protected adults: WritableSignal<MovementContentModel[]> = signal( [] )
    protected children: WritableSignal<MovementContentModel[]> = signal( [] )

    public constructor (private readonly facade: MovementFacade) {super()}

    public ngOnChanges (): void {
        this.defineActions()
        this.others.set( this.element.content.length - 1 )
        this.adults.set( this.filterContent( true ) )
        this.children.set( this.filterContent( false ) )
    }

    private filterContent (major: boolean): MovementContentModel[] {
        return this.element.content.filter( (content: MovementContentModel): boolean => content.participant.major === major )
    }

    private defineActions (): void {
        const currentUser: CurrentUserModel = this.registryFacade.actualCurrentUser!
        this.actions = AppConfig
            .config.movement.action
            .map( (action: ActionModel<MovementActionEnum>): ActionModel<MovementActionEnum> => ({
                ...action,
                disabled: this.isActionDisabled( currentUser, action ),
            }) )
            .filter( (action: ActionModel<MovementActionEnum>): boolean => !action.disabled )
    }

    protected override isActionDisabled (
        currentUser: CurrentUserModel,
        action: ActionModel<MovementActionEnum>,
    ): boolean {
        const isActionFeasible: boolean = CurrentUserUtil.isFeasible(
            currentUser,
            this.element.event,
            action,
        )

        switch (action.id) {
            case MovementActionEnum.DISABLE_MOVEMENT:
                return !(isActionFeasible && this.element.visible)
            case MovementActionEnum.ENABLE_MOVEMENT:
                return !(isActionFeasible && !this.element.visible)
            default:
                return !isActionFeasible
        }
    }

    protected handleAction (action: MovementActionEnum): void {
        switch (action) {
            case MovementActionEnum.UPDATE_MOVEMENT:
                this.router.navigate(
                    [ MovementRoutesEnum.EDIT.replace( ':id', this.element.id ) ],
                    { relativeTo: this.route },
                ).catch( console.error )
                break
            case MovementActionEnum.DISABLE_MOVEMENT:
                this.facade.disableElement( this.element.id, this.contextEventId() )
                break
            case MovementActionEnum.ENABLE_MOVEMENT:
                this.facade.enableElement( this.element.id, this.contextEventId() )
                break
            case MovementActionEnum.DELETE_MOVEMENT:
                this.facade.deleteElement( this.element, this.contextEventId() )
                break
            default:
                console.warn( this.translateService.instant( 'warning.message.invalid-action' ) )
        }
    }

    protected get firstNotPurged (): ParticipantModel | undefined {
        return this.element.content.find( (content: MovementContentModel): boolean => !content?.participant.purged )?.participant
    }
}
