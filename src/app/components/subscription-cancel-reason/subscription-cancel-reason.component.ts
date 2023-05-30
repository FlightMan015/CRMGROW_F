import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { CANCEL_ACCOUNT_REASON } from 'src/app/constants/variable.constants';
import { UserService } from 'src/app/services/user.service';
import { HandlerService } from 'src/app/services/handler.service';
import { ToastrService } from 'ngx-toastr';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { Cookie } from 'src/app/utils/cookie';

@Component({
  selector: 'app-subscription-cancel-reason',
  templateUrl: './subscription-cancel-reason.component.html',
  styleUrls: ['./subscription-cancel-reason.component.scss']
})
export class SubscriptionCancelReasonComponent implements OnInit {
  reasonButtons = CANCEL_ACCOUNT_REASON;
  selectedReason = this.reasonButtons[0];
  reasonFeedback = '';
  selectedReasonId = 0;
  flowStep = -1;
  saving = false;
  isKeepDataSelected = true;
  isCanceled = false;
  cancelAccountSubscription: Subscription;
  sleepAccountSubscription: Subscription;
  loadingCancelAccount = false;
  loadingSleepAccount = false;
  confirmStep = false;
  chatWithUs =
    'https://scheduler.crmgrow.com/crmgrowsuccessteam/one-on-one-help';

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    public handlerService: HandlerService,
    private dialogRef: MatDialogRef<SubscriptionCancelReasonComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {}

  isSelected(reason: string): any {
    return this.selectedReason === reason;
  }

  selectReason(reason): void {
    this.selectedReason = reason;
    this.selectedReasonId = this.reasonButtons.findIndex(
      (res) => res === reason
    );
  }
  selectKeepData(value): void {
    this.isKeepDataSelected = value;
  }
  nextAction(): void {
    // if (this.selectedReasonId === 4 && this.flowStep === 0) {
    //   if (this.isKeepDataSelected) {
    //     this.reasonFeedback =
    //       'Pause my account and keep my data for only $4.99/m';
    //     this.loadingSleepAccount = true;
    //   } else {
    //     this.reasonFeedback =
    //       'I want to cancel. I understand that my data will be deleted after 60 days';
    //   }
    // }
    this.confirmStep = false;
    if (this.selectedReasonId === 4 || this.selectedReasonId === 5) {
      this.confirmAction();
    } else {
      this.flowStep++;
    }
  }

  backAction(): void {
    this.confirmStep = false;
    this.flowStep--;
  }
  closeDialog(): void {
    this.confirmStep = false;
    this.flowStep = -1;
    this.dialogRef.close();
  }
  cancelAction(): void {
    if (this.isKeepDataSelected) {
      this.loadingSleepAccount = true;
      this.sleepAccountSubscription &&
        this.sleepAccountSubscription.unsubscribe();
      this.sleepAccountSubscription = this.userService.sleepAccount().subscribe(
        (res) => {
          this.loadingSleepAccount = false;
          this.activeLastStep();
        },
        (err) => {
          this.loadingSleepAccount = false;
        }
      );
    } else {
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
            if (res.status) {
              this.activeLastStep();
              this.completeCancelAccount();
            }
          },
          (err) => {
            this.loadingCancelAccount = false;
          }
        );
    }
  }

  /**
   * Active last step
   */
  activeLastStep(): void {
    this.confirmStep = false;
    this.isCanceled = true;
    this.flowStep++;
  }

  /**
   * Close the cancel account
   */
  completeCancelAccount(): void {
    Cookie.setLogout();
    localStorage.removeItem('token');
    location.href = 'https://crmgrow.com/pricing.html';
    this.userService.logoutImpl();
    this.handlerService.clearData();
  }

  confirmAction(): void {
    this.flowStep++;
    this.confirmStep = true;
  }
}
