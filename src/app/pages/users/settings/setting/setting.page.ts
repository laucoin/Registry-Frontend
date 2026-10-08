import { Component } from '@angular/core'
import { Card } from 'primeng/card'
import { Avatar } from 'primeng/avatar'
import { TitleCasePipe, UpperCasePipe } from '@angular/common'
import {TranslocoPipe} from '@jsverse/transloco'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { SeverityTagComponent } from '@shared/ui/common/severity-tag/severity-tag.component'
import { SelectButton } from 'primeng/selectbutton'
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { Select } from 'primeng/select'
import { Button } from 'primeng/button'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { GenericElementComponent } from '@shared/ui/base/generic-element.component'

/**
 * Purpose: User settings page.
 * Scope: Lets the user choose a theme and a language.
 * Limits: Saves through the registry facade only.
 */
@Component( {
    selector: 'app-setting',
    imports: [
        Card,
        Avatar,
        TitleCasePipe,
        UpperCasePipe,
        TranslocoPipe,
        DateFormatPipe,
        SeverityTagComponent,
        SelectButton,
        FormsModule,
        Select,
        Button,
        ReactiveFormsModule,
    ],
    templateUrl: './setting.page.html',
} )
export class SettingPage extends GenericElementComponent {
    protected themeControl: FormControl = new FormControl( this.registryFacade.currentUserTheme() )
    protected languageControl: FormControl = new FormControl( this.sessionFacade.currentUserLanguage() )

    protected confirmImpersonate (): void {
        this.confirmationService.confirm(
            this.buildConfirmation(
                'settings.actions.confirmations.impersonate',
                'pi pi-exclamation-triangle',
                this.sessionFacade.currentUser(),
                SeverityEnum.DANGER,
                (): void => this.registryFacade.impersonateCurrentUser(),
            ),
        )
    }
}
