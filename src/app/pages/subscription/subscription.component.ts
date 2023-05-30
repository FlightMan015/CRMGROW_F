import { Component, ElementRef, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import {
  CANCEL_ACCOUNT_REASON,
  PACKAGE_LEVEL
} from 'src/app/constants/variable.constants';
import { User } from 'src/app/models/user.model';
import { UserService } from 'src/app/services/user.service';
import { getUserLevel } from 'src/app/utils/functions';
import { ERROR_STRINGS } from 'src/app/constants/strings.constant';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { PaymentCardComponent } from 'src/app/components/payment-card/payment-card.component';
import { SubscriptionCancelReasonComponent } from 'src/app/components/subscription-cancel-reason/subscription-cancel-reason.component';
import { Cookie } from 'src/app/utils/cookie';
import { HandlerService } from 'src/app/services/handler.service';

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss']
})
export class SubscriptionComponent implements OnInit {
  user: User = new User();
  planDuration = 'monthly';
  currentPackage = PACKAGE_LEVEL.PRO;
  selectedPackage = PACKAGE_LEVEL.PRO;
  litePackage = PACKAGE_LEVEL.LITE;
  proPackage = PACKAGE_LEVEL.PRO;
  elitePackage = PACKAGE_LEVEL.ELITE;
  customPackage = PACKAGE_LEVEL.CUSTOM;
  evoProPackage = PACKAGE_LEVEL.EVO_PRO;
  evoElitePackage = PACKAGE_LEVEL.EVO_ELITE;
  reasonButtons = CANCEL_ACCOUNT_REASON;
  selectedReason = this.reasonButtons[0];
  reasonFeedback = '';

