import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CountryISO } from 'ngx-intl-tel-input';
import {
  COUNTRIES,
  orderOriginal,
  PHONE_COUNTRIES,
  REGIONS,
  STAGES
} from 'src/app/constants/variable.constants';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ContactService } from 'src/app/services/contact.service';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';
import { validateEmail } from '../../helper';
import { adjustPhoneNumber } from 'src/app/helper';
import { Contact2I } from 'src/app/models/contact.model';
import { PhoneInputComponent } from '../phone-input/phone-input.component';
const phone = require('phone');
const PhoneNumber = require('awesome-phonenumber');

@Component({
  selector: 'app-import-contact-edit',
  templateUrl: './import-contact-edit.component.html',
  styleUrls: ['./import-contact-edit.component.scss']
})
export class ImportContactEditComponent implements OnInit, OnDestroy {
  // Setting Variable for the UI
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;
  COUNTRIES = COUNTRIES;
  COUNTRY_REGIONS = [];
  DefaultCountryStates = REGIONS;
  orderOriginal = orderOriginal;
  LOCATION_COUNTRIES = ['US', 'CA'];

  // Variables for the processs
  contact_phone: any = {};
  second_contact_phone: any = {};
  contact: Contact2I = new Contact2I();
  invalidEmail = false;
  invalidPhone = false;
  invalidSecondaryEmail = false;
  invalidSecondaryPhone = false;

  fields;

  @ViewChild('phoneControl') phoneControl: PhoneInputComponent;
  @ViewChild('secondPhoneControl') secondPhoneControl: PhoneInputComponent;
  @ViewChild('cityplacesRef') cityPlaceRef: GooglePlaceDirective;
  @ViewChild('addressplacesRef') addressPlacesRef: GooglePlaceDirective;

  constructor(
    private contactService: ContactService,
    private dialogRef: MatDialogRef<ImportContactEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.COUNTRIES = this.contactService.COUNTRIES;
    this.COUNTRY_REGIONS = this.contactService.COUNTRY_REGIONS;
    if (this.data && this.data.contact) {
      this.contact = new Contact2I().deserialize(this.data.contact);
      if (this.contact.cell_phone) {
        this.contact_phone = this.contact.cell_phone;
      }
      if (this.contact.secondary_phone) {
        this.second_contact_phone = this.contact.cell_phone;
      }
    }
    if (this.data && this.data.fields) {
      this.fields = this.data.fields;
    }
  }
  ngOnDestroy(): void {}

  edit(): void {
    if (!this.checkPhoneValid()) {
      return;
    }
    if (!this.checkSecondPhoneValid()) {
      return;
    }
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
    this.dialogRef.close({ contact: this.contact });
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
}
