import { Pipe, PipeTransform } from '@angular/core'
import { GenericModel } from '@shared/models/model/generic.model'
import { GenericHelper } from '@shared/helpers/generic.helper'

/**
 * Purpose: Gives the translation key of the visibility of an element.
 * Scope: Appends visible.true or visible.false to an optional prefix.
 * Limits: Returns a key; translation is done by the caller.
 */
@Pipe( {
    name: 'visibilityName', standalone: true,
} )
export class VisibilityNamePipe<T extends GenericModel> implements PipeTransform {
    public transform (value: T | undefined, prefix: string | undefined): string {
        const formattedPrefix: string = prefix ? `${prefix}.` : ''
        return formattedPrefix + (GenericHelper.isNull( value ) || !value?.visible ? 'visible.false' : 'visible.true')
    }
}
