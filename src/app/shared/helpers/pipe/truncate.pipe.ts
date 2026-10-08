import { Pipe, PipeTransform } from '@angular/core'
import { StringHelper } from '@shared/helpers/string.helper'

/**
 * Purpose: Truncates text for display.
 * Scope: Cuts after a length and appends a trail.
 * Limits: Does not break on word boundaries.
 */
@Pipe( {
    name: 'truncate', standalone: true,
} )
export class TruncatePipe implements PipeTransform {
    public transform (value: string, pageSize: number = 20, trail: string = '…'): string {
        return StringHelper.truncate( value, pageSize, trail )
    }
}
