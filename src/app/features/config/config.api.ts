import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { RuntimeConfigModel } from '@features/config/runtime-config.model';
import { Observable } from 'rxjs';

const CONFIG_URL: string = '/api/config';

@Injectable({ providedIn: 'root' })
export class ConfigApi {
	private readonly http: HttpClient = inject(HttpClient);

	public fetch(): Observable<RuntimeConfigModel> {
		return this.http.get<RuntimeConfigModel>(CONFIG_URL);
	}
}
