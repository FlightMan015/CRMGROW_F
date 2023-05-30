import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { INTEGRATION } from '../constants/api.constant';
import { ErrorService } from './error.service';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class IntegrationService extends HttpService {
  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
  }

  public buyDialer(level): Observable<any> {
    return this.httpClient
      .post(environment.api + INTEGRATION.CONNECT_DIALER, { level })
      .pipe(
        map((res) => res),
        catchError(this.handleError('Connect Dialer', null))
      );
  }

  public createZoom(data: any): Observable<any> {
    return this.httpClient
      .post(this.server + INTEGRATION.CREATE_ZOOM, data)
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('CREATE ZOOM MEETING', null))
      );
  }
}
