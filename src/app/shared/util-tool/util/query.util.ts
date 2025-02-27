import { HttpParams } from '@angular/common/http'
import { GenericUtil } from './generic.util'

export class QueryUtil {
    public static buildQueryParams (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: object | undefined,
    ): HttpParams {
        let builtParams: HttpParams = new HttpParams()
            .set( 'pageNumber', pageNumber ?? 0 )
            .set( 'pageSize', pageSize ?? 20 )

        if (GenericUtil.isNull( params )) return builtParams

        Object.entries( params! ).forEach( ([ key, value ]: [ string, string | number | boolean | undefined ]): void => {
            if (GenericUtil.nonNull( value )) builtParams = builtParams.set( key, value! )
        } )

        return builtParams
    }
}
