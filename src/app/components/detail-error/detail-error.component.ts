import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ConnectService } from 'src/app/services/connect.service';

@Component({
  selector: 'app-detail-error',
  templateUrl: './detail-error.component.html',
  styleUrls: ['./detail-error.component.scss']
})
export class DetailErrorComponent implements OnInit {
  errorCode: string = ''; // 402: Connect Error, 403: Oauth Setting Error, 405: Contacts Detail Error, 406: Connect Error
  errorMessage: string = '';
  loading = false;
  saving = false;
  searchCode = '';
  phoneNumbers = [];
  selectedPhone = '';
  plans = [
    { type: 1, sms: '250', price: '6' },
    { type: 2, sms: '500', price: '10' },
    { type: 3, sms: '1000', price: '15' }
  ];
  currentType = this.plans[1];

  constructor(
    public dialogRef: MatDialogRef<DetailErrorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toast: ToastrService,
    private connectService: ConnectService,
    private router: Router
  ) {
    if (this.data && this.data.errorCode) {
      this.errorCode = this.data.errorCode;
      if (this.errorCode == '408') {
        this.searchPhone();
      }
    }
    if (this.data && this.data.errorMessage) {
      this.errorMessage = this.data.errorMessage;
    }
  }

  ngOnInit(): void {}

  connectMail(type: string): void {
    if (type === 'gmail' || type === 'outlook') {
      this.connectService.requestSyncUrl(type).subscribe(
        (res) => {
          location.href = res['data'];
        },
        () => {
          this.toast.error('', 'Request authorization url Error is happened.', {
            closeButton: true
          });
        }
      );
    }
  }

  connectCalendar(type: string): void {
    if (type === 'gmail' || type === 'outlook') {
      this.connectService.requestCalendarSyncUrl(type).subscribe(
        (res) => {
          if (res && res['status']) {
            location.href = res['data'];
          }
        },
        () => {
          this.toast.error('', 'Request authorization url Error is happened.', {
            closeButton: true
          });
        }
      );
    }
  }

  connectAnotherMail(): void {
    this.connectService.connectAnotherService().subscribe(
      () => {
        this.dialogRef.close();
        location.reload();
      },
      () => {
        this.toast.error('', 'Connecting error is happened.', {
          closeButton: true
        });
      }
    );
  }

  searchPhone(): void {
    this.loading = true;
    let data;
    if (this.searchCode == '') {
      data = {
        searchCode: ''
      };
    } else {
      data = {
        searchCode: parseInt(this.searchCode).toString()
      };
    }

    this.connectService.searchNumbers(data).subscribe((res) => {
      if (res['status']) {
        this.loading = false;
        this.phoneNumbers = res.data;
      }
    });
  }

  selectPhone(phone: string): void {
    this.selectedPhone = phone;
  }

  isSelected(phone: string): any {
    return this.selectedPhone === phone;
  }

  save(): void {
    if (this.selectedPhone == '') {
      return;
    } else {
      this.saving = true;
      const data = {
        number: this.selectedPhone
      };
      this.connectService.buyNumbers(data).subscribe(
        (res) => {
          if (res['status']) {
            this.saving = false;
            this.dialogRef.close();
          } else {
            this.saving = false;
          }
        },
        (err) => {
          this.saving = false;
          if (err.status == 400) {
            this.toast.error(err.error.error, 'BUY NUMBER', {
              closeButton: true
            });
          }
        }
      );
    }
  }

  selectPlan(plan: any): void {
    this.currentType = plan;
  }

  purchase(): void {
    this.saving = true;
    const data = {
      option: this.currentType.type
    };
    this.connectService.buyCredit(data).subscribe(
      (res) => {
        if (res && res['status']) {
          this.saving = false;
          this.dialogRef.close(true);
        }
      },
      (err) => {
        this.saving = false;
      }
    );
  }

  logout(): void {
    this.connectService.sendLogout();
    this.dialogRef.close();
  }

  goToIntegration(): void {
    this.router.navigate([`/settings/integration`]);
    this.dialogRef.close();
  }

  goToBilling(): void {
    this.router.navigate([`/profile/upgrade-plan`]);
    this.dialogRef.close();
  }

  showError(error: any): string {
    if (error) {
      if (typeof error === 'object') {
        if (error instanceof Array) {
          return error.join(', ');
        }
        return JSON.stringify(error);
      } else {
        return error;
      }
    } else {
      return 'Unknown Error';
    }
  }
}
