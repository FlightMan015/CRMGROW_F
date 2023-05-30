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
  selector: 'app-select-contact-list',
  templateUrl: './select-contact-list.component.html',
  styleUrls: ['./select-contact-list.component.scss']
})
export class SelectContactListComponent
  implements OnInit, OnDestroy, AfterViewInit {
  @Input('resultItem') resultItemTemplate: TemplateRef<HTMLElement>;
  @Input('placeholder') placeholder = 'Select contact';
  @Input('mustField') mustField = '';
  @Input('contacts') contacts: Contact[] = [];
  @Input()
  public set defaultContact(val: string) {
    if (val) {
      this.formControl.setValue(val, { emitEvent: true });
    } else {
      this.formControl.setValue(null, { emitEvent: true });
    }
  }
  @Output() onSelect = new EventEmitter();

  formControl: FormControl = new FormControl();
  inputControl: FormControl = new FormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('selector') selector: MatSelect;

  protected _onDestroy = new Subject<void>();
  filteredResults: ReplaySubject<Contact[]> = new ReplaySubject<Contact[]>(1);

  getCurrentSubscription: Subscription;

  constructor(private contactService: ContactService) {}

  ngOnInit(): void {
    this.filteredResults.next(this.contacts);
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

  cancelSelect(): void {
    this.formControl.setValue(null, { emitEvent: false });
    this.onSelect.emit(null);
  }

  clear(): void {
    this.formControl.setValue(null, { emitEvent: false });
    this.filteredResults.next([]);
  }
}
