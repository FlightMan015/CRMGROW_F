import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent
} from '@angular/material/autocomplete';
import { COUNTRIES } from 'src/app/constants/variable.constants';
import * as _ from 'lodash';
import { ContactService } from 'src/app/services/contact.service';

@Component({
  selector: 'app-input-country',
  templateUrl: './input-country.component.html',
  styleUrls: ['./input-country.component.scss']
})
export class InputCountryComponent implements OnInit {
  @Input('selectedCountries') selectedCountries: string[] = [];
  @Output() onSelect = new EventEmitter();

  // COUNTRIES = COUNTRIES;
  COUNTRIES: any[];
  formControl: FormControl = new FormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('auto') autoComplete: MatAutocomplete;

  constructor(private contactService: ContactService) {
    this.COUNTRIES = this.contactService.COUNTRIES;
  }

  ngOnInit(): void {}

  remove(country: string): void {
    _.remove(this.selectedCountries, (e) => {
      return e === country;
    });
    this.onSelect.emit();
  }

  onSelectOption(evt: MatAutocompleteSelectedEvent): void {
    const country = evt.option.value;
    const index = _.findIndex(this.selectedCountries, function (e) {
      return e === country;
    });
    if (index === -1) {
      this.selectedCountries.push(country);
    }
    this.inputField.nativeElement.value = '';
    this.formControl.setValue(null);
    this.onSelect.emit();
  }
}
