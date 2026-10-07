import { Pipe, PipeTransform } from '@angular/core'
import { GenericModel } from '@shared/models/model/generic.model'
import { GenericHelper } from '@shared/helpers/generic.helper'

@Pipe( {
    name: 'visibilityName', standalone: true,
} )
export class VisibilityNamePipe<T extends GenericModel> implements PipeTransform {
    public transform (value: T | undefined, prefix: string | undefined): string {
        const formattedPrefix: string = prefix ? `${prefix}.` : ''
        return formattedPrefix + (GenericHelper.isNull( value ) || !value?.visible ? 'visible.false' : 'visible.true')
    }
}
