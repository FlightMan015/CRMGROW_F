import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { STATUS } from '../constants/variable.constants';
import { SMS, TASK } from '../constants/api.constant';
import { Contact } from '../models/contact.model';
import { ErrorService } from './error.service';
import { HttpService } from './http.service';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class SmsService extends HttpService {
  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
  }

  messages: BehaviorSubject<Message[]> = new BehaviorSubject([]);
  messages$ = this.messages.asObservable();
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loading$ = this.loadStatus.asObservable();
  conversations: BehaviorSubject<any[]> = new BehaviorSubject([]);
  conversations$ = this.conversations.asObservable();
  updating: BehaviorSubject<boolean> = new BehaviorSubject(false);
  updating$ = this.updating.asObservable();
  loadSmsSubscription: Subscription;
  contactCount: number;

  loadAll(force = false): void {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.updating.next(true);
    this.loadAllImpl().subscribe((messages) => {
      this.updating.next(false);
      messages
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.messages.next(messages || []);
    });
  }

  updateConversations(data: any): void {
    this.updating.next(true);

    this.loadImplCount(data).subscribe((messages) => {
      this.updating.next(false);
      this.messages.next(messages || []);
    });
  }

  getSmsWithSearchStr(data: any): void {
    this.updating.next(true);

    this.loadSmsSubscription && this.loadSmsSubscription.unsubscribe();
    this.loadSmsSubscription = this.loadImplCount(data).subscribe(
      (messages) => {
        this.updating.next(false);
        this.messages.next(messages || []);
      }
    );
  }

  loadAllImpl(): Observable<Message[]> {
    return this.httpClient.get(this.server + SMS.GET).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Message().deserialize(e))
      ),
      catchError(this.handleError('SMS GET ALL', null))
    );
  }

  loadImplCount(data: any): Observable<Message[]> {
    return this.httpClient
      .post(this.server + SMS.GET_MESSAGE_OF_COUNT, data)
      .pipe(
        map((res) => {
          this.contactCount = res['count'];
          return (res['data'] || []).map((e) => new Message().deserialize(e));
        }),
        catchError(this.handleError('SMS GET ALL', null))
      );
  }

  loadCount(force = false, data: any): void {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.updating.next(true);
    this.loadImplCount(data).subscribe((messages) => {
      this.updating.next(false);
      messages
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.messages.next(messages || []);
    });
  }

  getMessage(contact: Contact): any {
    return this.httpClient
      .post(this.server + SMS.GET_MESSAGE, { contact: contact._id })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('SMS GET MESSAGE', null))
      );
  }

  markRead(id: string, contact: string): any {
    return this.httpClient
      .put(this.server + SMS.MARK_READ + '/' + id, { contact })
      .pipe(
        map((res) => res),
        catchError(this.handleError('MARK AS READ', null))
      );
  }

  searchNumbers(data: any): Observable<any> {
    return this.httpClient.post(this.server + SMS.SEARCH_NUMBER, data).pipe(
      map((res) => res),
      catchError(this.handleError('SEARCH NUMBER', null))
    );
  }

  buyNumbers(data: any): Observable<any> {
    return this.httpClient.post(this.server + SMS.BUY_NUMBER, data).pipe(
      map((res) => res),
      catchError(this.handleError('BUY NUMBER', null))
    );
  }

  buyCredit(data: any): Observable<any> {
    return this.httpClient.post(this.server + SMS.BUY_CREDIT, data).pipe(
      map((res) => res),
      catchError(this.handleError('SMS CREDITS', null))
    );
  }

  loadFiles(contact_id: string, activities: any[]): Observable<any> {
    return this.httpClient
      .post(this.server + SMS.LOAD_FILES, { contact: contact_id, activities })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('LOAD FILE ACTIVITY', null))
      );
  }

  clear$(): void {
    this.messages.next([]);
    this.loadStatus.next(STATUS.NONE);
    this.conversations.next([]);
    this.updating.next(false);
  }
}
