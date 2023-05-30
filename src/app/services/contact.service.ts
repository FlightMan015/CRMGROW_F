import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { ErrorService } from './error.service';
import { HttpClient } from '@angular/common/http';
import { StoreService } from './store.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { CONTACT, TEAM } from '../constants/api.constant';
import {
  Contact,
  ContactActivity,
  ContactDetail
} from '../models/contact.model';
import { ActivityDetail } from '../models/activityDetail.model';
import { map, catchError } from 'rxjs/operators';
import { CONTACT_SORT_OPTIONS, STATUS } from '../constants/variable.constants';
import { SearchOption } from '../models/searchOption.model';
import * as _ from 'lodash';
import { Note } from '../models/note.model';
import { Timeline } from '../models/timeline.model';
import { Country, State, City } from 'country-state-city';
import { Garbage } from '../models/garbage.model';
interface LoadResponse {
  contacts: ContactActivity[];
}
@Injectable({
  providedIn: 'root'
})
export class ContactService extends HttpService {
  forceReload: BehaviorSubject<boolean> = new BehaviorSubject(false);
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loading$ = this.loadStatus.asObservable();
  customLoadingStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  customLoadingStatus$ = this.customLoadingStatus.asObservable();
  readDetailStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  readingDetail$ = this.readDetailStatus.asObservable();
  latestUpdateStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  latestUpdating$ = this.latestUpdateStatus.asObservable();
  total: BehaviorSubject<number> = new BehaviorSubject(0);
  total$ = this.total.asObservable();
  searchOption: BehaviorSubject<SearchOption> = new BehaviorSubject(
    new SearchOption()
  );
  searchOption$ = this.searchOption.asObservable();
  // searchStr: BehaviorSubject<string> = new BehaviorSubject('');
  // searchStr$ = this.searchStr.asObservable();
  pageIndex: BehaviorSubject<number> = new BehaviorSubject(1);
  pageIndex$ = this.pageIndex.asObservable();
  pageSize: BehaviorSubject<number> = new BehaviorSubject(50);
  pageSize$ = this.pageSize.asObservable();
  sort: BehaviorSubject<any> = new BehaviorSubject(
    CONTACT_SORT_OPTIONS['alpha_down']
  );
  garbage: BehaviorSubject<any> = new BehaviorSubject({});
  garbage$ = this.garbage.asObservable();
  sort$ = this.sort.asObservable();
  contactConversation: BehaviorSubject<any> = new BehaviorSubject(null);
  contactConversation$ = this.contactConversation.asObservable();
  loadSubscription: Subscription;
  COUNTRIES: { code: string; name: string }[] = [];
  COUNTRY_REGIONS: any[] = [];
  STATES: any[] = [];
  LOCATION_COUNTRIES = [];
  getCountryStatus = false;
  fieldsLoadSubscription: Subscription;

  constructor(
    errorService: ErrorService,
    private httpClient: HttpClient,
    private storeService: StoreService
  ) {
    super(errorService);
    this.searchOption$.subscribe(() => {
      this.loadPage();
    });

    this.sort$.subscribe(() => {
      const searchOption = this.searchOption.getValue();
      if (searchOption.isEmpty()) {
        const sortData = this.sort.getValue();
        if (sortData.page) {
          const pageSize = this.pageSize.getValue();
          this.load(pageSize * (sortData.page - 1));
        } else {
          this.load(0);
        }
      } else {
        const sortData = this.sort.getValue();
        this.advancedSearch(sortData.page || 1);
      }
    });
  }

