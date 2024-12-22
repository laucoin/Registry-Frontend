import { Component, Input, OnChanges, signal, WritableSignal } from '@angular/core'
import { GenericElementComponent } from '../../../shared/util-tool/component/generic-element.component'
import { GroupModel } from '../../../shared/util-model/model/group.model'
import { GroupActionEnum } from '../data/state/group.action'
import { CurrentUserModel } from '../../../shared/util-model/model/current-user.model'
import { AppConfig } from '../../../app.config'
import { ActionModel } from '../../../shared/util-model/model/action.model'
import { CurrentUserUtil } from '../../../shared/util-authentication/tool/current-user.util'
import { GroupFacade } from '../data/state/group.facade'
import { ElementCardComponent } from '../../../shared/util-ui/element-card/element-card.component'
import { TranslatePipe } from '@ngx-translate/core'
import { DatePipe, NgIf, TitleCasePipe, UpperCasePipe } from '@angular/common'
import { Button } from 'primeng/button'
import { LayerComponent } from '../../../shared/util-ui/layer/layer.component'
import { Listbox } from 'primeng/listbox'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs'
import { ParticipantModel } from '../../../shared/util-model/model/participant.model'
import { DateIsPastPipe } from '../../../shared/util-tool/pipe/date-is-past.pipe'
import { Avatar } from 'primeng/avatar'
import { AppRouteEnum } from '../../../app-route.enum'

@Component( {
    selector: 'app-group-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TranslatePipe,
        DatePipe,
        TitleCasePipe,
        UpperCasePipe,
        Button,
        LayerComponent,
        Listbox,
        Tab,
        TabList,
        TabPanel,
        TabPanels,
        Tabs,
        DateIsPastPipe,
        NgIf,
        Avatar,
    ],
    templateUrl: './group-element.component.html',
    styleUrl: './group-element.component.scss',
} )
export class GroupElementComponent extends GenericElementComponent<GroupModel, GroupActionEnum> implements OnChanges {
    @Input() public showActionMenu: boolean = true
    protected layerOpened: boolean = false
    protected activeTab: number = 1

    protected additionalTotal: WritableSignal<number> = signal( 0 )
    protected adults: WritableSignal<ParticipantModel[]> = signal( [] )
    protected children: WritableSignal<ParticipantModel[]> = signal( [] )

    public constructor (private readonly facade: GroupFacade) {super()}

    public ngOnChanges (): void {
        this.defineActions()
        this.additionalTotal.set( this.element.members.length - 1 )
        this.adults.set( this.filterMembers( true ) )
        this.children.set( this.filterMembers( false ) )
    }

    private filterMembers (major: boolean): ParticipantModel[] {
        return this.element.members.filter( (member: ParticipantModel): boolean => member.major === major )
    }

    private defineActions (): void {
        const currentUser: CurrentUserModel = this.registryFacade.actualCurrentUser!
        this.actions = AppConfig
            .config.group.action
            .map( (action: ActionModel<GroupActionEnum>): ActionModel<GroupActionEnum> => ({
                ...action,
                disabled: this.isActionDisabled( currentUser, action ),
            }) )
            .filter( (action: ActionModel<GroupActionEnum>): boolean => !action.disabled )
    }

    protected override isActionDisabled (
        currentUser: CurrentUserModel,
        action: ActionModel<GroupActionEnum>,
    ): boolean {
        const isActionFeasible: boolean = CurrentUserUtil.isFeasible(
            currentUser,
            this.element.event,
            action,
        )

        switch (action.id) {
            case GroupActionEnum.DISABLE_GROUP:
                return !(isActionFeasible && this.element.visible)
            case GroupActionEnum.ENABLE_GROUP:
                return !(isActionFeasible && !this.element.visible)
            default:
                return !isActionFeasible
        }
    }

    protected handleAction (action: GroupActionEnum): void {
        switch (action) {
            case GroupActionEnum.FETCH_GROUP_MEMBER_PAGE:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.GROUP_MEMBERS.replace( ':id', this.element.id ) ),
                ).catch( console.error )
                break
            case GroupActionEnum.UPDATE_GROUP:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.GROUPS_EDITION.replace( ':id', this.element.id ) ),
                ).catch( console.error )
                break
            case GroupActionEnum.DISABLE_GROUP:
                this.facade.disableElement( this.element.id, this.contextEventId() )
                break
            case GroupActionEnum.ENABLE_GROUP:
                this.facade.enableElement( this.element.id, this.contextEventId() )
                break
            case GroupActionEnum.DELETE_GROUP:
                this.facade.deleteElement( this.element, this.contextEventId() )
                break
            default:
                console.warn( this.translateService.instant( 'warning.message.invalid-action' ) )
        }
    }

    protected get firstNotPurged (): ParticipantModel | undefined {
        return this.element.members.find( (member: ParticipantModel): boolean => !member.purged )
    }
}