  profileSubscription: Subscription;
  downgradeSubscription: Subscription;
  updatePackageSubscription: Subscription;
  cancelAccountSubscription: Subscription;
  packageLevel = '';
  isSuspended = false;
  isV1User = false;
  loadingCheckDowngrade = false;
  loadingUpdatePackage = false;
  loadingCancelAccount = false;
  isOverflow = false;
  overflowMessage = [];
  error_messages;
  statistics = {
    contact: {
      count: 0
    },
    material: {
      count: 0,
      record_duration: 0
    }
  };
  card = {
    card_name: '',
    number: '',
    cvc: '',
    exp_year: '',
    exp_month: '',
    card_brand: '',
    last4: '',
    plan_id: '',
    card_id: '',
    token: ''
  };
  step = 1;

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private myElement: ElementRef,
    public handlerService: HandlerService
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile && profile._id) {
          this.user = profile;
          if (profile.payment) {
            this.packageLevel = profile.package_level;
            this.isSuspended = profile.subscription?.is_failed;
            this.isV1User = profile.user_version == 1;
            this.currentPackage =
              PACKAGE_LEVEL[getUserLevel(this.packageLevel)];
            this.selectedPackage =
              PACKAGE_LEVEL[getUserLevel(this.packageLevel)];
            if (this.user.is_primary) {
              this.userService.loadPayment(profile.payment);
              this.userService.payment$.subscribe((res) => {
                if (res) {
                  this.card = {
                    ...res,
                    number: res.last4
                  };
                }
              });
            }
          }
        }
      }
    );
    this.userService.getUserStatistics().subscribe((res) => {
      if (res['status']) {
        this.statistics = res['data'];
      }
    });
  }

  ngOnInit(): void {}

  getUserLevel(): string {
    return getUserLevel(this.packageLevel);
  }

  editCard(): void {
    this.dialog
      .open(PaymentCardComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '550px',
        data: {
          card: this.card
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.data) {
          const card = res.data.card;
          this.card = {
            ...this.card,
            card_brand: card.brand,
            card_id: card.id,
            exp_month: card.exp_month,
            exp_year: card.exp_year,
            last4: card.last4,
            token: res.data.id,
            number: card.last4
          };

          if (this.isSuspended) {
            location.reload();
          }
        }
      });
  }

  selectPlan(level): void {
    this.selectedPackage = level;
    if (this.currentPackage.package === this.selectedPackage.package) {
      return;
    }
    this.downgradeSubscription && this.downgradeSubscription.unsubscribe();
    this.loadingCheckDowngrade = true;
    this.downgradeSubscription = this.userService
      .checkDowngrade(this.selectedPackage.package)
      .subscribe((res) => {
        this.loadingCheckDowngrade = false;
        if (res && res.status === false) {
          if (res.type && res.type === 'other') {
            this.isOverflow = true;
            this.overflowMessage = res.data;
            res.data.forEach((error) => {
              if (this.selectedPackage.package.includes('PRO')) {
                this.error_messages = ERROR_STRINGS.PRO;
                this.error_messages[error.type] = this.error_messages[
                  error.type
                ].replace('{{PRO}}', error.limit);
              } else {
                this.error_messages = ERROR_STRINGS.LITE;
                this.error_messages[error.type] = this.error_messages[
                  error.type
                ].replace('{{LITE}}', error.limit);
              }
            });
          } else if (res.type && res.type === 'sms') {
            this.error_messages = ERROR_STRINGS.LITE;
            const confirmDialog = this.dialog.open(ConfirmComponent, {
              position: { top: '100px' },
              width: '100vw',
              maxWidth: '450px',
              disableClose: true,
              data: {
                title: 'Confirm Downgrade',
                message: this.error_messages[res.data[0].type],
                confirmLabel: 'Downgrade'
              }
            });
            confirmDialog.afterClosed().subscribe((result) => {
              if (result) {
                this.step = 2;
              }
            });
          }
        } else {
          this.isOverflow = false;
          this.overflowMessage = [];
          this.step = 2;
        }
      });
  }

  updatePackage(): void {
    let level = '';
    if (this.selectedPackage.package === 'lite') {
      level = 'BASIC';
    } else {
      level = this.selectedPackage.package.toUpperCase();
    }
    const data = {
      level
    };

    this.loadingUpdatePackage = true;
    this.updatePackageSubscription &&
      this.updatePackageSubscription.unsubscribe();
    this.updatePackageSubscription = this.userService
      .updatePackage(data)
      .subscribe((res) => {
        this.loadingUpdatePackage = false;
        if (res) {
          window.location.reload();
        }
      });
  }

  getPackageLabel(): string {
    if (this.currentPackage.package === 'LITE') {
      return 'Lite';
    } else if (this.currentPackage.package === 'PRO') {
      return 'Professional';
    } else if (this.currentPackage.package === 'ELITE') {
      return 'Elite';
    } else if (this.currentPackage.package === 'EVO_PRO') {
      return 'EVO Professional';
    } else if (this.currentPackage.package === 'EVO_ELITE') {
      return 'EVO Elite';
    }
    return 'Custom';
  }

  setDuration(): void {
    if (this.planDuration == 'monthly') {
      this.planDuration = 'annually';
    } else {
      this.planDuration = 'monthly';
    }
  }

  getTime(time: number): any {
    if (time) {
      return Math.ceil(time / 1000 / 60);
    } else {
      return 0;
    }
  }

  getExpireTime(): any {
    const createTime = new Date(this.user.created_at).getTime();
    const nowTime = Date.now();
    return Math.ceil(Math.abs(createTime - nowTime) / (1000 * 60 * 60 * 24));
  }

  getPackageType(): string {
    if (this.currentPackage && this.currentPackage.package) {
      if (this.currentPackage.package.indexOf('EVO') >= 0) {
        return 'EVO';
      }
    }
    return 'CRMGROW';
  }

  onBack(): void {
    this.step = 1;
  }

  cancelAccount(): void {
    this.step = 4;
    // const messageDialog = this.dialog.open(SubscriptionCancelReasonComponent, {
    //   width: '800px',
    //   maxWidth: '800px',
    //   data: {}
    // });
    // messageDialog['_overlayRef']['_host'].classList.add('top-dialog');
    // messageDialog.afterClosed().subscribe((res) => {
    //   if (res) {
    //   }
    // });
  }

  selectReason(reason): void {
    this.selectedReason = reason;
    this.step = 5;
  }

  sendFeedback(): void {
    const confirmDialog = this.dialog.open(ConfirmComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '450px',
      disableClose: true,
      data: {
        title: 'Confirm Cancel',
        message:
          'Cancelling your account pauses billing for 60 days. After 60 days all data will be deleted.',
        confirmLabel: 'Yes',
        cancelLabel: 'No'
      }
    });
    confirmDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.loadingCancelAccount = true;
        const data = {
          close_reason: this.selectedReason,
          close_feedback: this.reasonFeedback
        };
        this.cancelAccountSubscription &&
          this.cancelAccountSubscription.unsubscribe();
        this.cancelAccountSubscription = this.userService
          .cancelAccount(data)
          .subscribe(
            (res) => {
              this.loadingCancelAccount = false;
              if (res) {
                Cookie.setLogout();
                localStorage.removeItem('token');
                location.href = 'https://crmgrow.com/pricing.html';
                this.userService.logoutImpl();
                this.handlerService.clearData();
              }
            },
            (err) => {
              this.loadingCancelAccount = false;
            }
          );
      }
    });
  }

  getButtonLabel(): any {
    if (
      this.currentPackage.package == 'EVO_PRO' ||
      this.currentPackage.package == 'LITE'
    ) {
      return 'Upgrade plan';
    }
    if (
      this.currentPackage.package == 'EVO_ELITE' ||
      this.currentPackage.package == 'ELITE'
    ) {
      return 'Downgrade plan';
    }
    if (this.currentPackage.package == 'PRO') {
      if (this.selectedPackage.package == 'ELITE') {
        return 'Upgrade plan';
      } else {
        return 'Downgrade plan';
      }
    }
  }
}