  getCountriesAndStates(): void {
    if (this.getCountryStatus) return;
    const countryArray = Country.getAllCountries();
    for (let i = 0; i < countryArray.length; i++) {
      if (countryArray[i].isoCode == 'US') {
        this.COUNTRIES.unshift({
          name: countryArray[i].name,
          code: countryArray[i].isoCode
        });
      } else if (countryArray[i].isoCode == 'CA') {
        this.COUNTRIES.unshift({
          name: countryArray[i].name,
          code: countryArray[i].isoCode
        });
      } else {
        this.COUNTRIES.push({
          name: countryArray[i].name,
          code: countryArray[i].isoCode
        });
      }

      const stateArray = State.getStatesOfCountry(countryArray[i].isoCode);
      const stateNames = stateArray.map((t) => t.name);
      this.COUNTRY_REGIONS[countryArray[i].isoCode] = stateNames;
      this.LOCATION_COUNTRIES.push(countryArray[i].isoCode);
    }
    this.getCountryStatus = true;

    // this.httpClient
    //   .get('assets/states.csv', { responseType: 'text' })
    //   .subscribe(
    //     (data) => {
    //       const csvToRowArray = data.split('\n');
    //       for (let index = 1; index < csvToRowArray.length - 1; index++) {
    //         const row = csvToRowArray[index].split(',');
    //         this.STATES.push({
    //           name: row[1].replace('"', '').replace('"', ''),
    //           country_code: row[3]
    //         });
    //       }
    //       this.httpClient
    //         .get('assets/countries.csv', { responseType: 'text' })
    //         .subscribe(
    //           (data) => {
    //             const csvToRowArray = data.split('\n');
    //             for (let index = 1; index < csvToRowArray.length - 1; index++) {
    //               const row = csvToRowArray[index].split(',');
    //               const code = row[1].replace('\r', '');
    //               this.COUNTRIES.push({
    //                 name: row[0],
    //                 code: code
    //               });
    //               this.LOCATION_COUNTRIES.push(code);
    //               const stateArray = this.STATES.filter(
    //                 (e) => e.country_code == code
    //               );
    //               this.COUNTRY_REGIONS[code] = stateArray;
    //             }
    //             this.getCountryStatus = true;
    //           },
    //           (error) => {
    //             console.log(error);
    //           }
    //         );
    //     },
    //     (error) => {
    //       console.log(error);
    //     }
    //   );
  }

