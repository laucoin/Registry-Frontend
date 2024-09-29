import { Component, forwardRef, Input, OnChanges, signal, WritableSignal } from '@angular/core'
import { UserFacade } from '../../../domains/user/data/state/user.facade'
import { GenericComponent } from '../../util-tool/component/generic.component'
import {
    ControlValueAccessor,
    FormBuilder,
    FormControl,
    FormGroup,
    NG_VALUE_ACCESSOR,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms'
import { Observable, of } from 'rxjs'
import { ItemModel } from '../../util-model/model/item.model'
import { Button } from 'primeng/button'
import { TranslateModule } from '@ngx-translate/core'
import { LayerComponent } from '../layer/layer.component'
import { RegistryTemplateDirective } from '../../util-tool/directive/registry-template.directive'
import { IconFieldModule } from 'primeng/iconfield'
import { InputIconModule } from 'primeng/inputicon'
import { InputTextModule } from 'primeng/inputtext'
import { ListboxChangeEvent, ListboxModule } from 'primeng/listbox'
import { AsyncPipe, NgForOf } from '@angular/common'
import { MessageComponent } from '../message/message.component'
import { Message } from 'primeng/api'
import { UserDto } from '../../util-model/dto/user.dto'

@Component( {
    selector: 'app-select-users-field',
    standalone: true,
    imports: [
        Button,
        TranslateModule,
        LayerComponent,
        RegistryTemplateDirective,
        ReactiveFormsModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        ListboxModule,
        AsyncPipe,
        NgForOf,
        MessageComponent,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef( (): typeof SelectUsersFieldComponent => SelectUsersFieldComponent ),
            multi: true,
        },
    ],
    templateUrl: './select-users-field.component.html',
    styleUrl: './select-users-field.component.scss',
} )
export class SelectUsersFieldComponent extends GenericComponent implements ControlValueAccessor, OnChanges {
    @Input( { required: true } ) public formControl: FormControl | undefined
    @Input() public multiple: boolean = false
    protected layerOpened: boolean = false
    protected layerUsers$: Observable<ItemModel[]> = of( [] )
    protected layerSelectedUsers: WritableSignal<ItemModel[]> = signal( [] )
    protected layerForm: FormGroup

    protected disabled: WritableSignal<boolean> = signal( false )

    protected message: Message = {
        severity: 'warn', summary: 'warning.title.EMPTY', detail: 'warning.message.EMPTY',
    }

    public constructor (
        private readonly facade: UserFacade,
        private readonly formBuilder: FormBuilder,
    ) {
        super()

        this.layerForm = this.initLayerForm()
    }

    public ngOnChanges (): void {
        if (this.multiple) {
            this.formControl?.removeValidators( Validators.maxLength( 1 ) )
        } else {
            this.formControl?.addValidators( Validators.maxLength( 1 ) )
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    public registerOnChange (fn: Function): void {
        this.formControl?.registerOnChange( fn )
    }

    public registerOnTouched (): void {
        // Do nothing
    }

    public setDisabledState (isDisabled: boolean): void {
        this.disabled.set( isDisabled )
    }

    public writeValue (): void {
        // Do nothing
    }

    private updateControlValue (value: UserDto[]): void {
        this.formControl?.setValue( value )
        this.formControl?.updateValueAndValidity()
    }

    protected get invalid (): boolean {
        return ((this.formControl?.dirty || this.formControl?.touched) && this.formControl?.invalid) ?? false
    }

    private initLayerForm (): FormGroup {
        this.facade.searchUser()
        this.layerUsers$ = this.facade.searchedUsers
        this.layerSelectedUsers.set( [] )

        return this.formBuilder.group( {
            searched: this.formBuilder.control( '' ),
            users: this.formBuilder.control( [] ),
        } )
    }

    protected addSelectedUsers (): void {
        const users: UserDto[] = this.formControl?.value ?? []

        this.layerSelectedUsers().forEach( (item: ItemModel): void => {
            const formattedItem: UserDto | undefined = this.facade.actualSearchedUsers.find( (user: UserDto): boolean => user.id == item.value )
            if (formattedItem && !users.some( (user: UserDto): boolean => formattedItem.id === user.id )) {
                users.push( formattedItem )
            }
        } )

        this.updateControlValue( users )
        this.closeLayer()
    }

    protected closeLayer (): void {
        this.layerForm = this.initLayerForm()
        this.layerOpened = false
    }

    protected onLayerSelectionChange (event: ListboxChangeEvent, items: ItemModel[]): void {
        this.layerSelectedUsers.set( items.filter( (item: ItemModel): boolean => event.value.includes( item.value ) ) )
    }

    protected removeUser (user: UserDto): void {
        this.updateControlValue( this.formControl?.value?.filter( (item: UserDto): boolean => item.id != user.id ) )
    }

    protected get layerSearched (): FormControl {
        return this.layerForm.get( 'searched' ) as FormControl
    }

    protected get layerUsers (): FormControl {
        return this.layerForm.get( 'users' ) as FormControl
    }
}
