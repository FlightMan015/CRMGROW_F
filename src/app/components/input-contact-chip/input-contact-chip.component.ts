import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  TemplateRef,
  OnChanges
} from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  MatAutocompleteSelectedEvent,
  MatAutocomplete,
  MatAutocompleteTrigger,
  MatAutocompleteActivatedEvent
} from '@angular/material/autocomplete';
import { FormControl } from '@angular/forms';
import {
  filter,
  tap,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  map
} from 'rxjs/operators';
import {Subject, ReplaySubject, Observable, Subscription, BehaviorSubject} from 'rxjs';
import { ContactService } from 'src/app/services/contact.service';
import * as _ from 'lodash';
import { validateEmail } from 'src/app/utils/functions';
import { Contact } from 'src/app/models/contact.model';
import { MatChipInputEvent } from '@angular/material/chips';
import { environment } from '../../../environments/environment';
const phone = require('phone');

@Component({
  selector: 'app-input-contact-chip',
  templateUrl: './input-contact-chip.component.html',
  styleUrls: ['./input-contact-chip.component.scss']
})
export class InputContactChipComponent implements OnInit, OnChanges {
  separatorKeyCodes: number[] = [ENTER, COMMA];
  keyword = '';
  searching = false;
  addOnBlur = false;
  optionsFocused = false;
  @Input('resultItem') resultItemTemplate: TemplateRef<HTMLElement>;
  @Input('placeholder') placeholder = 'Add Contacts';
  @Input('display') display = 'email'; // Which field is enabled when display the item.
  @Input('material') material: any = null;
  @Input('onlySubscriber') onlySubscriber = true;
  @Input('onlyFromSearch') onlyFromSearch = false;
  @Input('selectedContacts') selectedContacts: Contact[] = [];
  @Input('chipType') chipType = 'block';
  @Input('focus') isFocus = false;
  @Input('isDealContact') isDealContact = false;
  @Input('keepContacts') keepContacts: Contact[] = [];
  @Input('maxLimit') maxLimit;
  @Output() onSelect = new EventEmitter();
  @Output() onRemove = new EventEmitter();
  @Output() onFocus = new EventEmitter();

  formControl: FormControl = new FormControl();
  @ViewChild(MatAutocompleteTrigger)
  autoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('auto') autoComplete: MatAutocomplete;

  protected _onDestroy = new Subject<void>();

  filteredResults: ReplaySubject<Contact[]> = new ReplaySubject<Contact[]>(1);
  filteredContacts: Contact[] = [];
  siteUrl = environment.front;

  loadingMore = false;
  loadMoreSubscription: Subscription;
  getCurrentSubscription: Subscription;
  hasMore = true;

  dealContacts;

  constructor(private contactService: ContactService) {}

  ngOnInit(): void {
    if (this.isDealContact) {
      this.dealContacts = [...this.selectedContacts];
    }
    this.formControl.valueChanges
      .pipe(
        filter((search) => {
          if (typeof search === 'string') {
            if (search) {
              return true;
            } else if (this.material && this.material['_id']) {
              return true;
            }
            return false;
          } else {
            return false;
          }
        }),
        takeUntil(this._onDestroy),
        debounceTime(50),
        distinctUntilChanged(),
        tap((search) => {
          this.searching = true;
          this.keyword = search;
        }),
        map((search) => {
          if (this.isDealContact) {
            const dealContacts: BehaviorSubject<
              Contact[]
            > = new BehaviorSubject<Contact[]>(this.dealContacts);
            return dealContacts.asObservable();
          } else {
            if (search) {
              return this.contactService.easySearch(search);
            } else {
              return this.contactService.latestContacts(this.material['_id']);
            }
          }
        })
      )
      .subscribe((request: Observable<any[]>) => {
        request.subscribe(
          (res: any) => {
            this.searching = false;
            if (res && res.length) {
              if (res.length == 8) {
                this.hasMore = true;
              } else {
                this.hasMore = false;
              }
            }
            if (this.keyword) {
              if (res.length) {
                this.filteredResults.next(res);
                this.filteredContacts = res;
              } else {
                if (!this.onlyFromSearch) {
                  if (this.display === 'email' && validateEmail(this.keyword)) {
                    const first_name = this.keyword.split('@')[0];
                    const email = this.keyword;
                    const newContact = new Contact().deserialize({
                      first_name,
                      email
                    });
                    this.filteredResults.next([newContact]);
                  }
                  if (this.display === 'cell_phone') {
                    const cell_phone = phone(this.keyword)[0];
                    if (cell_phone) {
                      const newContact = new Contact().deserialize({
                        first_name: cell_phone,
                        cell_phone
                      });
                      this.filteredResults.next([newContact]);
                    }
                  }
                }
              }
            } else {
              const searchedContacts = [];
              const searchedContactIds = [];
              res.forEach((activity) => {
                if (!activity || !activity.contacts) {
                  return;
                }
                const contact = activity.contacts[0];
                if (searchedContactIds.indexOf(contact._id) === -1) {
                  searchedContactIds.push(contact._id);
                  searchedContacts.push(contact);
                }
              });
              this.filteredResults.next(
                searchedContacts.map((data) => new Contact().deserialize(data))
              );
            }
          },
          (error) => {
            this.searching = false;
          }
        );
      });
  }

  ngOnChanges(changes): void {
    const _SELF = this;
    setTimeout(function () {
      if (changes.isFocus.currentValue && _SELF.inputField) {
        _SELF.inputField.nativeElement.focus();
      }
    }, 300);
  }

