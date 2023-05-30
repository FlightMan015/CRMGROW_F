import { Component, Inject, OnInit } from '@angular/core';
import { SmsService } from '../../services/sms.service';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { NotifyComponent } from '../notify/notify.component';
import { ConfirmComponent } from '../confirm/confirm.component';

@Component({
  selector: 'app-add-phone',
  templateUrl: './add-phone.component.html',
  styleUrls: ['./add-phone.component.scss']
})
export class AddPhoneComponent implements OnInit {
  loading = false;
  saving = false;
  searchCode = '';
  phoneNumbers = [];
  selectedPhone = '';
  type = '';
  suggestPhones = [
    {
      phone: '(303) 431-3301',
      location: 'Denver, CO'
    },
    {
      phone: '(303) 431-3302',
      location: 'Denver, CO'
    },
    {
      phone: '(303) 431-3303',
      location: 'Denver, CO'
    },
    {
      phone: '(303) 431-3301',
      location: 'Denver, CO'
    },
    {
      phone: '(303) 431-3302',
      location: 'Denver, CO'
    },
    {
      phone: '(303) 431-3303',
      location: 'Denver, CO'
    },
    {
      phone: '(303) 431-3301',
      location: 'Denver, CO'
    },
    {
      phone: '(303) 431-3302',
      location: 'Denver, CO'
    },
    {
      phone: '(303) 431-3303',
      location: 'Denver, CO'
    }
  ];
  constructor(
    private smsService: SmsService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<AddPhoneComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.type = this.data.type;
    }
  }

  ngOnInit(): void {
    this.searchPhone();
  }

  selectPhone(phone: string): void {
    this.selectedPhone = phone;
  }

  isSelected(phone: string): any {
    return this.selectedPhone === phone;
  }

  searchPhone(): void {
    this.loading = true;
    let data;
    if (this.searchCode == '') {
      data = {};
    } else {
      data = {
        searchCode: parseInt(this.searchCode).toString()
      };
    }

    this.smsService.searchNumbers(data).subscribe((res) => {
      this.loading = false;
      this.phoneNumbers = res?.data;
    });
  }

  save(): void {
    if (this.selectedPhone == '') {
      return;
    } else {
      if (this.type == 'edit') {
        this.dialog
          .open(ConfirmComponent, {
            data: {
              title: 'Confirm Phone Number Change?',
              message:
                'By initiating a phone number change and clicking YES, you are agreeing to a one time charge of $9.99.',
              cancelLabel: 'No',
              confirmLabel: 'Yes'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              this.saving = true;
              const data = {
                number: this.selectedPhone
              };
              this.smsService.buyNumbers(data).subscribe((res) => {
                if (res?.status) {
                  this.saving = false;
                  this.dialogRef.close(this.selectedPhone);
                } else {
                  this.saving = false;
                }
              });
            }
          });
      } else {
        this.saving = true;
        const data = {
          number: this.selectedPhone
        };
        this.smsService.buyNumbers(data).subscribe((res) => {
          if (res?.status) {
            this.saving = false;
            this.dialogRef.close(this.selectedPhone);
          } else {
            this.saving = false;
          }
        });
      }
    }
  }
}
