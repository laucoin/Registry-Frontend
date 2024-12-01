import { Pipe, PipeTransform } from '@angular/core'
import { StringUtils } from '../util/string.util'

@Pipe( {
    name: 'truncate', standalone: true,
} )
export class TruncatePipe implements PipeTransform {
    public transform (value: string, limit: number = 20, trail: string = '…'): string {
        return StringUtils.truncate( value, limit, trail )
    }
}
