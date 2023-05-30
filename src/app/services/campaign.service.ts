import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ErrorService } from './error.service';
import { HttpService } from './http.service';
import { StoreService } from './store.service';
import { CAMPAIGN, MAILLIST } from '../constants/api.constant';
import { Campaign } from '../models/campaign.model';
import { MailList } from '../models/maillist.model';
import { STATUS } from '../constants/variable.constants';

@Injectable({
  providedIn: 'root'
})
export class CampaignService extends HttpService {
  constructor(
    errorService: ErrorService,
    private httpClient: HttpClient,
    private storeService: StoreService
  ) {
    super(errorService);
  }

  bulkLists: BehaviorSubject<Campaign[]> = new BehaviorSubject([]);
  bulkLists$ = this.bulkLists.asObservable();
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loading$ = this.loadStatus.asObservable();

  create(data): Observable<any> {
    return this.httpClient
      .post(this.server + CAMPAIGN.CREATE, { ...data })
      .pipe(
        map((res) => res),
        catchError(this.handleError('CREATE CAMPAIGN', []))
      );
  }

  get(id: string): Observable<any> {
    return this.httpClient.get(this.server + CAMPAIGN.GET + id).pipe(
      map((res) => res['data'] || null),
      catchError(this.handleError('GET CAMPAIGN', null))
    );
  }

  update(id: string, payload: any): Observable<any> {
    return this.httpClient.put(this.server + CAMPAIGN.EDIT + id, payload).pipe(
      map((res) => res),
      catchError(this.handleError('UPDATE CAMPAIGN', null))
    );
  }

  loadSessions(id: string): Observable<any> {
    return this.httpClient
      .post(this.server + CAMPAIGN.LOAD_SESSION, { id })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('GET CAMPAIGN SESSIONS', []))
      );
  }

  loadActivities(id: string, data: any): Observable<any> {
    return this.httpClient
      .post(this.server + CAMPAIGN.LOAD_ACTIVIES, { id, data })
      .pipe(
        map((res) => res['data'] || null),
        catchError(this.handleError('GET CAMPAIGN ACTIVITIES', null))
      );
  }

  loadAll(force = false): void {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.loadAllImpl().subscribe((bulkLists) => {
      bulkLists
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.bulkLists.next(bulkLists || []);
    });
  }

  loadAwaitCampaigns(): Observable<Campaign[]> {
    return this.httpClient.get(this.server + CAMPAIGN.LOAD_AWAITCAMPAIGN).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Campaign().deserialize(e))
      ),
      catchError(this.handleError('LOAD AWAIT CAMPAIGN LIST', []))
    );
  }

  loadAllImpl(): Observable<Campaign[]> {
    return this.httpClient.get(this.server + CAMPAIGN.GET).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Campaign().deserialize(e))
      ),
      catchError(this.handleError('LOAD ALL BULK LIST', []))
    );
  }

  removeSession(data): Observable<any> {
    return this.httpClient
      .post(this.server + CAMPAIGN.REMOVE_SESSION, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('CANCEL CAMPAIGN CONTACT', null))
      );
  }

  removeContact(data): Observable<any> {
    return this.httpClient
      .post(this.server + CAMPAIGN.REMOVE_CONTACT, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('CANCEL CAMPAIGN CONTACT', null))
      );
  }

  loadDayStatus(): Observable<any> {
    return this.httpClient.get(this.server + CAMPAIGN.DAY_STATUS).pipe(
      map((res) => res),
      catchError(this.handleError('CHECKING AVAILABLE DATES', null))
    );
  }

  saveAsDraft(data): Observable<any> {
    return this.httpClient.post(this.server + CAMPAIGN.DRAFT, data).pipe(
      map((res) => res),
      catchError(this.handleError('SAVING AS DRAFT', null))
    );
  }

  publish(data): Observable<any> {
    return this.httpClient.post(this.server + CAMPAIGN.PUBLISH, data).pipe(
      map((res) => res),
      catchError(this.handleError('PUBLISHING THE CAMPAIGN', null))
    );
  }

  remove(id: string): Observable<any> {
    return this.httpClient.post(this.server + CAMPAIGN.REMOVE, { id }).pipe(
      map((res) => res),
      catchError(this.handleError('REMOVING THE CAMPAIGN', null))
    );
  }

  loadDraft(id: string): Observable<any> {
    return this.httpClient.post(this.server + CAMPAIGN.LOAD_DRAFT, { id }).pipe(
      map((res) => res),
      catchError(this.handleError('LOADING THE CAMPAIGN', null))
    );
  }

  loadContacts(id: string): Observable<any> {
    return this.httpClient
      .post(this.server + CAMPAIGN.LOAD_CONTACTS, { id })
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOADING THE CAMPAIGN CONTACTS', null))
      );
  }

  clear$(): void {
    this.bulkLists.next([]);
    this.loadStatus.next(STATUS.NONE);
  }
}
