import { Component, computed, HostListener, signal, Signal, WritableSignal } from '@angular/core'
import { Menubar } from 'primeng/menubar'
import { GenericComponent } from '../../shared/util-tool/component/generic.component'
import { Avatar } from 'primeng/avatar'
import { TranslatePipe } from '@ngx-translate/core'
import { RouterEvent, RouterLink } from '@angular/router'
import { Popover } from 'primeng/popover'
import { Menu } from 'primeng/menu'
import { Ripple } from 'primeng/ripple'
import { MenuItem } from 'primeng/api'
import { Button } from 'primeng/button'
import { AppRouteEnum } from '../../app-route.enum'
import { UserAuthorityEnum } from '../../shared/util-model/enumeration/user-authority.enum'
import { MenuItemModel } from '../data/model/menu-item.model'
import { ProjectAuthorityEnum } from '../../shared/util-model/enumeration/project-authority.enum'
import { ProjectOptionEnum } from '../../shared/util-model/enumeration/project-option.enum'
import { StringUtil } from '../../shared/util-tool/util/string.util'
import { CurrentUserModel } from '../../shared/util-model/model/current-user.model'
import { CurrentUserUtil } from '../../shared/util-authentication/tool/current-user.util'
import { TruncatePipe } from '../../shared/util-tool/pipe/truncate.pipe'
import { toSignal } from '@angular/core/rxjs-interop'

@Component( {
    selector: 'app-navbar',
    standalone: true,
    imports: [
        Menubar,
        Avatar,
        TranslatePipe,
        RouterLink,
        Popover,
        Menu,
        Ripple,
        Button,
        TruncatePipe,


    ],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss',
} )
export class NavbarComponent extends GenericComponent {
    protected readonly maxMenuTextLength: number = 26
    protected readonly userMenuItems: MenuItem[] = [
        {
            label: this.translateService.instant( 'global.menu.invitations' ),
            icon: 'pi pi-envelope',
            url: AppRouteEnum.USERS_INVITATION,
        },
        {
            label: this.translateService.instant( 'global.menu.settings' ),
            icon: 'pi pi-cog',
            url: AppRouteEnum.USERS_SETTING,
        },
    ]

    private readonly allMenuItems: Signal<MenuItemModel[]> = signal( [
        {
            label: 'global.menu.projects',
            icon: 'pi pi-calendar',
            url: AppRouteEnum.PROJECTS,
        },
        {
            label: 'global.menu.users',
            icon: 'pi pi-users',
            url: AppRouteEnum.USERS,
            requiredUserAuthority: UserAuthorityEnum.REGISTRY_USER_R,
        },
    ] )
    protected readonly menuItems: Signal<MenuItem[]>

    private readonly allContextMenuItems: Signal<MenuItemModel[]> = computed( () => [
        {
            label: 'global.menu.project-home',
            icon: 'pi pi-home',
            url: AppRouteEnum.PROJECTS_SELECTED,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_R,
        },
        {
            label: 'global.menu.movements',
            icon: 'pi pi-sort-alt',
            url: AppRouteEnum.PROJECTS_MOVEMENTS,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_R,
        },
        {
            label: 'global.menu.configuration',
            icon: 'pi pi-cog',
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_R,
            items: [
                {
                    label: 'global.menu.edit-project',
                    icon: 'pi pi-pen-to-square',
                    url: AppRouteEnum.PROJECTS_EDITION.replace(
                        ':projectId',
                        this.registryFacade.selectedProject()?.id ?? '',
                    ),
                    requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U,
                },
                {
                    label: 'global.menu.project-profiles',
                    icon: 'pi pi-unlock',
                    url: AppRouteEnum.PROJECTS_CONFIGURATION_PROFILES,
                    requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_R,
                },
                {
                    label: 'global.menu.participants',
                    icon: 'pi pi-user',
                    url: AppRouteEnum.PROJECTS_CONFIGURATION_PARTICIPANTS,
                    requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_R,
                },
                {
                    label: 'global.menu.groups',
                    icon: 'pi pi-users',
                    url: AppRouteEnum.PROJECTS_CONFIGURATION_GROUPS,
                    requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_R,
                },
                {
                    label: 'global.menu.vehicles',
                    icon: 'pi pi-car',
                    url: AppRouteEnum.PROJECTS_CONFIGURATION_VEHICLES,
                    requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_R,
                    requiredProjectOption: ProjectOptionEnum.VEHICLE,
                },
                {
                    label: 'global.menu.activities',
                    icon: 'pi pi-hammer',
                    url: AppRouteEnum.PROJECTS_CONFIGURATION_ACTIVITIES,
                    requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_R,
                    requiredProjectOption: ProjectOptionEnum.ACTIVITY,
                },
            ],
        },
    ] )
    protected readonly contextMenuItems: Signal<MenuItem[]>

    protected readonly displayName: Signal<string> = computed( (): string =>
        StringUtil.truncate(
            StringUtil.toTitleCase( this.registryFacade.currentUser()?.firstName ) + ' ' + this.registryFacade.currentUser()?.lastName?.toUpperCase(),
            this.maxMenuTextLength,
        ),
    )
    protected readonly initials: Signal<string> = computed( (): string => StringUtil.truncate(
        this.registryFacade.currentUser()?.firstName,
        1,
    ) + StringUtil.truncate( this.registryFacade.currentUser()?.lastName, 1 ) )

    protected readonly role: Signal<string | undefined> = computed( (): string | undefined => this.registryFacade.currentUser()?.role?.label )

    private readonly activeRoute: Signal<unknown> = toSignal( this.router.events )
    protected readonly showContextMenu: Signal<boolean> = computed( (): boolean => {
        const routeProject: RouterEvent | undefined = this.activeRoute() as RouterEvent | undefined
        return routeProject?.url?.startsWith( `/${AppRouteEnum.PROJECTS}/` ) ?? false
    } )

    private readonly lastScrollPosition: WritableSignal<number> = signal( 0 )
    protected readonly showNavbar: WritableSignal<boolean> = signal( true )

    public constructor () {
        super()
        this.menuItems = computed( (): MenuItem[] => this.showContextMenu() ? [] : this.filterMenuItems(
            this.registryFacade.currentUser(),
            this.allMenuItems(),
        ) )
        this.contextMenuItems = computed( (): MenuItem[] => this.filterMenuItems(
            this.registryFacade.currentUser(),
            this.allContextMenuItems(),
        ) )
    }

    private filterMenuItems (currentUser: CurrentUserModel | undefined, menuItems: MenuItemModel[]): MenuItem[] {
        if (!currentUser) return []

        return menuItems
            .filter( (item: MenuItemModel): boolean => CurrentUserUtil.isFeasible(
                currentUser,
                currentUser?.preferences?.selectedProfile?.project,
                item,
            ) )
            .map( (menuItem: MenuItemModel): MenuItem => ({
                label: menuItem.label,
                icon: menuItem.icon,
                url: menuItem.url,
                items: menuItem.items?.length ? this.filterMenuItems( currentUser, menuItem.items ) : undefined,
            }) )
    }

    @HostListener( 'window:scroll', [] )
    public handleWindowScroll (): void {
        const currentScrollPosition: number = window.pageYOffset || document.documentElement.scrollTop

        if (currentScrollPosition > this.lastScrollPosition()) {
            // Scrolling DOWN
            this.showNavbar.set( false )
        } else {
            // Scrolling UP
            this.showNavbar.set( true )
        }

        this.lastScrollPosition.set( currentScrollPosition )
    }

    protected logout (): void {
        this.registryFacade.logout()
    }
}
