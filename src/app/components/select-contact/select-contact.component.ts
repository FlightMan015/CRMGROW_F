import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  OnDestroy,
  Output,
  EventEmitter,
  AfterViewInit,
  TemplateRef
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ContactService } from 'src/app/services/contact.service';
import { Subject, ReplaySubject, Subscription } from 'rxjs';
import { Contact } from 'src/app/models/contact.model';
import { MatSelect } from '@angular/material/select';
import {
  filter,
  tap,
  takeUntil,
  debounceTime,
  map,
  distinctUntilChanged
} from 'rxjs/operators';
import { validateEmail } from 'src/app/utils/functions';
import * as _ from 'lodash';
const phone = require('phone');
@Component({
  selector: 'app-select-contact',
  templateUrl: './select-contact.component.html',
  styleUrls: ['./select-contact.component.scss']
})
export class SelectContactComponent
  implements OnInit, OnDestroy, AfterViewInit {
  @Input('resultItem') resultItemTemplate: TemplateRef<HTMLElement>;
  @Input('placeholder') placeholder = 'Search contact';
  @Input('formPlaceholder') formPlaceholder = 'Search contacts';
  @Input('mustField') mustField = '';
  @Input('fromSearch') fromSearch = true;
  @Input('excludeContacts') excludeContacts: Contact[] = [];
  @Input('contacts') contacts: Contact[] = [];
  @Input()
  public set contact(val: string) {
    if (!val) {
      this.formControl.setValue(null, { emitEvent: false });
    } else {
      this.contactService.getContactsByIds([val]).subscribe((res) => {
        if (res && res.length) {
          this.filteredResults.next(res);
          this.formControl.setValue(res[0], { emitEvent: false });
        }
      });
    }
  }
  @Output() onSelect = new EventEmitter();

  formControl: FormControl = new FormControl();
  inputControl: FormControl = new FormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('selector') selector: MatSelect;

  protected _onDestroy = new Subject<void>();
  searching = false;
  keyword = '';
  filteredResults: ReplaySubject<Contact[]> = new ReplaySubject<Contact[]>(1);

  loadingMore = false;
  loadMoreSubscription: Subscription;
  loadedCount = 0;
  searchSubscription: Subscription;
  getCurrentSubscription: Subscription;
  hasMore = true;

  constructor(private contactService: ContactService) {}

  ngOnInit(): void {
    this.inputControl.valueChanges
      .pipe(
        filter((search) => !!search),
        takeUntil(this._onDestroy),
        debounceTime(50),
        distinctUntilChanged(),
        tap((search) => {
          this.searching = true;
          this.keyword = search;
        }),
        map((search) => {
          return this.contactService.easySearch(search);
        })
      )
      .subscribe(
        (api) => {
          this.searchSubscription && this.searchSubscription.unsubscribe();
          this.searchSubscription = api.subscribe((res) => {
            this.searching = false;
            this.loadedCount = res.length;
            if (res && res.length) {
              if (res.length == 8) {
                this.hasMore = true;
              } else {
                this.hasMore = false;
              }
            } else {
              this.hasMore = false;
            }
            let result;
            if (this.mustField) {
              const data = [];
              res.map((e) => {
                if (e[this.mustField]) {
                  data.push(e);
                }
              });
              result = data;
            } else {
              result = res;
            }
            if (result.length) {
              if (this.excludeContacts && this.excludeContacts.length) {
                _.pullAllBy(result, this.excludeContacts, '_id');
              }
              this.filteredResults.next(result);
            } else {
              if (!this.fromSearch) {
                if (this.mustField === 'email') {
                  if (validateEmail(this.keyword)) {
                    const first_name = this.keyword.split('@')[0];
                    const email = this.keyword;
                    const newContact = new Contact().deserialize({
                      first_name,
                      email
                    });
                    this.filteredResults.next([newContact]);
                  } else {
                    this.filteredResults.next([]);
                  }
                } else if (this.mustField === 'cell_phone') {
                  const cell_phone = phone(this.keyword)[0];
                  if (cell_phone) {
                    const newContact = new Contact().deserialize({
                      first_name: cell_phone,
                      cell_phone
                    });
                    this.filteredResults.next([newContact]);
                  } else {
                    this.filteredResults.next([]);
                  }
                }
              } else {
                this.filteredResults.next([]);
              }
            }
            if (this.contacts && this.contacts.length > 0) {
              this.filteredResults.next(this.contacts);
            }
          });
        },
        () => {
          this.searching = false;
        }
      );
    this.formControl.valueChanges.subscribe((val) => {
      this.onSelect.emit(val);
    });
  }

  ngAfterViewInit(): void {
    this.selector._positions = [
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top'
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom'
      }
    ];
  }

  ngOnDestroy(): void {}

  loadMore(): void {
    this.getCurrentSubscription = this.filteredResults.subscribe(
      (currentResults) => {
        this.loadingMore = true;
        this.loadMoreSubscription = this.contactService
          .easySearch(this.keyword, this.loadedCount)
          .subscribe((contacts) => {
            this.loadingMore = false;
            this.loadedCount += contacts.length;
            if (contacts && contacts.length) {
              if (contacts.length == 8) {
                this.hasMore = true;
              } else {
                this.hasMore = false;
              }
              let result;
              if (this.mustField) {
                const data = [];
                contacts.map((e) => {
                  if (e[this.mustField]) {
                    data.push(e);
                  }
                });
                result = data;
              } else {
                result = contacts;
              }
              if (result.length) {
                result.forEach((e) => {
                  currentResults.push(e);
                });
              }
            } else {
              this.hasMore = false;
            }
          });
      }
    );
    this.getCurrentSubscription.unsubscribe();
  }

  cancelSelect(): void {
    this.formControl.setValue(null, { emitEvent: false });
    this.onSelect.emit(null);
  }

  clear(): void {
    this.formControl.setValue(null, { emitEvent: false });
    this.filteredResults.next([]);
  }
}