  getMaterialLatestContact(): void {
    this.contactService
      .latestContacts(this.material['_id'])
      .subscribe((res) => {
        const searchedContacts = [];
        const searchedContactIds = [];
        res.forEach((activity) => {
          const contact = activity.contacts[0];
          if (searchedContactIds.indexOf(contact._id) === -1) {
            searchedContactIds.push(contact._id);
            searchedContacts.push(contact);
          }
        });
        this.filteredResults.next(searchedContacts);
      });
  }

  remove(contact: Contact): void {
    const pos = _.findIndex(this.keepContacts, contact, '_id');
    if (pos !== -1) {
      return;
    }
    _.remove(this.selectedContacts, (e) => {
      if (contact._id) {
        return e._id === contact._id;
      } else if (this.display === 'email') {
        return e.email === contact.email;
      } else if (this.display === 'cell_phone') {
        return e.cell_phone === contact.cell_phone;
      }
    });
    this.onRemove.emit(contact);
  }

  onSelectOption(evt: MatAutocompleteSelectedEvent): void {
    const contact = evt.option.value;
    let index;
    if (this.onlySubscriber) {
      if (contact.tags && contact.tags.indexOf('unsubscribed') !== -1) {
        return;
      }
    }
    if (this.display === 'email' && !contact.email) {
      return;
    }
    if (this.display === 'cell_phone' && !contact.cell_phone) {
      return;
    }
    if (contact._id) {
      index = _.findIndex(this.selectedContacts, function (e) {
        return e._id == contact._id;
      });
    } else {
      index = _.findIndex(this.selectedContacts, (e) => {
        if (this.display === 'email') {
          return e.email == contact.email;
        } else if (this.display === 'cell_phone') {
          return e.cell_phone === contact.cell_phone;
        }
      });
    }
    if (index === -1) {
      // if (contact instanceof Contact) {
      //   this.selectedContacts.push(contact);
      //   this.onSelect.emit();
      // } else {
      //   this.selectedContacts.push(new Contact().deserialize(contact));
      //   this.onSelect.emit();
      // }

      if (this.maxLimit) {
        if (this.maxLimit > this.selectedContacts.length) {
          if (contact instanceof Contact) {
            this.selectedContacts.push(contact);
            this.onSelect.emit();
          } else {
            this.selectedContacts.push(new Contact().deserialize(contact));
            this.onSelect.emit();
          }
        }
      } else {
        if (contact instanceof Contact) {
          this.selectedContacts.push(contact);
          this.onSelect.emit();
        } else {
          this.selectedContacts.push(new Contact().deserialize(contact));
          this.onSelect.emit();
        }
      }
    }
    this.inputField.nativeElement.value = '';
    this.formControl.setValue(null);
    this.keyword = '';
    this.optionsFocused = false;
  }

  onActiveOption(event: MatAutocompleteActivatedEvent): void {
    if (event && event.option) {
      this.optionsFocused = true;
    } else {
      this.optionsFocused = false;
    }
  }

  onAdd(event: MatChipInputEvent): void {
    if (this.optionsFocused || !event.value) {
      return;
    }
    const newContact = new Contact();
    if (this.display === 'email') {
      if (!validateEmail(event.value)) {
        return;
      }
      newContact.deserialize({
        first_name: event.value.split('@')[0],
        email: event.value
      });
    }
    if (this.display === 'cell_phone') {
      const cell_phone = phone(event.value)[0];
      if (!cell_phone) {
        return;
      }
      newContact.deserialize({
        first_name: event.value,
        cell_phone: event.value
      });
    }
    let existContact;
    this.filteredContacts.some((e) => {
      if (e[this.display] === newContact[this.display]) {
        existContact = e;
        return true;
      }
    });
    let addToContact;
    if (existContact) {
      addToContact = existContact;
    } else {
      addToContact = newContact;
    }
    let index;
    if (addToContact._id) {
      index = _.findIndex(this.selectedContacts, function (e) {
        return e._id == addToContact._id;
      });
    } else {
      index = _.findIndex(this.selectedContacts, (e) => {
        if (this.display === 'email') {
          return e.email == addToContact.email;
        } else if (this.display === 'cell_phone') {
          return e.cell_phone === addToContact.cell_phone;
        }
      });
    }
    if (index === -1) {
      if (addToContact instanceof Contact) {
        this.selectedContacts.push(addToContact);
        this.onSelect.emit();
      } else {
        this.selectedContacts.push(new Contact().deserialize(addToContact));
        this.onSelect.emit();
      }
    }
    this.inputField.nativeElement.value = '';
    this.autoCompleteTrigger.closePanel();
    this.formControl.setValue(null);
    this.keyword = '';
    this.optionsFocused = false;
  }

  loadMore(): void {
    this.getCurrentSubscription = this.filteredResults.subscribe(
      (currentResults) => {
        this.loadingMore = true;
        this.loadMoreSubscription = this.contactService
          .easySearch(this.keyword, currentResults.length)
          .subscribe((contacts) => {
            this.loadingMore = false;
            if (contacts && contacts?.length) {
              if (contacts?.length == 8) {
                this.hasMore = true;
              } else {
                this.hasMore = false;
              }
              let result;
              if (this.display) {
                const data = [];
                contacts.map((e) => {
                  if (e[this.display]) {
                    data.push(e);
                  }
                });
                result = data;
              } else {
                result = contacts;
              }
              if (result.length) {
                result.forEach((e) => {
                  // currentResults.push(e);
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

  setFocus(): void {
    this.isFocus = true;
    this.onFocus.emit();
  }

  contactDetail(contact): void {}
}
