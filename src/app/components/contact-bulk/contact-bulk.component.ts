import { CountryISO } from 'ngx-intl-tel-input';
import { PHONE_COUNTRIES } from 'src/app/constants/variable.constants';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';
import { NgModel } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  orderOriginal,
  REGIONS,
  STAGES
} from 'src/app/constants/variable.constants';
import { Contact } from 'src/app/models/contact.model';
import { ContactService } from 'src/app/services/contact.service';
import { UserService } from 'src/app/services/user.service';
import { HandlerService } from 'src/app/services/handler.service';
import { StoreService } from 'src/app/services/store.service';
import { COUNTRIES } from 'src/app/constants/variable.constants';
import { ToastrService } from 'ngx-toastr';
import { PhoneInputComponent } from '../phone-input/phone-input.component';

@Component({
  selector: 'app-contact-bulk',
  templateUrl: './contact-bulk.component.html',
  styleUrls: ['./contact-bulk.component.scss']
})
export class ContactBulkComponent implements OnInit {
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;
  STAGES = STAGES;
  MODE = {
    KEEP: 1,
    PUSH: 2,
    PULL: 3,
    SET: 4
  };
  @Input('contacts') contacts: Contact[] = [];
  @Output() onClose = new EventEmitter();

  contact: Contact = new Contact().deserialize({
    recruiting_stage: '',
    tags: []
  });
  loading = false;
  tagMode = this.MODE.KEEP; // 1, 2, 3, 4

  updateSubscription: Subscription;
  isUpdating = false;

  // COUNTRIES = COUNTRIES;
  // COUNTRY_REGIONS = REGIONS;
  DefaultCountryStates = REGIONS;
  COUNTRIES = [];
  COUNTRY_REGIONS = [];
  orderOriginal = orderOriginal;
  garbageSubscription: Subscription;
  lead_fields: any[] = [];
  @ViewChildren('phoneControl') phoneControls: QueryList<PhoneInputComponent>;

  constructor(
    private contactService: ContactService,
    private handlerService: HandlerService,
    private userService: UserService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.COUNTRIES = this.contactService.COUNTRIES;
    this.COUNTRY_REGIONS = this.contactService.COUNTRY_REGIONS;
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        this.lead_fields = _garbage.additional_fields || [];
      }
    );
  }

  clearForm(): void {
    this.contact = new Contact().deserialize({
      recruiting_stage: '',
      tags: []
    });
    this.tagMode = this.MODE.KEEP;
  }

  update(): void {
    const data = {};
    const tagData = {};
    let valid = true;
    for (const key in this.contact) {
      if (key === 'tags') {
        continue;
      }
      if (this.contact[key]) {
        data[key] = this.contact[key];
      } else if (key == 'label' && typeof this.contact['label'] !== undefined) {
        data[key] = this.contact[key];
        if (!this.contact['label']) {
          data[key] = null;
        }
      }
    }
    if (
      this.tagMode !== this.MODE.KEEP &&
      this.contact.tags &&
      this.contact.tags.length
    ) {
      tagData['option'] = this.tagMode;
      tagData['tags'] = this.contact.tags;
    }
    const dataKeys = Object.keys(data);
    const tagKeys = Object.keys(tagData);
    if (!dataKeys.length && !tagKeys.length) {
      valid = false;
    }

    let phoneIndex = 0;
    for (const key in this.contact.additional_field) {
      let fieldType = '';
      for (const field of this.lead_fields) {
        if (key === field.name) {
          fieldType = field.type;
        }
      }
      if (
        fieldType === 'phone' &&
        this.phoneControls['_results'][phoneIndex].value
      ) {
        if (
          !this.contact.additional_field[key] ||
          !this.phoneControls ||
          !this.phoneControls['_results'] ||
          !this.phoneControls['_results'][phoneIndex] ||
          !this.phoneControls['_results'][phoneIndex].valid
        ) {
          valid = false;
        }
        phoneIndex++;
      }
    }

    if (!valid) {
      return;
    }

    const ids = [];
    this.contacts.forEach((e) => {
      ids.push(e._id);
    });

    this.isUpdating = true;
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.contactService
      .bulkUpdate(ids, data, tagData)
      .subscribe((status) => {
        this.isUpdating = false;
        if (status) {
          // this.toastr.success('Selected contact(s) successfully edited.');
          this.handlerService.bulkContactUpdate$(ids, data, tagData);
        }
      });
  }

  close(): void {
    this.contact = new Contact().deserialize({
      recruiting_stage: '',
      tags: []
    });
    this.onClose.emit();
  }
  changeLabel(event: string): void {
    this.contact.label = event;
  }
  clearLabel(): void {
    delete this.contact.label;
  }

  checkPhoneValidation(wrapper, form, event): void {
    const wrapperDom = wrapper && <HTMLDivElement>wrapper;
    if (form.valid || !event) {
      // Remove Error State
      wrapperDom &&
        wrapperDom.classList &&
        wrapperDom.classList.remove('invalid-phone');
    } else {
      // Insert the Error State
      wrapperDom &&
        wrapperDom.classList &&
        wrapperDom.classList.add('invalid-phone');
    }
  }
}
