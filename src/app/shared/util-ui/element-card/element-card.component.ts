import { AsyncPipe, DatePipe } from '@angular/common'
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { MenuItem } from 'primeng/api'
import { AvatarModule } from 'primeng/avatar'
import { Button } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { MenuModule } from 'primeng/menu'
import { OverlayPanelModule } from 'primeng/overlaypanel'
import { combineLatestWith, map, Observable, of } from 'rxjs'
import { ActionModel } from '../../util-model/model/action.model'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { GenericModel } from '../../util-model/model/generic.model'
import { HistoryModel } from '../../util-model/model/history.model'
import { GenericElementComponent } from '../../util-tool/component/generic-element.component'
import { ElementSkeletonComponent } from '../element-skeleton/element-skeleton.component'
import { DialogModule } from 'primeng/dialog'
import { FormFieldErrorComponent } from '../form-field-error/form-field-error.component'
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { InputTextModule } from 'primeng/inputtext'
import { breakPoint } from '../../util-tool/util/breakpoint.const'

@Component( {
    selector: 'app-element-card',
    standalone: true,
    imports: [
        CardModule,
        AvatarModule,
        ElementSkeletonComponent,
        AsyncPipe,
        Button,
        MenuModule,
        OverlayPanelModule,
        TranslateModule,
        DialogModule,
        FormFieldErrorComponent,
        FormsModule,
        InputTextModule,
        ReactiveFormsModule,
    ],
    templateUrl: './element-card.component.html',
    styleUrl: './element-card.component.scss',
} )
export class ElementCardComponent<T extends GenericModel, A> extends GenericElementComponent<T, A> implements OnChanges {
    @Input() public icon: string | undefined
    @Input() public showActionMenu: boolean = true

    @Output() public readonly action: EventEmitter<A> = new EventEmitter<A>()

    protected items$!: Observable<MenuItem[]>
    protected showDialog: boolean = false
    protected dialogContent: ActionModel<A> | undefined = undefined

    protected readonly breakpoint: object = breakPoint
    protected readonly form: FormGroup
    private readonly dateFormat: string = this.translateService.instant( 'datetime.format.date' )
    private readonly timeFormat: string = this.translateService.instant( 'datetime.format.time' )

    public constructor (
        private readonly formBuilder: FormBuilder,
        private readonly datePipe: DatePipe,
    ) {
        super()

        this.form = this.initForm()
    }

    public ngOnChanges (): void {
        this.buildActionsMenu()
    }

    private initForm (): FormGroup {
        return this.formBuilder.group( {
            confirmationName: this.formBuilder.control( undefined, [] ),
        } )
    }

    protected buildHistoryItem (history: HistoryModel, isCreation: boolean): string {
        const translationSuffix: string = history.user ? '-user' : ''
        return this.translateService.instant(
            (isCreation ? 'datetime.created' : 'datetime.last-update') + translationSuffix,
            {
                date: this.datePipe.transform( history.dateTime, this.dateFormat ),
                time: this.datePipe.transform( history.dateTime, this.timeFormat ),
                user: history.user?.email,
            },
        )
    }

    private buildActionsMenu (): void {
        this.items$ = this.currentUser$.pipe(
            combineLatestWith( of( this.actions ) ),
            map( ([ currentUser, actions ]: [ CurrentUserModel | undefined, ActionModel<A>[] ]): MenuItem[] => this.definedMenuItems(
                currentUser,
                actions,
            ) ),
        )
    }

    private definedMenuItems (currentUser: CurrentUserModel | undefined, actions: ActionModel<A>[]): MenuItem[] {
        if (!currentUser) return []
        return actions
            .map( (action: ActionModel<A>): MenuItem => ({
                label: action.name,
                icon: action.icon,
                disabled: action.disabled,
                command: (): void => this.showConfirmationIfNecessary( action ),
            }) )
    }

    private showConfirmationIfNecessary (action: ActionModel<A>): void {
        if (action.confirmation) {
            if (action.confirmation.confirmProperty) {
                this.confirmationName.addValidators( Validators.pattern( this.propertyValue( action.confirmation.confirmProperty ) ) )
            }

            this.showDialog = true
            this.dialogContent = action
        } else {
            this.action.emit( action.id )
        }
    }

    protected cancelAction (): void {
        this.confirmationName.reset()
        this.form.clearValidators()
        this.showDialog = false
        this.dialogContent = undefined
    }

    protected confirmAction (action: ActionModel<A> | undefined): void {
        if (action) {
            this.action.emit( action.id )
        }

        this.cancelAction()
    }

    protected propertyValue (property: string | undefined): string {
        if (!property) return ''
        return Object( this.element )[property]
    }

    protected get confirmationName (): FormControl {
        return this.form.get( 'confirmationName' ) as FormControl
    }

    protected isActionDisabled (): boolean {
        // Do nothing
        return false
    }
}
