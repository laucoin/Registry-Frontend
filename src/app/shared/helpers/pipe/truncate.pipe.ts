import { Pipe, PipeTransform } from '@angular/core'
import { StringHelper } from '@shared/helpers/string.helper'

@Pipe( {
    name: 'truncate', standalone: true,
} )
export class TruncatePipe implements PipeTransform {
    public transform (value: string, pageSize: number = 20, trail: string = '…'): string {
        return StringHelper.truncate( value, pageSize, trail )
    }
}
