import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AUTH, GARBAGE, USER } from '../constants/api.constant';
import { Garbage } from '../models/garbage.model';
import { Template } from '../models/template.model';
import { Account, User } from '../models/user.model';
import { ErrorService } from './error.service';
import { HttpService } from './http.service';
import { Payment } from '../models/payment.model';
import { Invoice } from '../models/invoice.model';
import { Material } from '../models/material.model';
import {
  ADMIN_CALL_LABELS,
  OTHER_THEMES,
  STATUS,
  THEMES,
  THEME_DATA
} from '../constants/variable.constants';

@Injectable({
  providedIn: 'root'
})
export class UserService extends HttpService {
  profile: BehaviorSubject<User> = new BehaviorSubject(new User());
  profile$: Observable<User> = this.profile.asObservable();

  accounts: BehaviorSubject<any> = new BehaviorSubject(null);
  accounts$: Observable<any> = this.accounts.asObservable();

  garbage: BehaviorSubject<Garbage> = new BehaviorSubject(new Garbage());
  garbage$: Observable<Garbage> = this.garbage.asObservable();

  invoice: BehaviorSubject<any> = new BehaviorSubject(null);
  invoice$ = this.invoice.asObservable();
  loadInvoiceSubscription: Subscription;

  payment: BehaviorSubject<any> = new BehaviorSubject(null);
  payment$ = this.payment.asObservable();
  loadPaymentSubscription: Subscription;

  sms: BehaviorSubject<Template> = new BehaviorSubject(new Template());
  email: BehaviorSubject<Template> = new BehaviorSubject(new Template());

  themes: BehaviorSubject<any[]> = new BehaviorSubject(OTHER_THEMES);
  themes$ = this.themes.asObservable();

  callLabels: BehaviorSubject<string[]> = new BehaviorSubject(
    ADMIN_CALL_LABELS
  );
  callLabels$ = this.callLabels.asObservable();
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loading$ = this.loadStatus.asObservable();

  pages: BehaviorSubject<any[]> = new BehaviorSubject([]);
  pages$ = this.pages.asObservable();

  constructor(private httpClient: HttpClient, errorService: ErrorService) {
    super(errorService);
  }

