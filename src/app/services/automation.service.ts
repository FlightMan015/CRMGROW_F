import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AUTOMATION } from '../constants/api.constant';
import { STATUS } from '../constants/variable.constants';
import { Automation } from '../models/automation.model';
import { Contact } from '../models/contact.model';
import { ErrorService } from './error.service';
import { HttpService } from './http.service';
import { SearchOption } from '../models/searchOption.model';

@Injectable({
  providedIn: 'root'
})
export class AutomationService extends HttpService {
  automations: BehaviorSubject<Automation[]> = new BehaviorSubject([]);
  automations$ = this.automations.asObservable();
  libraries: BehaviorSubject<Automation[]> = new BehaviorSubject([]);
  libraries$ = this.libraries.asObservable();
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loading$ = this.loadStatus.asObservable();

  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
  }

  /**
   * Load All Automations
   * @param force Flag to load force
   */
  loadAll(force = false): void {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.loadAllImpl().subscribe((automations) => {
      automations
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.automations.next(automations || []);
    });
  }
  /**
   * Call Load API
   */
  loadAllImpl(): Observable<Automation[]> {
    return this.httpClient.get(this.server + AUTOMATION.LOAD_ALL).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Automation().deserialize(e))
      ),
      catchError(this.handleError('LOAD ALL AUTOMATION', null))
    );
  }

  loadOwn(force = false): void {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.loadOwnImpl().subscribe((automations) => {
      automations
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.automations.next(automations || []);
    });
  }
  /**
   * Call Load API
   */
  loadOwnImpl(): Observable<Automation[]> {
    return this.httpClient.get(this.server + AUTOMATION.LOAD_OWN).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Automation().deserialize(e))
      ),
      catchError(this.handleError('LOAD MY AUTOMATION', null))
    );
  }

  loadLibrary(force = false): void {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.loadLibraryImpl().subscribe((automations) => {
      automations
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.libraries.next(automations || []);
    });
  }
  /**
   * Call Load API
   */
  loadLibraryImpl(): Observable<Automation[]> {
    return this.httpClient.post(this.server + AUTOMATION.LOAD_LIBRARY, {}).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Automation().deserialize(e))
      ),
      catchError(this.handleError('LOAD LIBRARY', null))
    );
  }

  reload(): void {
    // this.loadAll(true);
    this.loadOwn(true);
  }

  search(keyword: string): Observable<Automation[]> {
    return this.httpClient
      .post(this.server + AUTOMATION.SEARCH, { search: keyword })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Automation().deserialize(e))
        ),
        catchError(this.handleError('SEARCH AUTOMATION', []))
      );
  }

  getByPage(page: string): Observable<any> {
    return this.httpClient.get(this.server + AUTOMATION.LOAD_PAGE).pipe(
      map((res) => res),
      catchError(this.handleError('GET AUTOMATION PAGE BY ID', []))
    );
  }
  getStatus(id, contacts): Observable<Automation[]> {
    return this.httpClient
      .post(this.server + AUTOMATION.DETAIL + id, { contacts })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('GET AUTOMATION STATUS', []))
      );
  }
  getAssignedContacts(id: string): Observable<Contact[]> {
    return this.httpClient.get(this.server + AUTOMATION.CONTACTS + id).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Contact().deserialize(e))
      ),
      catchError(this.handleError('GET AUTOMATION STATUS', []))
    );
  }
  getContactDetail(contact: string): Observable<any> {
    return this.httpClient
      .post(this.server + AUTOMATION.CONTACT_DETAIL, {
        contact
      })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('GET CONTACT STATUS DETAIL', null))
      );
  }
  delete(id: string): Observable<any> {
    return this.httpClient.delete(this.server + AUTOMATION.DELETE + id).pipe(
      map((res) => res),
      catchError(this.handleError('DELETE AUTOMATION', false))
    );
  }
  bulkRemove(ids): Observable<any> {
    return this.httpClient
      .post(this.server + AUTOMATION.BULK_REMOVE, { data: ids })
      .pipe(
        map((res) => res),
        catchError(this.handleError('DELETE AUTOMATION', false))
      );
  }
  getChildAutomationNames(id): Observable<any[]> {
    return this.httpClient
      .post(this.server + AUTOMATION.GET_TITLES, { id: id })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('DELETE AUTOMATION', false))
      );
  }
  get(id: string, pageSize = 50, page = 0): Observable<Automation> {
    const data = {
      id: id,
      count: pageSize,
      skip: page
    };
    return this.httpClient.post(this.server + AUTOMATION.READ, data).pipe(
      map((res) => res['data']),
      catchError(this.handleError('READ AUTOMATION', null))
    );
  }
  update(id, automation): Observable<Automation> {
    return this.httpClient
      .put(this.server + AUTOMATION.UPDATE + id, automation)
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('UPDATE AUTOMATION', null))
      );
  }
  create(body): Observable<Automation> {
    return this.httpClient.post(this.server + AUTOMATION.CREATE, body).pipe(
      map((res) => res['data']),
      catchError(this.handleError('CREATE AUTOMATION', null))
    );
  }
  download(body): Observable<any> {
    return this.httpClient.post(this.server + AUTOMATION.DOWNLOAD, body).pipe(
      map((res) => res['status']),
      catchError(this.handleError('CREATE AUTOMATION', null))
    );
  }

  bulkAssign(
    automation: string,
    contacts: string[],
    deals: string[]
  ): Observable<any> {
    if (deals) {
      return this.httpClient
        .post(this.server + AUTOMATION.ASSIGN, {
          automation_id: automation,
          deals
        })
        .pipe(
          map((res) => res),
          catchError(this.handleError('AUTOMATION BULK ASSIGN', null))
        );
    } else {
      return this.httpClient
        .post(this.server + AUTOMATION.ASSIGN, {
          automation_id: automation,
          contacts
        })
        .pipe(
          map((res) => res),
          catchError(this.handleError('AUTOMATION BULK ASSIGN', null))
        );
    }
  }

  reAssign(
    automation: string,
    contacts: string[],
    deals: string[]
  ): Observable<boolean> {
    return this.httpClient
      .post(this.server + AUTOMATION.ASSIGN_NEW, {
        automation_id: automation,
        contacts,
        deals
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('AUTOMATION REASSIGN', false))
      );
  }

  unAssign(contact: string): Observable<boolean> {
    return this.httpClient.get(this.server + AUTOMATION.CANCEL + contact).pipe(
      map((res) => res['status']),
      catchError(this.handleError('UNASSIGN AUTOMATION', false))
    );
  }

  unAssignDeal(dealId: string): Observable<boolean> {
    return this.httpClient
      .get(this.server + AUTOMATION.CANCEL_DEAL + dealId)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('UNASSIGN DEAL AUTOMATION', false))
      );
  }

  // loadOwn(): Observable<Automation[]> {
  //   return this.httpClient.get(this.server + AUTOMATION.LOAD_OWN).pipe(
  //     map((res) => res['data'] || []),
  //     catchError(this.handleError('LOAD OWN AUTOMATION', []))
  //   );
  // }

  clear$(): void {
    this.loadStatus.next(STATUS.NONE);
    this.automations.next([]);
  }

  searchContact(id: string, keyword: string): Observable<Contact[]> {
    return this.httpClient
      .post(this.server + AUTOMATION.SEARCH_CONTACT, {
        automation: id,
        search: keyword
      })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Contact().deserialize(e))
        ),
        catchError(this.handleError('SEARCH AUTOMATION CONTACT', []))
      );
  }

  searchDeal(id: string, keyword: string): Observable<any> {
    return this.httpClient
      .post(this.server + AUTOMATION.SEARCH_DEAL, {
        automation: id,
        search: keyword
      })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('SEARCH AUTOMATION DEAL', []))
      );
  }

  moveFiles(body: any): Observable<boolean> {
    return this.httpClient.post(this.server + AUTOMATION.MOVE_FILES, body).pipe(
      map((res) => res['status']),
      catchError(this.handleError('MOVE AUTOMATION', null))
    );
  }

  removeFolder(body: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + AUTOMATION.REMOVE_FOLDER, body)
      .pipe(
        map((res) => res),
        catchError(this.handleError('REMOVE AUTOMATION FOLDER', null))
      );
  }
  removeFolders(body: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + AUTOMATION.REMOVE_FOLDERS, body)
      .pipe(
        map((res) => res),
        catchError(this.handleError('REMOVE AUTOMATION FOLDER', null))
      );
  }
  downloadFolder(body: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + AUTOMATION.DOWNLOAD_FOLDER, body)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('DOWNLOAD AUTOMATION FOLDER', null))
      );
  }

  /**
   * Get the executing automation count
   */
  getActivatedTimelinesCount(): Observable<any> {
    return this.httpClient.get(this.server + AUTOMATION.GET_COUNT).pipe(
      map((res) => res),
      catchError(this.handleError('GETTING ASSIGNED AUTOMATIONS COUNT', null))
    );
  }

  /**
   * Loading executing automations and contacts
   * @returns
   */
  loadActivatedTimelines(data: any): Observable<any> {
    return this.httpClient
      .post(this.server + AUTOMATION.LOAD_TIMELINES, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOADING ASSIGNED AUTOMATIONS', null))
      );
  }

  create$(automation): void {
    const automations = this.automations.getValue();
    automations.push(automation);
    this.automations.next([...automations]);
  }

  update$(id, data): void {
    const automations = this.automations.getValue();
    automations.some((e) => {
      if (e._id === id) {
        Object.assign(e, data);
        return true;
      }
    });
  }
}
