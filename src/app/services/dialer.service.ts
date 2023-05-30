import { HttpClient, HttpHeaderResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DIALER, TAG } from '../constants/api.constant';
import { RinglessRequest } from '../models/wavv.model';
import { ErrorService } from './error.service';
import { HttpService } from './http.service';
import { STATUS } from '../constants/variable.constants';

@Injectable({
  providedIn: 'root'
})
export class DialerService extends HttpService {
  history: BehaviorSubject<any[]> = new BehaviorSubject([]);
  history$: Observable<any[]> = this.history.asObservable();
  rvms: BehaviorSubject<any[]> = new BehaviorSubject([]);
  rvms$ = this.rvms.asObservable();
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadStatus$ = this.loadStatus.asObservable();

  constructor(errorService: ErrorService, private http: HttpClient) {
    super(errorService);
  }

  register(data: any): Observable<any> {
    return this.http.post(this.server + DIALER.REGISTER, data).pipe(
      map((res) => res),
      catchError(this.handleError('REGISTER CALL HISTORY', null))
    );
  }
  push$(newOne: any): void {
    const history = this.history.getValue();
    history.push(newOne);
    this.history.next(history);
  }
  update$(data: any): any {
    let log;
    const history = this.history.getValue();
    history.some((e) => {
      if (e.contactId === data.contactId) {
        for (const key in data) {
          e[key] = data[key];
        }
        log = e;
        return true;
      }
    });
    this.history.next([...history]);
    return log;
  }
  pop$(data): void {
    const history = this.history.getValue();
    history.some((e, index) => {
      if (e.contactId === data.contactId) {
        history.splice(index, 1);
        return true;
      }
    });
    this.history.next([...history]);
  }
  clean$(): void {
    this.history.next([]);
  }
  loadRecording(id): Observable<any> {
    return this.http
      .post(this.server + DIALER.GET_RECORDING, { recording: id })
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOADING RECORDING', null))
      );
  }
  updateLog(id, data): Observable<any> {
    return this.http.put(this.server + DIALER.EDIT + id, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('UPDATING RECORDING', null))
    );
  }

  saveDealDialer(data): Observable<any> {
    return this.http.post(this.server + DIALER.DEAL_DIALER, data).pipe(
      map((res) => res),
      catchError(this.handleError('REGISTER DEAL CALL HISTORY', null))
    );
  }

  loadAudioMessages(force: boolean = true): void {
    if (
      !force &&
      this.loadStatus.getValue() === STATUS.SUCCESS &&
      this.rvms.getValue().length
    ) {
      return;
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.loadAudioMessagesImpl().subscribe((rvms) => {
      rvms
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.rvms.next(rvms);
    });
  }
  /**
   * Create Ringless Message
   * @param data: data: Form Data
   * @returns
   */
  createAudioMessage(data: FormData): Observable<any> {
    const headers = new HttpHeaders({
      'No-Content': 'True'
    });
    return this.http
      .post(this.server + DIALER.CREATE_RINGLESS, data, {
        headers
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('Create Ringless Message'))
      );
  }

  /**
   * Load All Ringless Messages
   * @returns
   */
  loadAudioMessagesImpl(): Observable<any> {
    return this.http.get(this.server + DIALER.LOAD_RINGLESS).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('Load Ringless Messages'))
    );
  }

  /**
   * Send the Ringless Message
   * @param data: Ringless Message: RinglessRequest
   * @returns
   */
  sendAudioMessage(data: RinglessRequest): Observable<any> {
    return this.http.post(this.server + DIALER.SEND_RINGLESS, data).pipe(
      map((res) => res),
      catchError(this.handleError('Send Ringless Message'))
    );
  }
}
