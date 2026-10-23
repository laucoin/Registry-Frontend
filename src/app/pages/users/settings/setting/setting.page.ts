import { Component, signal, WritableSignal } from '@angular/core'
import { Card } from 'primeng/card'
import { Avatar } from 'primeng/avatar'
import { TitleCasePipe, UpperCasePipe } from '@angular/common'
import {TranslocoPipe} from '@jsverse/transloco'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { SeverityTagComponent } from '@shared/ui/common/severity-tag/severity-tag.component'
import { SelectButton } from 'primeng/selectbutton'
import { FieldTree, FormField } from '@angular/forms/signals'
import { Select } from 'primeng/select'
import { Button } from 'primeng/button'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { GenericElementComponent } from '@shared/ui/base/generic-element.component'
import { createSettingForm, SettingFormModel, toSettingFormModel } from '@pages/users/settings/setting/setting.form'

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
        Select,
        Button,
        FormField,
    ],
    templateUrl: './setting.page.html',
} )
export class SettingPage extends GenericElementComponent {
    protected readonly model: WritableSignal<SettingFormModel> = signal(
        toSettingFormModel( this.registryFacade.currentUserTheme(), this.sessionFacade.currentUserLanguage() ),
    )
    protected readonly form: FieldTree<SettingFormModel> = createSettingForm( this.model )

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
