import { Directive, ElementRef, forwardRef, inject } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { DateHelper } from '@shared/helpers/date.helper'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'

type SgdfFieldValue = string | boolean | Date | CustomDatetimeModel | null

interface SgdfFieldElement extends HTMLElement {
    value: string | { date: string, time: string }
    checked: boolean
    disabled: boolean
}

const LOCAL_DATE_TIME: RegExp = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/

/**
 * Purpose: Lets signal forms (`[formField]`) drive the `@sgdf/ui` form elements: `sgdf-input`, `sgdf-textarea`, `sgdf-select`, `sgdf-switch`, `sgdf-checkbox` and `sgdf-date-time-picker`.
 * Scope: Applied with the `appSgdfField` attribute next to `[formField]`. Writes the model value to the element, reads it back on `input` and `change`, reports touch on focus out and the disabled state. The switch and the checkbox hold a boolean and the date time picker a local `Date`.
 * Limits: Maps no value of its own: a select holds the string of its option. The picker uses the combined value format and holds a `Date`, or the separate one (`value-format="separate"`) and holds a `CustomDatetimeModel`, whose time stays UTC like the API's while the picker shows it local.
 */
@Directive({
    selector: '[appSgdfField]',
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef((): typeof SgdfFieldDirective => SgdfFieldDirective), multi: true }],
    host: { '(input)': 'emit()', '(change)': 'emit()', '(focusout)': 'onTouched()' },
})
export class SgdfFieldDirective implements ControlValueAccessor {
    private readonly element: SgdfFieldElement = inject<ElementRef<SgdfFieldElement>>(ElementRef).nativeElement
    private readonly tag: string = this.element.tagName.toLowerCase()
    private onChange: (value: SgdfFieldValue) => void = (): void => undefined

    protected onTouched: () => void = (): void => undefined

    public writeValue(value: SgdfFieldValue): void {
        if (this.isBoolean) {
            this.element.checked = value === true
        } else if (this.tag === 'sgdf-date-time-picker') {
            this.element.value = this.separate ? SgdfFieldDirective.toParts(value) : value instanceof Date ? SgdfFieldDirective.format(value) : ''
        } else {
            this.element.value = typeof value === 'string' ? value : ''
        }
    }

    public registerOnChange(onChange: (value: SgdfFieldValue) => void): void {
        this.onChange = onChange
    }

    public registerOnTouched(onTouched: () => void): void {
        this.onTouched = onTouched
    }

    public setDisabledState(disabled: boolean): void {
        this.element.disabled = disabled
    }

    protected emit(): void {
        this.onChange(this.read())
    }

    private read(): SgdfFieldValue {
        if (this.isBoolean) return this.element.checked
        if (this.tag === 'sgdf-date-time-picker') {
            return this.separate ? SgdfFieldDirective.fromParts(this.element.value) : SgdfFieldDirective.parse(this.element.value as string)
        }
        return this.element.value as string
    }

    private get isBoolean(): boolean {
        return this.tag === 'sgdf-switch' || this.tag === 'sgdf-checkbox'
    }

    private get separate(): boolean {
        return this.element.getAttribute('value-format') === 'separate'
    }

    private static toParts(value: SgdfFieldValue): { date: string, time: string } {
        const parts: Partial<CustomDatetimeModel> | null = value !== null && typeof value === 'object' && !(value instanceof Date) ? value : null
        return { date: parts?.date ?? '', time: SgdfFieldDirective.toLocalTime( parts?.date, parts?.time ) }
    }

    private static fromParts(value: string | { date: string, time: string }): CustomDatetimeModel | null {
        if (typeof value === 'string' || (!value.date && !value.time)) return null
        return { date: value.date || undefined, time: SgdfFieldDirective.toUtcTime( value.date, value.time ) }
    }

    private static toLocalTime(date: string | undefined, time: string | undefined): string {
        const utc: Date | undefined = DateHelper.fromIsoTime( time, date )
        return utc ? `${String( utc.getHours() ).padStart( 2, '0' )}:${String( utc.getMinutes() ).padStart( 2, '0' )}` : ''
    }

    private static toUtcTime(date: string, time: string): string | undefined {
        if (!time) return undefined
        const [ hours, minutes ]: number[] = time.split( ':' ).map( Number )
        const [ year, month, day ]: number[] = (date || DateHelper.toIsoDate( new Date() )!).split( '-' ).map( Number )
        return DateHelper.toIsoTime( new Date( year, month - 1, day, hours, minutes, 0, 0 ) )
    }

    private static format(date: Date): string {
        const pad: (n: number) => string = (n: number): string => String(n).padStart(2, '0')
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    private static parse(value: string): Date | null {
        const match: RegExpExecArray | null = LOCAL_DATE_TIME.exec(value ?? '')
        if (!match) return null
        const [, year, month, day, hours = '0', minutes = '0']: string[] = match
        return new Date(+year, +month - 1, +day, +hours, +minutes)
    }
}
