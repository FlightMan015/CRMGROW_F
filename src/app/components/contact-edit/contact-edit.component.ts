import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { CountryISO } from 'ngx-intl-tel-input';
import {
  COUNTRIES,
  orderOriginal,
  PHONE_COUNTRIES,
  REGIONS,
  STAGES
} from 'src/app/constants/variable.constants';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Contact, ContactDetail } from 'src/app/models/contact.model';
import { ContactService } from 'src/app/services/contact.service';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';
import { Subscription } from 'rxjs';
import { adjustPhoneNumber } from 'src/app/helper';
import { FormControl } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { PhoneInputComponent } from '../phone-input/phone-input.component';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { DealsService } from 'src/app/services/deals.service';

@Component({
  selector: 'app-contact-edit',
  templateUrl: './contact-edit.component.html',
  styleUrls: ['./contact-edit.component.scss']
})
export class ContactEditComponent implements OnInit {
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;
  // COUNTRIES = COUNTRIES;
  // COUNTRY_REGIONS = REGIONS;
  DefaultCountryStates = REGIONS;
  COUNTRIES = [];
  COUNTRY_REGIONS = [];
  orderOriginal = orderOriginal;
  LOCATION_COUNTRIES = ['US', 'CA'];
  STAGES = STAGES;

  // Variables for the processs
  contact_phone: any = {};
  second_contact_phone: any = {};
  contact: ContactDetail = new ContactDetail();
  panelOpenState = false;
  stages = [];

  // Variables for the checking duplicate
  sameEmailContacts = [];
  sameCellPhoneContacts = [];
  contactEmailSubscription: Subscription;
  contactPhoneSubscription: Subscription;
  sameEmailsFlag = false;
  samePhonesFlag = false;

  isUpdating = false;
  updateSubscription: Subscription;
  isSharedContact = false;
  isNullFirstName = true;
  isNullLastName = true;
  isNullEmail = true;
  isNullPhone = true;

  phoneInput: FormControl = new FormControl();
  @ViewChild('phoneControl') phoneControl: PhoneInputComponent;
  @ViewChild('secondPhoneControl') secondPhoneControl: PhoneInputComponent;
  @ViewChild('cityplacesRef') cityPlaceRef: GooglePlaceDirective;
  @ViewChild('addressplacesRef') addressPlacesRef: GooglePlaceDirective;

