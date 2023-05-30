import { CountryISO } from 'ngx-intl-tel-input';
import { PHONE_COUNTRIES } from 'src/app/constants/variable.constants';
import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Contact } from 'src/app/models/contact.model';
import { ContactService } from 'src/app/services/contact.service';
import { UserService } from 'src/app/services/user.service';
import { Deal } from '../../models/deal.model';
import { DealsService } from '../../services/deals.service';
import { PhoneInputComponent } from '../phone-input/phone-input.component';

@Component({
  selector: 'app-additional-edit',
  templateUrl: './additional-edit.component.html',
  styleUrls: ['./additional-edit.component.scss']
})
export class AdditionalEditComponent implements OnInit, OnDestroy {
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;
  contact: Contact = new Contact();
  deal: Deal = new Deal();
  isUpdating = false;
  updateSubscription: Subscription;
  garbageSubscription: Subscription;
  additional_fields: any[] = [];
  lead_fields: any[] = [];
  submitted = false;
  type = 'contact';
  @ViewChildren('phoneControl') phoneControls: QueryList<PhoneInputComponent>;
  constructor(
    private dialogRef: MatDialogRef<AdditionalEditComponent>,
    private contactService: ContactService,
    private userService: UserService,
    private dealService: DealsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.type === 'deal') {
      this.type = 'deal';
      this.deal = new Deal().deserialize(this.data.deal);
      if (this.deal.additional_field) {
        for (const key in this.deal.additional_field) {
          const item = {
            name: key,
            type: 'text',
            value: this.deal.additional_field[key],
            isExtra: true
          };
          this.additional_fields.push(item);
        }
      }
    } else {
      if (this.data && this.data.contact) {
        this.contact = new Contact().deserialize(this.data.contact);
        this.contact.tags = [...this.contact.tags];
        const additional_field = this.contact.additional_field || {};
        this.data.lead_fields.forEach((field) => {
          this.additional_fields.push({
            ...field,
            value: additional_field[field.name],
            isExtra: false
          });
          this.lead_fields.push(field.name);
        });

        if (!this.contact.additional_field) {
          this.contact.additional_field = {};
        } else {
          // check extra additional fields which not defined on settings
          // this could be occur when change field's name on settings
          for (const key in this.contact.additional_field) {
            if (this.lead_fields.indexOf(key) === -1) {
              this.additional_fields.push({
                name: key,
                type: 'text',
                value: this.contact.additional_field[key],
                isExtra: true
              });
            }
          }
        }
      }
    }
  }

  ngOnInit(): void {
    // this.garbageSubscription = this.userService.garbage$.subscribe(
    //   (_garbage) => {
    //     this.additional_fields = _garbage.additional_fields;
    //   }
    // );
  }

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
  }

  addField(): void {
    this.additional_fields.push({
      name: '',
      type: 'text',
      value: '',
      isExtra: true
    });
  }

  removeField(index): void {
    this.additional_fields.splice(index, 1);
  }

  update(): void {
    if (this.type === 'contact') {
      // validation Checking
      let valid = true;
      const contactId = this.contact._id;
      this.contact.additional_field = {};
      if (this.additional_fields.length > 0) {
        let phoneIndex = 0;
        for (const field of this.additional_fields) {
          if (field.type !== 'phone') {
            this.contact.additional_field[field.name] = field.value;
          } else {
            if (
              field.value &&
              this.phoneControls &&
              this.phoneControls['_results'] &&
              this.phoneControls['_results'][phoneIndex] &&
              this.phoneControls['_results'][phoneIndex].valid
            ) {
              this.contact.additional_field[field.name] =
                field.value['internationalNumber'];
            } else if (field.value) {
              valid = false;
            }
            phoneIndex++;
          }
        }
      }
      if (!valid) {
        return;
      }
      this.isUpdating = true;
      this.updateSubscription && this.updateSubscription.unsubscribe();
      this.updateSubscription = this.contactService
        .updateContact(contactId, {
          source: this.contact.source,
          brokerage: this.contact.brokerage,
          tags: this.contact.tags,
          additional_field: this.contact.additional_field
        })
        .subscribe((res) => {
          this.isUpdating = false;
          if (res) {
            this.dialogRef.close({
              success: res,
              additional_field: this.contact.additional_field
            });
          }
        });
    } else if (this.type === 'deal') {
      if (this.additional_fields.length > 0) {
        this.deal.additional_field = {};
        for (const field of this.additional_fields) {
          this.deal.additional_field[field.name] = field.value;
        }
      }
      this.isUpdating = true;
      this.updateSubscription && this.updateSubscription.unsubscribe();
      this.updateSubscription = this.dealService
        .editDeal(this.deal._id, this.deal)
        .subscribe((res) => {
          this.isUpdating = false;
          if (res) {
            this.dialogRef.close(this.additional_fields);
          }
        });
    }
  }

  /**
   * Phone Number Validation Checking function
   * @param wrapper: Form Group Wrapper Dom Object
   * @param form: Form Control Object
   * @param event: Changed Value
   */
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
