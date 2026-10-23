/**
 * Purpose: Completes the jsdom environment used by the unit tests.
 * Scope: Gives the form-associated custom elements of @sgdf/ui the ElementInternals members jsdom lacks the dialog elements the methods that open and close them and the animation list the web components read.
 * Limits: Stubs only; every element is valid, nothing is validated or submitted and a dialog is not rendered in the top layer.
 */
const attachInternals: typeof HTMLElement.prototype.attachInternals = HTMLElement.prototype.attachInternals

HTMLElement.prototype.attachInternals = function (this: HTMLElement): ElementInternals {
    const internals: ElementInternals = attachInternals.call( this )
    internals.setFormValue ??= (): void => undefined
    internals.setValidity ??= (): void => undefined
    internals.checkValidity ??= (): boolean => true
    internals.reportValidity ??= (): boolean => true
    return Object.defineProperties( internals, {
        validity: { value: internals.validity ?? { valid: true } },
        validationMessage: { value: internals.validationMessage ?? '' },
        states: { value: internals.states ?? new Set<string>() },
    } )
}

HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement): void {
    this.open = true
}

HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement): void {
    this.open = false
}

Element.prototype.getAnimations ??= function (): Animation[] {
    return []
}
