import { HttpParams } from '@angular/common/http'
import { GenericUtil } from './generic.util'

export class QueryUtil {
    public static buildQueryParams (
        offset: number | undefined,
        limit: number | undefined,
        params: object | undefined,
    ): HttpParams {
        let builtParams: HttpParams = new HttpParams()
            .set( 'offset', offset ?? 0 )
            .set( 'limit', limit ?? 20 )

        if (GenericUtil.isNull( params )) return builtParams

        Object.entries( params! ).forEach( ([ key, value ]: [ string, string | number | boolean | undefined ]): void => {
            if (GenericUtil.nonNull( value )) builtParams = builtParams.set( key, value! )
        } )

        return builtParams
    }
}