  /**
   * Read the Detail information of the contact and Emit the Behavior Subject
   * @param _id: Contact Id to read the detail information
   * @param sortInfo: Page sort information for the next and prev contact
   */
  read(_id: string, sortInfo = {}): void {
    this.readDetailStatus.next(STATUS.REQUEST);
    this.readImpl(_id, sortInfo).subscribe((res) => {
      this.readDetailStatus.next(STATUS.SUCCESS);
      if (res) {
        this.storeService.selectedContact.next(res);
      }
    });
    // split for read activity according to the performance problem
    this.readActivities(_id);
  }
  readActivities(_id: string) {
    this.latestUpdateStatus.next(STATUS.REQUEST);
    this.readActivitiesImpl(_id).subscribe((res) => {
      this.latestUpdateStatus.next(STATUS.SUCCESS);
      if (res) {
        const contact = new ContactDetail().deserialize(
          this.storeService.selectedContact.getValue()
        );
        contact.activity = res.activity;
        if (res.details) {
          contact.details = res.details;
        }
        this.storeService.selectedContact.next(contact);
      }
    });
  }
  /**
   * Read the Detail information of the contact
   * @param _id: Contact Id to read the detail information
   * @param sortInfo: Page sort information for the next and prev contact
   */
  readImpl(_id: string, sortInfo = {}): Observable<ContactDetail> {
    return this.httpClient
      .post(this.server + CONTACT.READ + _id, sortInfo)
      .pipe(
        map((res) => new ContactDetail().deserialize(res['data'])),
        catchError(this.handleError('CONTACT DETAIL', null))
      );
  }
  /**
   * Read the Activities information of the contact
   * This method is splited from readImpl according to the performance problem
   * @param _id: Contact Id to read the detail information
   * @param sortInfo: Page sort information for the next and prev contact
   */
  readActivitiesImpl(_id: string, sortInfo = {}): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.READ_ACTIVITIES + _id, sortInfo)
      .pipe(
        map(
          (res) =>
            res['data'] || {
              activity: [].map((e) => new ContactActivity().deserialize(e))
            }
        ),
        catchError(this.handleError('CONTACT ACTIVITIES', []))
      );
  }
  reloadDetail(): void {
    const contact = this.storeService.selectedContact.getValue();
    if (contact && contact._id) {
      this.readDetailStatus.next(STATUS.REQUEST);
      this.readImpl(contact._id, {}).subscribe((res) => {
        this.readDetailStatus.next(STATUS.SUCCESS);
        if (res) {
          this.storeService.selectedContact.next(res);
        }
      });
    }
  }
  addLatestActivity(count: number): void {
    const contact = this.storeService.selectedContact.getValue();
    if (contact && contact._id) {
      this.latestUpdateStatus.next(STATUS.REQUEST);
      this.readActivitiesImpl(contact._id, { count }).subscribe((res) => {
        this.latestUpdateStatus.next(STATUS.SUCCESS);
        if (res) {
          const currentContact = this.storeService.selectedContact.getValue();
          if (contact._id === currentContact._id) {
            const newActivities = res.activity.reverse();
            currentContact.activity = _.unionBy(
              newActivities,
              currentContact.activity,
              '_id'
            );
            currentContact.activity.sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );
            // const index = count % currentContact.activity.length;
            // const first_x_elements = currentContact.activity.slice(0, index);
            // const remaining_elements = currentContact.activity.slice(
            //   index,
            //   currentContact.activity.length
            // );
            // currentContact.activity = [
            //   ...remaining_elements,
            //   ...first_x_elements
            // ];
            for (const key in currentContact.details) {
              currentContact.details[key] = _.unionBy(
                res.details[key],
                currentContact.details[key],
                '_id'
              );
            }
            this.storeService.selectedContact.next(currentContact);
          }
        }
      });
    }
  }
  loadLatestActivity(id: string, count: number): Observable<ContactDetail> {
    return this.httpClient
      .post(this.server + CONTACT.READ_ACTIVITIES + id, { count })
      .pipe(
        map((res) => new ContactDetail().deserialize(res['data'])),
        catchError(this.handleError('CONTACT DETAIL', null))
      );
  }
  deleteContactActivity(ids: string[]): void {
    const currentContact = this.storeService.selectedContact.getValue();
    _.remove(currentContact.activity, (e) => {
      if (ids.indexOf(e._id) !== -1) {
        return true;
      }
      return false;
    });
    this.storeService.selectedContact.next(currentContact);
  }
  deleteContactActivityByDetail(detail: string, type): void {
    const currentContact = this.storeService.selectedContact.getValue();
    _.remove(currentContact.activity, (e) => {
      if (e[type] && (e[type] === detail || e[type][0] === detail)) {
        return true;
      }
      return false;
    });
    this.storeService.selectedContact.next(currentContact);
  }

  /**
   * Create Contact
   * @param contact
   */
  create(contact: Contact): Observable<Contact> {
    return this.httpClient.post(this.server + CONTACT.CREATE, contact).pipe(
      map((res) => res),
      catchError(this.handleError('CONTACT CREATE', null))
    );
  }

  /**
   * Update Contact
   * @param contact
   */
  update(contact): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.UPDATE, { ...contact })
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE CONTACT', []))
      );
  }

  /**
   * Update contact
   * @param id : id of contact to update
   * @param contact : data to update
   */
  updateContact(id: string, contact: any): Observable<any> {
    return this.httpClient
      .put(this.server + CONTACT.UPDATE_DETAIL + id, contact)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('UPDATE CONTACT', null))
      );
  }

  /**
   * Delete bulk contacts
   * @param _ids : ids array of contacts to remove
   */
  bulkDelete(_ids: string[]): Observable<boolean> {
    return this.httpClient
      .post(this.server + CONTACT.BULK_DELETE, { ids: _ids })
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('DELETE CONTACTS', false))
      );
  }

  /**
   *
   * @param _ids : contact id array
   * @param contact : information to update
   * @param tagData : tag information to update (remove, add)
   */
  bulkUpdate(_ids: string[], contact: any, tagData: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + CONTACT.BULK_UPDATE, {
        contacts: _ids,
        data: contact,
        tags: tagData
      })
      .pipe(
        map((res) => res['status'] || false),
        catchError(this.handleError('BULK UPDATE', false))
      );
  }

  /**
   * download the csv of selected contacts
   * @param _ids : contact id array
   */
  downloadCSV(_ids: string[]): Observable<any[]> {
    return this.httpClient
      .post(this.server + CONTACT.EXPORT, {
        contacts: _ids
      })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('DOWNLOAD CSV', []))
      );
  }

  loadPage(): void {
    const searchOption = this.searchOption.getValue();
    if (searchOption.isEmpty()) {
      this.load(0);
    } else {
      this.advancedSearch();
    }
  }
  reloadPage(): void {
    const searchOption = this.searchOption.getValue();
    // const searchStr = this.searchStr.getValue();
    if (searchOption.isEmpty()) {
      const page = this.pageIndex.getValue();
      const pageSize = this.pageSize.getValue();
      let skip = (page - 1) * pageSize;
      skip = skip < 0 ? 0 : skip;
      this.load(skip);
    } else {
      this.advancedSearch();
    }
  }
  /**
   * Load Contacts and update the store
   * @param page : Contact Page Number
   */
  load(page: number): void {
    this.loadStatus.next(STATUS.REQUEST);
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.loadImpl(page).subscribe((res) => {
      res
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      if (res && res['contacts']) {
        this.storeService.pageContacts.next(res['contacts']);
        this.total.next(res['total']);
      }
    });
  }
  /**
   * Call API & Load Contacts
   * @param page
   */
  loadImpl(page: number): Observable<any> {
    const count = this.pageSize.getValue();
    const sort = this.sort.getValue();
    this.loadStatus.next(STATUS.REQUEST);
    return this.httpClient
      .post(this.server + CONTACT.LOAD_PAGE + page, {
        count,
        ...sort,
        name: undefined
      })
      .pipe(
        map((res) => {
          const contacts = [];
          (res['data']['contacts'] || []).forEach((e) => {
            contacts.push(new ContactActivity().deserialize(e));
          });
          return {
            contacts,
            total: res['data']['count'] || 0
          };
        }),
        catchError(
          this.handleError('LOAD CONTACTS', { contacts: [], total: 0 })
        )
      );
  }

  loadImpl2(page: number, count: number, sort: any): Observable<any> {
    const skip = (page - 1) * count;
    this.loadStatus.next(STATUS.REQUEST);
    return this.httpClient
      .post(this.server + CONTACT.LOAD_PAGE + skip, {
        count,
        ...sort,
        name: undefined
      })
      .pipe(
        map((res) => {
          const contacts = [];
          (res['data']['contacts'] || []).forEach((e) => {
            contacts.push(new ContactActivity().deserialize(e));
          });
          return {
            contacts,
            total: res['data']['count'] || 0
          };
        }),
        catchError(
          this.handleError('LOAD CONTACTS', { contacts: [], total: 0 })
        )
      );
  }
  /**
   * Advanced Search Call
   * @param str : keyword in the advanced search
   */
  advancedSearch(page: number = 1): void {
    this.loadStatus.next(STATUS.REQUEST);
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.advancedSearchImpl(page).subscribe((res) => {
      res
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      if (res && res['contacts']) {
        const uniqContacts = _.uniqBy(res['contacts'], (e) => e._id);
        this.storeService.pageContacts.next(uniqContacts || []);
        this.total.next(res['total']);
        // this.total.next((uniqContacts || []).length);
      }
      // this.sortContacts();
    });
  }
  advancedSearchImpl(page: number = 1): Observable<ContactActivity[]> {
    const count = this.pageSize.getValue();
    const sort = this.sort.getValue();
    let skip = count * (page - 1);
    if (skip < 0) {
      skip = 0;
    }
    const searchOption = this.searchOption.getValue();
    return this.httpClient
      .post(this.server + CONTACT.ADVANCE_SERACH, {
        ...searchOption,
        ...sort,
        count,
        skip
      })
      .pipe(
        map((res) => {
          const contacts = [];
          (res['data'] || []).forEach((e) => {
            contacts.push(new ContactActivity().deserialize(e));
          });
          return {
            contacts,
            total: res['total'] || 0
          };
        }),
        catchError(this.handleError('ADVANCED FILTER', null))
      );
  }
  advancedSearchImpl2(
    searchOption: any,
    page: number = 1,
    count: number,
    sort: any
  ): Observable<ContactActivity[]> {
    const skip = (page - 1) * count;
    return this.httpClient
      .post(this.server + CONTACT.ADVANCE_SERACH, {
        ...searchOption,
        ...sort,
        count,
        skip
      })
      .pipe(
        map((res) => {
          const contacts = [];
          (res['data'] || []).forEach((e) => {
            contacts.push(new ContactActivity().deserialize(e));
          });
          return {
            contacts,
            total: res['total'] || 0
          };
        }),
        catchError(this.handleError('ADVANCED FILTER', null))
      );
  }
  customAllFields(): void {
    this.customLoadingStatus.next(STATUS.REQUEST);
    this.fieldsLoadSubscription && this.fieldsLoadSubscription.unsubscribe();
    this.fieldsLoadSubscription = this.customFieldCount().subscribe((res) => {
      res
        ? this.customLoadingStatus.next(STATUS.SUCCESS)
        : this.customLoadingStatus.next(STATUS.FAILURE);
      this.garbage.next(res);
    });
  }
  customFieldCount(): Observable<any> {
    return this.httpClient.post(this.server + CONTACT.FIELD_COUNT, {}).pipe(
      map((res) => {
        const garbage = new Garbage().deserialize(res['data']);
        for (let i = 0; i < garbage.additional_fields.length; i++) {
          Object.assign(garbage.additional_fields[i], {
            count: res['total'][i]
          });
        }
        return garbage;
      }),
      catchError(this.handleError('SELECT ALL CONTACTS', []))
    );
  }
  customFieldSearch(
    page: number = 1,
    field: string = '',
    str: string = ''
  ): void {
    this.loadStatus.next(STATUS.REQUEST);
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.customFieldSearchImpl(
      page,
      field,
      str
    ).subscribe((res) => {
      res
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      if (res && res['contacts']) {
        const uniqContacts = _.uniqBy(res['contacts'], (e) => e._id);
        this.storeService.pageContacts.next(uniqContacts || []);
        this.total.next(res['total']);
      }
    });
  }
  customFieldSearchImpl(
    page: number = 1,
    field: string = '',
    str: string = ''
  ): Observable<ContactActivity[]> {
    const count = this.pageSize.getValue();
    const sort = this.sort.getValue();
    let skip = count * (page - 1);
    if (skip < 0) {
      skip = 0;
    }
    const reqParam = {
      page: page,
      fieldName: field,
      str: str
    };
    return this.httpClient
      .post(this.server + CONTACT.SEARCH_BY_CUSTOM, {
        ...reqParam,
        ...sort,
        count,
        skip
      })
      .pipe(
        map((res) => {
          const contacts = [];
          (res['data'] || []).forEach((e) => {
            contacts.push(new ContactActivity().deserialize(e));
          });
          return {
            contacts,
            total: res['total'] || 0
          };
        }),
        catchError(this.handleError('CUSTOM FIELD FILTER', null))
      );
  }
  /**
   * Normal Search Call
   * @param str : keyword in the normal search
   */
  normalSearch(str: string): void {
    this.loadStatus.next(STATUS.REQUEST);
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.normalSearchImpl(str).subscribe((contacts) => {
      contacts
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.storeService.pageContacts.next(contacts || []);
      this.total.next((contacts || []).length);
      this.sortContacts();
    });
  }
  normalSearchImpl(str: string): Observable<ContactActivity[]> {
    return this.httpClient
      .post(this.server + CONTACT.NORMAL_SEARCH, {
        search: str
      })
      .pipe(
        map((res) =>
          (res['data']['contacts'] || []).map((e) =>
            new ContactActivity().deserialize(e)
          )
        ),
        catchError(this.handleError('FILTER', null))
      );
  }

  loadByEmails(emails: string[]): Observable<Contact[]> {
    return this.httpClient
      .post(this.server + CONTACT.LOAD_BY_EMAIL, { emails })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Contact().deserialize(e))
        ),
        catchError(this.handleError('LOAD BY EMAILS', []))
      );
  }

  filter(query): Observable<Contact[]> {
    return this.httpClient.post(this.server + CONTACT.FILTER, query).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('FILTER CONTACTS', []))
    );
  }
  getNormalSearch(str: string): any {
    return this.httpClient.post(this.server + CONTACT.NORMAL_SEARCH, {
      search: str
    });
  }
  getPageContacts(page, sort): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.LOAD_PAGE + page, sort)
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('LOAD CONTACTS', []))
      );
  }
  sortContacts(): void {
    const sortInfo = this.sort.getValue();
    const sortGrav = sortInfo.dir == true ? 1 : -1;
    const sortField = sortInfo.field;
    const contacts = this.storeService.pageContacts.getValue();
    if (sortField == 'name') {
      contacts.sort((a, b) => {
        const aName = (
          (a['first_name'] || '') +
          ' ' +
          (a['last_name'] || '')
        ).trim();
        const bName = (
          (b['first_name'] || '') +
          ' ' +
          (b['last_name'] || '')
        ).trim();
        if (aName > bName) {
          return 1 * sortGrav;
        } else if (aName == bName) {
          return 0;
        } else {
          return -1 * sortGrav;
        }
      });
    }
    if (sortField == 'updated_at') {
      contacts.sort((a, b) => {
        const aDate = new Date(a['last_activity']['updated_at'] + '').getTime();
        const bDate = new Date(b['last_activity']['updated_at'] + '').getTime();
        if (aDate > bDate) {
          return 1 * sortGrav;
        } else if (aDate == bDate) {
          return 0;
        } else {
          return -1 * sortGrav;
        }
      });
    }
  }
  /**
   * Search the contacts using keyword.
   * @param keyword : keyword
   */
  easySearch(keyword: string, skip: number = 0): Observable<Contact[]> {
    return this.httpClient
      .post(this.server + CONTACT.QUICK_SEARCH, { search: keyword, skip })
      .pipe(
        map((res) =>
          (res['data'] || []).map((data) => new Contact().deserialize(data))
        ),
        catchError(this.handleError('SEARCH CONTACTS', []))
      );
  }
  /**
   * Find the contacts that sent the selected material lately
   * @param _id :Material id
   */
  latestContacts(_id: string): Observable<ActivityDetail[]> {
    return this.httpClient
      .get(this.server + CONTACT.LATEST_CONTACTS + _id)
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('GET LATEST CONTACTS', []))
      );
  }
  /**
   * Select All Contacts
   */
  selectAll(): Observable<any> {
    return this.httpClient.get(this.server + CONTACT.SELECT_ALL).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Contact().deserialize(e))
      ),
      catchError(this.handleError('SELECT ALL CONTACTS', []))
    );
  }

  /**
   * Select Advanced Searched Contacts
   * @param searchOption: Current Search Option
   */
  advancedSelectAll(searchOption: SearchOption): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.ADVANCE_SELECT, { ...searchOption })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Contact().deserialize(e))
        ),
        catchError(this.handleError('SELECT FILTERED CONTACTS', []))
      );
  }
  /**
   * Load the contacts information by contact ids
   * @param ids : contact id array
   */
  getContactsByIds(ids: string[]): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.LOAD_BY_IDS, { ids })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Contact().deserialize(e))
        ),
        catchError(this.handleError('SEARCH CONTACTS', []))
      );
  }

  /**
   * merge two contacts
   * @param data : primary, secondaries, result contacts
   */
  mergeContacts(data): Observable<Contact> {
    return this.httpClient.post(this.server + CONTACT.MERGE, { ...data }).pipe(
      map((res) => res['data']),
      catchError(this.handleError('MERGE CONTACTS', null))
    );
  }

  /**
   * Create Bulk Contact
   * @param contacts : contacts data to create
   */
  bulkCreate(contacts): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.BULK_CREATE, { contacts })
      .pipe(
        map((res) => res),
        catchError(this.handleError('BULK CREATE CONTACTS', null))
      );
  }

  /**
   * Check Email duplication
   * @param email : email
   */
  checkEmail(email: string): any {
    return this.httpClient
      .post(this.server + CONTACT.CHECK_EMAIL, { email })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Contact().deserialize(e))
        ),
        catchError(this.handleError('CHECKING EMAIL DUPLICATION', []))
      );
  }

  /**
   * checking cell phone number
   * @param cell_phone : cell phone number
   */
  checkPhone(cell_phone: string): any {
    return this.httpClient
      .post(this.server + CONTACT.CHECK_PHONE, {
        cell_phone
      })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Contact().deserialize(e))
        ),
        catchError(this.handleError('CHECKING PHONE DUPLICATION', []))
      );
  }

  shareContacts(data): Observable<any> {
    // teamId, userId, contacts, type = 2
    return this.httpClient.post(this.server + CONTACT.SHARE_CONTACT, data).pipe(
      map((res) => res),
      catchError(this.handleError('SHARE CONTACTS TO TEAM', []))
    );
  }

  stopShareContacts(contacts, user, team): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.STOP_SHARE, {
        contacts,
        user,
        team
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('STOP SHARE CONTACTS', []))
      );
  }

  getSharedContact(_id: string): Observable<any> {
    return this.httpClient.get(this.server + CONTACT.TEAM_SHARED + _id).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET SHARED CONTACT', []))
    );
  }

  loadNotes(_id: string): Observable<Note[]> {
    return this.httpClient.get(this.server + CONTACT.LOAD_NOTES + _id).pipe(
      map((res) => res['data'] || [].map((e) => new Note().deserialize(e))),
      catchError(this.handleError('LOAD NOTES', []))
    );
  }

  loadTimeline(_id: string): Observable<Timeline[]> {
    return this.httpClient.get(this.server + CONTACT.LOAD_TIMELINE + _id).pipe(
      map((res) => res['data'] || [].map((e) => new Timeline().deserialize(e))),
      catchError(this.handleError('LOAD CONTACT TIMELINE', []))
    );
  }

  /**
   * Call api to load the tasks that be executed in the future (campaign, scheduled)
   * @param _id : contact id
   * @returns : Observable
   */
  loadTasks(_id: string): Observable<any[]> {
    return this.httpClient.get(this.server + CONTACT.LOAD_TASKS + _id).pipe(
      map((res) => res['data'] || [].map((e) => new Timeline().deserialize(e))),
      catchError(this.handleError('LOAD CONTACT TASKS', []))
    );
  }

  /**
   * remove the contact from the task
   * @param payload: { contact, task, type }
   * @returns : Observable
   */
  removeFromTask(payload: any): Observable<any> {
    return this.httpClient
      .post(this.server + CONTACT.REMOVE_FROM_TASK, payload)
      .pipe(
        map((res) => res),
        catchError(this.handleError('REMOVE CONTACT FROM TASK', []))
      );
  }

  delete$(contacts: Contact[]): any {
    const pageContacts = this.storeService.pageContacts.getValue();
    const remainedContacts = _.differenceBy(pageContacts, contacts, '_id');
    this.storeService.pageContacts.next(remainedContacts);

    const total = this.total.getValue();
    this.total.next(total - contacts.length);
    return {
      page: remainedContacts.length,
      total: total - contacts.length
    };
  }
  clear$(): void {
    this.loadStatus.next(STATUS.NONE);
    this.total.next(0);
    this.pageIndex.next(1);
    this.pageSize.next(50);
  }
}