  constructor(
    private dialogRef: MatDialogRef<ContactEditComponent>,
    private contactService: ContactService,
    private dealsService: DealsService,
    private router: Router,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.contact = this.data.contact;
      if (this.contact['cell_phone']) {
        this.contact_phone = this.contact['cell_phone'];
      }
      if (this.contact['secondary_phone']) {
        this.second_contact_phone = this.contact['secondary_phone'];
      }
      if (this.contact['state'] == '') {
        this.contact['state'] = 'None';
      }
      if (this.data.type == 'second') {
        this.panelOpenState = true;
      }
      // if (this.contact) {
      //   this.userService.profile$.subscribe((user) => {
      //     if (user) {
      //       const userId = user._id;
      //       if (
      //         this.contact['shared_contact'] &&
      //         this.contact['user'].indexOf(userId) < 0
      //       ) {
      //         this.isSharedContact = true;
      //         this.isNullFirstName = !!this.contact['first_name'];
      //         this.isNullLastName = !!this.contact['last_name'];
      //         this.isNullEmail = !!this.contact['email'];
      //         this.isNullPhone = !!this.contact_phone;
      //       }
      //     }
      //   });
      // }
    }
  }

  ngOnInit(): void {
    this.COUNTRIES = this.contactService.COUNTRIES;
    this.COUNTRY_REGIONS = this.contactService.COUNTRY_REGIONS;
    this.dealsService.stages$.subscribe((res) => {
      const index = res.findIndex((item) => item._id === null);
      const nullStage = [
        {
          _id: null,
          title: 'None'
        }
      ];
      if (index < 0) {
        this.stages = [...nullStage, ...res];
      } else {
        this.stages = res;
      }
    });
  }

  update(): void {
    if (this.contact.state == 'None') {
      this.contact.state = '';
    }
    if (
      this.sameEmailContacts.length > 0 ||
      this.sameCellPhoneContacts.length > 0
    ) {
      return;
    }

    if (!this.checkPhoneValid()) {
      return;
    }
    if (!this.checkSecondPhoneValid()) {
      return;
    }
    const contactId = this.contact._id;
    if (this.contact_phone && this.contact_phone['internationalNumber']) {
      this.contact.cell_phone = adjustPhoneNumber(
        this.contact_phone['internationalNumber']
      );
    } else {
      this.contact.cell_phone = '';
    }
    if (
      this.second_contact_phone &&
      this.second_contact_phone['internationalNumber']
    ) {
      this.contact.secondary_phone = adjustPhoneNumber(
        this.second_contact_phone['internationalNumber']
      );
    } else {
      this.contact.secondary_phone = '';
    }

    if (this.contact.email) {
      this.contact.email = this.contact.email.replace(/\s/g, '');
    }
    this.isUpdating = true;
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.contactService
      .updateContact(contactId, this.contact)
      .subscribe((res) => {
        this.isUpdating = false;
        if (res) {
          this.dialogRef.close(this.contact);
        }
      });
  }

  updateLabel(label: string): void {
    this.contact.label = label;
  }

  checkEmailDuplicate(evt: any): void {
    this.sameEmailContacts = [];
    if (!evt) {
      return;
    }
    const regularExpression = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,4}$/;
    const result = regularExpression.test(String(evt).toLowerCase());
    if (result) {
      this.contactEmailSubscription &&
        this.contactEmailSubscription.unsubscribe();
      this.contactEmailSubscription = this.contactService
        .checkEmail(evt)
        .subscribe((res) => {
          this.sameEmailContacts = res;
          this.sameEmailContacts.some((e, index) => {
            if (e._id === this.contact._id) {
              this.sameEmailContacts.splice(index, 1);
              return true;
            }
          });
          if (this.sameEmailContacts.length) {
            this.sameEmailsFlag = true;
          }
        });
    }
  }

  checkPhoneDuplicate(evt: any): any {
    this.sameCellPhoneContacts = [];
    if (!evt) {
      return;
    }
    let phone = evt;
    if (typeof evt == 'object' && evt['internationalNumber']) {
      phone = evt['internationalNumber'].replace(/\D/g, '');
      phone = '+' + phone;
    }
    if (this.phoneControl.valid) {
      this.contactPhoneSubscription &&
        this.contactPhoneSubscription.unsubscribe();
      this.contactPhoneSubscription = this.contactService
        .checkPhone(phone)
        .subscribe((res) => {
          this.sameCellPhoneContacts = res;
          this.sameCellPhoneContacts.some((e, index) => {
            if (e._id === this.contact._id) {
              this.sameCellPhoneContacts.splice(index, 1);
              return true;
            }
          });
          if (this.sameCellPhoneContacts.length) {
            this.samePhonesFlag = true;
          }
        });
    }
  }

  toggleSameEmails(): void {
    this.sameEmailsFlag = !this.sameEmailsFlag;
  }
  toggleSamePhones(): void {
    this.samePhonesFlag = !this.samePhonesFlag;
  }

  handleAddressChange(evt: any): void {
    this.contact.address = '';
    for (const component of evt.address_components) {
      if (!component['types']) {
        continue;
      }
      if (component['types'].indexOf('street_number') > -1) {
        this.contact.address = component['long_name'] + ' ';
      }
      if (component['types'].indexOf('route') > -1) {
        this.contact.address += component['long_name'];
      }
      if (component['types'].indexOf('administrative_area_level_1') > -1) {
        this.contact.state = component['long_name'];
      }
      if (
        component['types'].indexOf('sublocality_level_1') > -1 ||
        component['types'].indexOf('locality') > -1
      ) {
        this.contact.city = component['long_name'];
      }
      if (component['types'].indexOf('postal_code') > -1) {
        this.contact.zip = component['long_name'];
      }
      if (component['types'].indexOf('country') > -1) {
        this.contact.country = component['short_name'];
      }
    }
  }
  setContactStates(): void {
    this.addressPlacesRef.options.componentRestrictions.country = this.contact.country;
    this.cityPlaceRef.options.componentRestrictions.country = this.contact.country;
    this.cityPlaceRef.reset();
    this.addressPlacesRef.reset();
  }
  setContactCountry(): void {}

  checkPhoneValid(): boolean {
    if (!this.contact_phone || !this.phoneControl) {
      return true;
    }
    if (Object.keys(this.contact_phone).length && !this.phoneControl.valid) {
      return false;
    }
    return true;
  }

  checkSecondPhoneValid(): boolean {
    if (!this.second_contact_phone || this.secondPhoneControl) {
      return true;
    }
    if (
      Object.keys(this.second_contact_phone).length &&
      !this.secondPhoneControl.valid
    ) {
      return false;
    }
    return true;
  }

  redirectContact(contact): void {
    this.router.navigate(['/contacts/' + contact._id]);
    this.dialogRef.close();
  }
}
