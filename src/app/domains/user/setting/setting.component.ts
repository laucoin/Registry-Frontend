import { Component } from '@angular/core'
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
import { SeverityEnum } from '../../../shared/util-model/enumeration/severity.enum'
import { GenericElementComponent } from '../../../shared/util-tool/component/generic-element.component'

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
    ],
    templateUrl: './setting.component.html',
} )
export class SettingComponent extends GenericElementComponent {
    protected currentTheme: ThemeEnum = ThemeEnum.SYSTEM
    protected currentLanguage: string = AppConfig.settings.defaultLanguage

    protected confirmImpersonate (): void {
        this.confirmationService.confirm(
            this.buildConfirmation(
                'settings.actions.confirmations.impersonate',
                'pi pi-exclamation-triangle',
                this.registryFacade.currentUser(),
                SeverityEnum.DANGER,
                (): void => this.registryFacade.impersonateCurrentUser(),
            ),
        )
    }
}
