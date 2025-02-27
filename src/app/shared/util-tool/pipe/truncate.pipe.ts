import { Pipe, PipeTransform } from '@angular/core'
import { StringUtil } from '../util/string.util'

@Pipe( {
    name: 'truncate', standalone: true,
} )
export class TruncatePipe implements PipeTransform {
    public transform (value: string, pageSize: number = 20, trail: string = '…'): string {
        return StringUtil.truncate( value, pageSize, trail )
    }
}
