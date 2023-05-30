import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PhoneInputComponent } from 'src/app/components/phone-input/phone-input.component';
import { PHONE_COUNTRIES } from 'src/app/constants/variable.constants';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {
  COUNTRIES = PHONE_COUNTRIES;
  phoneNumber: any = '+61212345678';
  @ViewChild('phoneControl') phoneControl: PhoneInputComponent;
  phoneForm: FormControl = new FormControl();

  constructor() {}

  ngOnInit(): void {}

  changePhoneNumber(event) {
    console.log('evnet', event);
  }
}