  public register(): any {}
  public login(user: { email: string; password: string }): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .post(this.server + AUTH.SIGNIN, JSON.stringify(user), {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('SIGNIN REQUEST'))
      );
  }

  public socialSignIn(user): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .post(this.server + AUTH.SOCIAL_SIGNIN, JSON.stringify(user), {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('SOCIAL SIGNIN REQUEST'))
      );
  }

  public socialSignUp(user): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .post(this.server + AUTH.SOCIAL_SIGNUP, JSON.stringify(user), {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('SOCIAL SIGNUP REQUEST'))
      );
  }

  public signup(user: any): any {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .post(this.server + AUTH.SIGNUP, JSON.stringify(user), {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('SIGNUP REQUEST', null))
      );
  }

  /**
   * LOG OUT -> CALL API
   */
  public logout(): Observable<boolean> {
    return this.httpClient.post(this.server + AUTH.LOG_OUT, {}).pipe(
      map((res) => res['status']),
      catchError(this.handleError('LOG OUT', false))
    );
  }
  /**
   * LOG OUT -> Clear Token And profile Informations
   */
  public logoutImpl(): void {
    localStorage.removeItem('token');
    this.profile.next(new User());
    this.garbage.next(new Garbage());
  }
  public requestOAuthUrl(type: string): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .get(this.server + AUTH.OAUTH_REQUEST + type, {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('SOCIAL OAUTH REQUEST', false))
      );
  }

  public requestOutlookProfile(code: string): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .get(this.server + AUTH.OUTLOOK_PROFILE_REQUEST + code, {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('REQUEST OUTLOOK PROFILE', false))
      );
  }

  public requestGoogleProfile(code: string): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .get(this.server + AUTH.GOOGLE_PROFILE_REQUEST + code, {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('REQUEST GOOGLE PROFILE', false))
      );
  }
  public checkEmail(email): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .post(this.server + AUTH.CHECK_EMAIL, JSON.stringify({ email }), {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('CHECK EMAIL'))
      );
  }
  public checkPhone(cell_phone): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .post(this.server + AUTH.CHECK_PHONE, JSON.stringify({ cell_phone }), {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('CHECK PHONE'))
      );
  }

  public authorizeOutlook(code: string): Observable<any> {
    return this.httpClient
      .get(this.server + USER.AUTH_OUTLOOK + '?code=' + code)
      .pipe(
        map((res) => res),
        catchError(this.handleError('AUTHORIZE OUTLOOK'))
      );
  }
  public authorizeGoogle(code: string): Observable<any> {
    return this.httpClient
      .get(this.server + USER.AUTH_GOOGLE + '?code=' + code)
      .pipe(
        map((res) => res),
        catchError(this.handleError('AUTHORIZE GOOGLE'))
      );
  }
  public authorizeOutlookCalendar(code: string): Observable<any> {
    return this.httpClient
      .get(this.server + USER.AUTH_OUTLOOK_CALENDAR + '?code=' + code)
      .pipe(
        map((res) => res),
        catchError(this.handleError('AUTHORIZE OUTLOOK CALENDAR'))
      );
  }
  public authorizeGoogleCalendar(code: string): Observable<any> {
    return this.httpClient
      .get(this.server + USER.AUTH_GOOGLE_CALENDAR + '?code=' + code)
      .pipe(
        map((res) => res),
        catchError(this.handleError('AUTHORIZE GOOGLE CALENDAR'))
      );
  }
  public requestResetPassword(email): Observable<boolean> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .post(
        this.server + AUTH.FORGOT_PASSWORD,
        { email: email },
        {
          headers: reqHeader
        }
      )
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('REQUEST RESET PASSWORD', false))
      );
  }
  public resetPassword(requestData): Observable<boolean> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .post(this.server + AUTH.RESET_PASSWORD, JSON.stringify(requestData), {
        headers: reqHeader
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('RESET PASSWORD', false))
      );
  }
  public isAuthenticated(): boolean {
    if (localStorage.getItem('token') != null) {
      return true;
    } else {
      return false;
    }
  }

  public loadProfile(): Observable<any> {
    return this.httpClient.get(this.server + USER.PROFILE).pipe(
      map((res) => res['data']),
      catchError(this.handleError('GET PROFILE'))
    );
  }
  public loadDefaults(): Observable<any> {
    return this.httpClient.get(this.server + GARBAGE.LOAD_DEFAULT).pipe(
      map((res) => res['data']),
      catchError(this.handleError('LOAD DEFAULT TEMPLATES', null))
    );
  }
  public updateProfile(profile: any): Observable<any> {
    return this.httpClient.put(this.server + USER.UPDATE_PROFILE, profile).pipe(
      map((res) => res['data']),
      catchError(this.handleError('UPDATE PROFILE'))
    );
  }
  public enableDesktopNotification(
    subscription: any,
    option: any
  ): Observable<boolean> {
    return this.httpClient
      .post(this.server + USER.ENABLE_DESKTOP_NOTIFICATION, {
        subscription,
        option
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('ENABLE DESKTOP NOTIFICATION', false))
      );
  }
  public updateUser(field, value): void {
    const user = JSON.parse(localStorage.getItem('user'));
    user[field] = value;
    localStorage.setItem('user', JSON.stringify(user));
  }
  public updatePassword(oldPwd: string, newPwd: string): Observable<boolean> {
    const data = {
      old_password: oldPwd,
      new_password: newPwd
    };
    return this.httpClient
      .post(this.server + USER.UPDATE_PASSWORD, JSON.stringify(data))
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('Password Change', false))
      );
  }
  public createPassword(password: string): Observable<boolean> {
    const data = {
      password: password
    };
    return this.httpClient
      .post(this.server + USER.CREATE_PASSWORD, JSON.stringify(data))
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('CREATE PASSWORD', false))
      );
  }
  /**
   * Load the User Payment Information
   * @param id : Payment Information Id
   */

  public loadPayment(id: string): void {
    this.loadPaymentSubscription && this.loadPaymentSubscription.unsubscribe();
    this.loadPaymentSubscription = this.loadPaymentImpl(id).subscribe((res) => {
      if (res) {
        this.payment.next(res);
      }
    });
  }

  public loadPaymentImpl(id: string): Observable<any> {
    return this.httpClient.get(this.server + USER.PAYMENT + id).pipe(
      map((res) => res['data']),
      catchError(this.handleError('LOAD PAYMENT'))
    );
  }

  public updatePayment(payment: any): any {
    return this.httpClient
      .post(this.server + USER.UPDATE_PAYMENT, payment)
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE PAYMENT', false))
      );
  }

  public loadInvoice(): void {
    this.loadInvoiceSubscription && this.loadInvoiceSubscription.unsubscribe();
    this.loadInvoiceSubscription = this.loadInvoiceImpl().subscribe((res) => {
      if (res) {
        this.invoice.next(res);
      }
    });
  }

  public loadInvoiceImpl(): any {
    return this.httpClient.get(this.server + USER.GET_INVOICE).pipe(
      map((res) => res),
      catchError(this.handleError('LOAD INVOICE', null))
    );
  }

  public setToken(token: string): void {
    localStorage.setItem('token', token);
  }
  public getToken(): any {
    return localStorage.getItem('token');
  }
  public updateLocalStorageItem(item: string, value: string): void {
    localStorage.setItem(item, value);
  }
  public clearLocalStorageItem(item: string): void {
    localStorage.removeItem(item);
  }

  /**
   * Init the User data from API call
   * @param profile: User
   */
  public setProfile(profile: User): void {
    this.profile.next(profile);
    if (profile && profile._id) {
      const company = profile.company;
      this.themes.next(THEME_DATA[company] || OTHER_THEMES);
    }
  }
  /**
   * Update the profile and submit the subject
   * @param data: Update Profile Imple
   */
  public updateProfileImpl(data: any): void {
    const profile = this.profile.getValue();
    this.profile.next({ ...profile, ...data });
    if (profile && profile._id) {
      const updated = { ...profile, ...data };
      const company = updated.company;
      this.themes.next(THEME_DATA[company] || OTHER_THEMES);
    }
    return;
  }
  /**
   * Init the Garbage from API call
   * @param garbage: Garbage
   */
  public setGarbage(garbage: Garbage): void {
    this.garbage.next(garbage);
    return;
  }
  public updateGarbage(garbage: any): Observable<boolean> {
    return this.httpClient.put(this.server + USER.UPDATE_GARBAGE, garbage).pipe(
      map((res) => res['status']),
      catchError(this.handleError('UPDATE GARBAGE', false))
    );
  }
  /**
   * Update the Garbage
   * @param garbage : Garbage
   */
  public updateGarbageImpl(data: any): void {
    const garbage = this.garbage.getValue();
    this.garbage.next({ ...garbage, ...data });
    return;
  }
  public requestSyncUrl(type: string): Observable<any> {
    switch (type) {
      case 'gmail':
        return this.httpClient.get(this.server + USER.SYNC_GMAIL).pipe(
          map((res) => res),
          catchError(this.handleError('REQUEST GOOGLE EMAIL SYNC', null))
        );
      case 'outlook':
        return this.httpClient.get(this.server + USER.SYNC_OUTLOOK).pipe(
          map((res) => res),
          catchError(this.handleError('REQUEST OUTLOOK EMAIL SYNC', null))
        );
    }
  }
  public connectAnotherService(): Observable<any> {
    return this.httpClient.get(this.server + USER.SET_ANOTHER_MAIL).pipe(
      map((res) => res),
      catchError(this.handleError('CONNECT OTHER SERVICE', null))
    );
  }
  public requestCalendarSyncUrl(type: string): Observable<any> {
    switch (type) {
      case 'gmail':
        return this.httpClient.get(this.server + USER.CALENDAR_SYNC_GMAIL).pipe(
          map((res) => res),
          catchError(this.handleError('REQUEST GOOGLE CALENDAR SYNC'))
        );
      case 'outlook':
        return this.httpClient
          .get(this.server + USER.CALENDAR_SYNC_OUTLOOK)
          .pipe(
            map((res) => res),
            catchError(this.handleError('REQUEST OUTLOOK CALENDAR SYNC'))
          );
    }
  }
  public disconnectMail(): any {
    return this.httpClient.get(this.server + USER.DISCONNECT_MAIL).pipe(
      map((res) => res),
      catchError(this.handleError('DISCONNECT EMAIL', null))
    );
  }
  public disconnectCalendar(email: string): any {
    const data = {
      connected_email: email
    };
    return this.httpClient
      .post(this.server + USER.DISCONNECT_CALENDAR, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('DISCONNECT CALENDAR', null))
      );
  }
  public requestZoomSyncUrl(): Observable<any> {
    return this.httpClient.get(this.server + USER.SYNC_ZOOM);
  }
  public authorizeZoom(code: string): Observable<any> {
    return this.httpClient
      .get(this.server + USER.AUTH_ZOOM + '?code=' + code)
      .pipe(
        map((res) => res),
        catchError(this.handleError('AUTHORIZE ZOOM'))
      );
  }
  public loadAffiliate(): Observable<any> {
    return this.httpClient.get(this.server + USER.LOAD_AFFILIATE).pipe(
      map((res) => res),
      catchError(this.handleError('GET USER AFFILIATE'))
    );
  }
  public createAffiliate(): Observable<any> {
    return this.httpClient.post(this.server + USER.CREATE_AFFILIATE, {}).pipe(
      map((res) => res),
      catchError(this.handleError('CREATE AFFILIATE'))
    );
  }
  public loadReferrals(page): Observable<any> {
    return this.httpClient.get(this.server + USER.LOAD_REFERRALS).pipe(
      map((res) => res),
      catchError(this.handleError('GET USER REFERRALS'))
    );
  }
  public updateAffiliate(data): Observable<any> {
    return this.httpClient.put(this.server + USER.CREATE_AFFILIATE, data).pipe(
      map((res) => res['data']),
      catchError(this.handleError('UPDATE PROFILE'))
    );
  }
  public connectSMTP(data): Observable<any> {
    return this.httpClient
      .post(this.server + USER.CONNECT_SMTP, { ...data })
      .pipe(
        map((res) => res),
        catchError(this.handleError('CONNECT SMTP'))
      );
  }

  public verifySMTP(data): Observable<any> {
    return this.httpClient
      .post(this.server + USER.VERIFY_SMTP, { ...data })
      .pipe(
        map((res) => res),
        catchError(this.handleError('VERIFY SMTP'))
      );
  }

  public verifySMTPCode(code): Observable<any> {
    return this.httpClient
      .post(this.server + USER.VERIFY_SMTP_CODE, { code })
      .pipe(
        map((res) => res),
        catchError(this.handleError('VERIFY SMTP CODE'))
      );
  }

  public cancelAccount(data): Observable<any> {
    return this.httpClient
      .post(this.server + USER.CANCEL_ACCOUNT, { ...data })
      .pipe(
        map((res) => res),
        catchError(this.handleError('CANCEL ACCOUNT'))
      );
  }

  public sleepAccount(): Observable<any> {
    return this.httpClient.get(this.server + USER.SLEEP_ACCOUNT).pipe(
      map((res) => res),
      catchError(this.handleError('SLEEP ACCOUNT'))
    );
  }

  public updatePackage(data): Observable<any> {
    return this.httpClient
      .post(this.server + USER.UPDATE_PACKAGE, { ...data })
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE PACKAGE'))
      );
  }

  public checkDowngrade(selectedPackage): Observable<any> {
    return this.httpClient
      .post(this.server + USER.CHECK_DOWNGRADE, { selectedPackage })
      .pipe(
        map((res) => res),
        catchError(this.handleError('CHECK DOWNGRADE PACKAGE'))
      );
  }

  public getUserInfo(id): Observable<any> {
    return this.httpClient.get(this.server + USER.INFO + id).pipe(
      map((res) => res),
      catchError(this.handleError('GET USER INFO'))
    );
  }

  public getUserInfoItem(type: string): any {
    const user = this.getUser();
    return user[type];
  }
  public getUser(): any {
    const user = localStorage.getItem('user');
    if (user) {
      return JSON.parse(localStorage.getItem('user'));
    } else {
      return {};
    }
  }
  public setUser(user: User): any {
    localStorage.setItem('user', JSON.stringify(user));
  }

  public easyLoadSubAccounts(): any {
    return this.httpClient.get(this.server + USER.LOAD_SUB_ACCOUNTS).pipe(
      map((res) => res),
      catchError(this.handleError('GET ACCOUNTS', null))
    );
  }
  public getSubAccount(): any {
    return this.httpClient.get(this.server + USER.GET_SUB_ACCOUNT).pipe(
      map((res) => res),
      catchError(this.handleError('GET SUB ACCOUNT', null))
    );
  }
  public buySubAccount(data): any {
    return this.httpClient.post(this.server + USER.BUY_SUB_ACCOUNT, data).pipe(
      map((res) => res),
      catchError(this.handleError('BUY SUB ACCOUNT'))
    );
  }
  public recallSubAccount(data): any {
    return this.httpClient
      .post(this.server + USER.RECALL_SUB_ACCOUNT, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('RECALL SUB ACCOUNT'))
      );
  }
  public mergeSubAccount(data): any {
    return this.httpClient
      .post(this.server + USER.MERGE_SUB_ACCOUNT, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('MERGE SUB ACCOUNTS'))
      );
  }
  public createSubAccount(data: any): any {
    return this.httpClient
      .post(this.server + USER.CREATE_SUB_ACCOUNT, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('CREATE SUB ACCOUNT'))
      );
  }
  public removeSubAccount(id: string, data): any {
    return this.httpClient
      .delete(this.server + USER.CREATE_SUB_ACCOUNT + id, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('DELETE SUB ACCOUNT'))
      );
  }
  public updateSubAccount(id: string, data: any): any {
    return this.httpClient
      .put(this.server + USER.CREATE_SUB_ACCOUNT + id, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE SUB ACCOUNT'))
      );
  }
  public changeAccount(id: string): any {
    return this.httpClient
      .post(this.server + USER.CHANGE_SUB_ACCOUNT, { user_id: id })
      .pipe(
        map((res) => res),
        catchError(this.handleError('CHANGE SUB ACCOUNT'))
      );
  }
  public updateEmailDraft(data): any {
    return this.httpClient
      .put(this.server + USER.UPDATE_DRAFT, { email_draft: data })
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE EMAIL DRAFT'))
      );
  }
  public updateTextDraft(data): any {
    return this.httpClient
      .put(this.server + USER.UPDATE_DRAFT, { text_draft: data })
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE TEXT DRAFT'))
      );
  }

  public scheduleDemo(): any {
    return this.httpClient.get(this.server + USER.SCHEDULE).pipe(
      map((res) => res['status'] || false),
      catchError(this.handleError('SCHEDULE', false))
    );
  }

  public scheduled(): any {
    return this.httpClient.get(this.server + USER.SCHEDULED_ONE).pipe(
      map((res) => res['status'] || false),
      catchError(this.handleError('SCHEDULE', false))
    );
  }

  public getUserStatistics(): any {
    return this.httpClient.get(this.server + USER.STATISTICS).pipe(
      map((res) => res),
      catchError(this.handleError('STATISTICS', false))
    );
  }

  public loadPages(token: string, force = false): any {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.loadPagesImpl(token).then((pages) => {
      pages
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.pages.next(pages || []);
    });
  }

  public loadPagesImpl(token: string): any {
    const method = 'GET';
    const myHeaders = new Headers();
    myHeaders.append('Authorization', 'Bearer ' + token);
    return fetch(
      environment.pageBuilderAPI + '/api/v1/sites?limit=false&offset=0',
      {
        method,
        headers: myHeaders
      }
    ).then((res) => res.json(), catchError(this.handleError('PAGES', null)));
  }

  public deleteSite(token: string, site_id: string): any {
    const method = 'DELETE';
    const myHeaders = new Headers();
    myHeaders.append('Authorization', 'Bearer ' + token);
    return fetch(environment.pageBuilderAPI + '/api/v1/sites/' + site_id, {
      method,
      headers: myHeaders
    }).then((res) => res.json());
  }

  public publishSite(token: string, site_id: string): any {
    const method = 'POST';
    const myHeaders = new Headers();
    myHeaders.append('Authorization', 'Bearer ' + token);
    return fetch(
      environment.pageBuilderAPI + '/api/v1/sites/' + site_id + '/publish',
      {
        method,
        headers: myHeaders
      }
    ).then((res) => res.json());
  }
}
