import { Pipe, PipeTransform } from '@angular/core'
import { GenericModel } from '../../util-model/model/generic.model'
import { GenericUtil } from '../util/generic.util'

@Pipe( {
    name: 'visibilityName', standalone: true,
} )
export class VisibilityNamePipe<T extends GenericModel> implements PipeTransform {
    public transform (value: T | undefined, prefix: string | undefined): string {
        const formattedPrefix: string = prefix ? `${prefix}.` : ''
        return formattedPrefix + (GenericUtil.isNull( value ) || !value?.visible ? 'visible.false' : 'visible.true')
    }
}
