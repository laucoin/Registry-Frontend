import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { RuntimeConfigMapper, RuntimeConfigResponse } from '@shared/mappers/runtime-config.mapper';
import { RuntimeConfigModel } from '@shared/models/runtime-config.model';
import { map, Observable } from 'rxjs';

const CONFIG_URL: string = '/api/config';

/**
 * Purpose: HTTP layer that fetches the app's runtime configuration from the backend.
 * Scope: A single GET call, mapping the DTO to its model; injected only by ConfigStore.
 * Limits: Holds no state and is not the place to cache or persist the result.
 */
@Injectable({ providedIn: 'root' })
export class ConfigApi {
	private readonly _http: HttpClient = inject(HttpClient);

	public fetch(): Observable<RuntimeConfigModel> {
		return this._http.get<RuntimeConfigResponse>(CONFIG_URL).pipe(map(RuntimeConfigMapper.toModel));
	}
}
