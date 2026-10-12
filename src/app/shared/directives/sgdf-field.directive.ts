import { Directive, ElementRef, forwardRef, inject } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'

type SgdfFieldValue = string | boolean | Date | null

interface SgdfFieldElement extends HTMLElement {
    value: string
    checked: boolean
    disabled: boolean
}

const LOCAL_DATE_TIME: RegExp = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/

/**
 * Purpose: Lets signal forms (`[formField]`) drive the `@sgdf/ui` form elements: `sgdf-input`, `sgdf-textarea`, `sgdf-select`, `sgdf-switch` and `sgdf-date-time-picker`.
 * Scope: Applied with the `appSgdfField` attribute next to `[formField]`. Writes the model value to the element, reads it back on `input` and `change`, reports touch on focus out and the disabled state. The switch holds a boolean and the date time picker a local `Date`.
 * Limits: Maps no value of its own: a select holds the string of its option, and the picker uses the combined value format.
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
        if (this.tag === 'sgdf-switch') {
            this.element.checked = value === true
        } else if (this.tag === 'sgdf-date-time-picker') {
            this.element.value = value instanceof Date ? SgdfFieldDirective.format(value) : ''
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
        if (this.tag === 'sgdf-switch') return this.element.checked
        if (this.tag === 'sgdf-date-time-picker') return SgdfFieldDirective.parse(this.element.value)
        return this.element.value
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
