import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user.model';
import { UserService } from 'src/app/services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { PurchaseMessageComponent } from '../../components/purchase-message/purchase-message.component';
import { AddPhoneComponent } from '../../components/add-phone/add-phone.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sms-limits',
  templateUrl: './sms-limits.component.html',
  styleUrls: ['./sms-limits.component.scss']
})
export class SmsLimitsComponent implements OnInit {
  isLoading = false;
  user: User = new User();
  leftSms = 0;
  profileSubscription: Subscription;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService
      .loadProfile()
      .subscribe((profile) => {
        if (profile) {
          this.user = profile;
          this.isLoading = false;
          if (this.user?.text_info.is_limit) {
            if (this.user.text_info?.additional_credit) {
              this.leftSms =
                this.user.text_info.max_count -
                (this.user.text_info.count || 0) +
                this.user.text_info.additional_credit.amount;
            } else {
              this.leftSms =
                this.user.text_info.max_count -
                (this.user.text_info.count || 0);
            }
          } else {
            this.leftSms = 0;
          }
        }
      });
  }

  purchase(): void {
    this.dialog
      .open(PurchaseMessageComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '650px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.userService.loadProfile().subscribe((profile) => {
            if (profile) {
              this.user = profile;
              if (this.user?.text_info.is_limit) {
                if (this.user.text_info?.additional_credit) {
                  this.leftSms =
                    this.user.text_info.max_count -
                    this.user.text_info.count +
                    this.user.text_info.additional_credit.amount;
                } else {
                  this.leftSms =
                    this.user.text_info.max_count - this.user.text_info.count;
                }
              } else {
                this.leftSms = 0;
              }
            }
          });
        }
      });
  }

  addPhone(): void {
    this.dialog
      .open(AddPhoneComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '650px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.user.twilio_number = res;
          if (!this.user.onboard.sms_service && this.user.user_version >= 2.1) {
            this.user.onboard.sms_service = true;
            this.userService
              .updateProfile({ onboard: this.user.onboard })
              .subscribe(() => {
                this.userService.updateProfileImpl({
                  proxy_number: this.user.proxy_number,
                  twilio_number: this.user.twilio_number,
                  onboard: this.user.onboard
                });
                this.router.navigate(['/materials/create/video']);
              });
          } else {
            this.userService.updateProfileImpl({
              proxy_number: this.user.proxy_number,
              twilio_number: this.user.twilio_number
            });
          }
        }
      });
  }

  changePhone(): void {
    this.dialog
      .open(AddPhoneComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '650px',
        disableClose: true,
        data: {
          type: 'edit'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.user.twilio_number = res;
          if (!this.user.onboard.sms_service) {
            this.user.onboard.sms_service = true;
            this.userService
              .updateProfile({ onboard: this.user.onboard })
              .subscribe(() => {
                this.userService.updateProfileImpl({
                  proxy_number: this.user.proxy_number,
                  twilio_number: this.user.twilio_number,
                  onboard: this.user.onboard
                });
              });
          } else {
            this.userService.updateProfileImpl({
              proxy_number: this.user.proxy_number,
              twilio_number: this.user.twilio_number
            });
          }
        }
      });
  }

  deletePhone(): void {}
}
