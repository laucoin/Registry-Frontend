import { Component, signal, WritableSignal } from '@angular/core'
import { GenericComponent } from '../../../shared/util-tool/component/generic.component'
import { Card } from 'primeng/card'
import { Avatar } from 'primeng/avatar'
import { TitleCasePipe, UpperCasePipe } from '@angular/common'
import { TranslatePipe } from '@ngx-translate/core'
import { DateFormatPipe } from '../../../shared/util-tool/pipe/date-format.pipe'
import { SeverityTagComponent } from '../../../shared/util-ui/severity-tag/severity-tag.component'
import { SelectButton } from 'primeng/selectbutton'
import { FormsModule } from '@angular/forms'
import { ThemeEnum } from '../../../shared/util-model/enumeration/theme.enum'
import { Select } from 'primeng/select'
import { AppConfig } from '../../../app.config'
import { Button } from 'primeng/button'
import { ActionModel } from '../../../shared/util-model/model/action.model'
import { ElementActionEnum } from '../../../shared/util-model/enumeration/element-action.enum'
import { SeverityEnum } from '../../../shared/util-model/enumeration/severity.enum'
import { ConfirmationDialogComponent } from '../../../shared/util-ui/confirmation-dialog/confirmation-dialog.component'

@Component( {
    selector: 'app-setting',
    standalone: true,
    imports: [
        Card,
        Avatar,
        TitleCasePipe,
        UpperCasePipe,
        TranslatePipe,
        DateFormatPipe,
        SeverityTagComponent,
        SelectButton,
        FormsModule,
        Select,
        Button,
        ConfirmationDialogComponent,
    ],
    templateUrl: './setting.component.html',
} )
export class SettingComponent extends GenericComponent {
    protected currentTheme: ThemeEnum = ThemeEnum.SYSTEM
    protected currentLanguage: string = AppConfig.config.defaultLanguage

    protected readonly impersonate: ActionModel = {
        id: ElementActionEnum.USER_IMPERSONATE,
        label: 'settings.actions.impersonate',
        icon: 'pi pi-eraser',
        disabled: false,
        confirmation: {
            header: 'settings.actions.confirmations.impersonate.title',
            message: 'settings.actions.confirmations.impersonate.message',
            icon: 'pi pi-exclamation-triangle',
            acceptSeverity: SeverityEnum.DANGER,
            rejectSeverity: SeverityEnum.SECONDARY,
            confirmProperty: 'firstName',
        },
    }

    public readonly action: WritableSignal<ActionModel | undefined> = signal( undefined )

    protected showDialogIfNeeded (action: ActionModel): void {
        if (action?.confirmation) {
            this.action.set( action )
        } else {
            this.handleAction( action!.id )
        }
    }

    protected handleAction (action: ElementActionEnum): void {
        switch (action) {
            case ElementActionEnum.USER_IMPERSONATE:
                this.registryFacade.impersonateCurrentUser()
                break
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }
}
