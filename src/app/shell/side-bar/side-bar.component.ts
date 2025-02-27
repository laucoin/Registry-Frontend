import { NgOptimizedImage } from '@angular/common'
import { Component, computed, HostListener, Signal } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { AppConfig } from '../../app.config'
import { CurrentUserModel } from '../../shared/util-model/model/current-user.model'
import { MenuItemModel } from '../data/model/menu-item.model'
import { CurrentUserUtil } from '../../shared/util-authentication/tool/current-user.util'
import { Button } from 'primeng/button'
import { Drawer } from 'primeng/drawer'
import { RouterLink } from '@angular/router'
import { TruncatePipe } from '../../shared/util-tool/pipe/truncate.pipe'
import { Ripple } from 'primeng/ripple'
import { GenericComponent } from '../../shared/util-tool/component/generic.component'

@Component( {
    selector: 'app-side-bar',
    standalone: true,
    imports: [
        TranslateModule,
        Button,
        Drawer,
        RouterLink,
        NgOptimizedImage,
        TruncatePipe,
        Ripple,
    ],
    templateUrl: './side-bar.component.html',
    styleUrl: './side-bar.component.scss',
} )
export class SideBarComponent extends GenericComponent {
    protected readonly maxMenuTextLength: number = 26

    protected menuItems: Signal<MenuItemModel[]> = computed( (): MenuItemModel[] => this.filterMenuItems(
        this.registryFacade.currentUser(),
        AppConfig.config.menu,
    ) )
    protected isSidebarOpen: boolean = !this.registryFacade.tinyScreen()

    protected onNavigate (): void {
        if (this.registryFacade.tinyScreen()) this.isSidebarOpen = false
    }

    protected signOut (): void {
        this.registryFacade.logout()
    }

    @HostListener( 'window:resize', [ '$event' ] )
    public handleResize (): void {
        this.isSidebarOpen = window.innerWidth >= 768
        this.registryFacade.updateScreenWidth( window.innerWidth )
    }

    private filterMenuItems (currentUser: CurrentUserModel | undefined, menuItems: MenuItemModel[]): MenuItemModel[] {
        if (!currentUser) return []
        return menuItems.filter( (item: MenuItemModel): boolean => CurrentUserUtil.isFeasible(
                currentUser,
                currentUser?.preferences?.selectedProfile?.event,
                item,
            ),
        )
    }
}
