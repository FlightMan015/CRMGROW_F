import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { INTEGRATION, SMS, USER } from '../constants/api.constant';
import { STATUS } from '../constants/variable.constants';
import {catchError} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class ConnectService {
  logoutSignal = new Subject<any>();
  calendlyAll: BehaviorSubject<any[]> = new BehaviorSubject([]);
  calendlyAll$ = this.calendlyAll.asObservable();
  loadCalendlyAllStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  loadingCalendlyAll$ = this.loadCalendlyAllStatus.asObservable();

  constructor(private httpClient: HttpClient) {}

  public requestSyncUrl(type: string): Observable<any> {
    switch (type) {
      case 'gmail':
        return this.httpClient.get(environment.api + USER.SYNC_GMAIL);
      case 'outlook':
        return this.httpClient.get(environment.api + USER.SYNC_OUTLOOK);
    }
  }

  public connectAnotherService(): Observable<any> {
    return this.httpClient.get(environment.api + USER.SET_ANOTHER_MAIL);
  }

  public requestCalendarSyncUrl(type: string): Observable<any> {
    switch (type) {
      case 'gmail':
        return this.httpClient.get(environment.api + USER.CALENDAR_SYNC_GMAIL);
      case 'outlook':
        return this.httpClient.get(
          environment.api + USER.CALENDAR_SYNC_OUTLOOK
        );
    }
  }

  public connectCalendly(apiKey: any): any {
    return this.httpClient.post(
      environment.api + INTEGRATION.CHECK_CALENDLY,
      apiKey
    );
  }

  public disconnectCalendly(): any {
    return this.httpClient.get(
      environment.api + INTEGRATION.DISCONNECT_CALENDLY
    );
  }

  public searchNumbers(data: any): Observable<any> {
    return this.httpClient.post(environment.api + SMS.SEARCH_NUMBER, data);
  }

  public buyNumbers(data: any): Observable<any> {
    return this.httpClient.post(environment.api + SMS.BUY_NUMBER, data);
  }

  public buyCredit(data: any): Observable<any> {
    return this.httpClient.post(environment.api + SMS.BUY_CREDIT, data);
  }
  public getToken(): any {
    return this.httpClient.get(environment.api + INTEGRATION.GET_TOKEN);
  }

  public loadCalendlyAll(force = false): void {
    if (!force) {
      const loadStatus = this.loadCalendlyAllStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadCalendlyAllStatus.next(STATUS.REQUEST);
    this.getEvent().subscribe((calendlyList) => {
      calendlyList.data
        ? this.loadCalendlyAllStatus.next(STATUS.SUCCESS)
        : this.loadCalendlyAllStatus.next(STATUS.FAILURE);
      this.calendlyAll.next(calendlyList.data || []);
    });
  }

  public getEvent(): Observable<any> {
    return this.httpClient.get(environment.api + INTEGRATION.GET_CALENDLY);
  }

  public setEvent(event: any): any {
    return this.httpClient.post(environment.api + INTEGRATION.SET_EVENT, event);
  }

  public sendLogout(): void {
    this.logoutSignal.next(new Date());
  }

  public receiveLogout(): Observable<any> {
    return this.logoutSignal.asObservable();
  }
}
