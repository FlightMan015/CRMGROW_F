import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user.model';
import { SmsService } from 'src/app/services/sms.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-purchase-message',
  templateUrl: './purchase-message.component.html',
  styleUrls: ['./purchase-message.component.scss']
})
export class PurchaseMessageComponent implements OnInit {
  saving = false;
  user: User = new User();
  plans = [
    { type: 1, sms: '250', price: '6' },
    { type: 2, sms: '500', price: '10' },
    { type: 3, sms: '1000', price: '15' }
  ];
  currentType = this.plans[1];
  profileSubscription: Subscription;

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<PurchaseMessageComponent>,
    private smsService: SmsService,
    private userService: UserService
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile) {
          this.user = profile;
        }
      }
    );
  }

  ngOnInit(): void {}

  selectPlan(plan: any): void {
    this.currentType = plan;
  }

  purchase(): void {
    this.saving = true;
    const data = {
      option: this.currentType.type
    };
    this.smsService.buyCredit(data).subscribe(
      (res) => {
        if (res && res['status']) {
          this.saving = false;
          this.dialogRef.close(true);
        } else {
          this.saving = false;
        }
      },
      (error) => {}
    );
  }
}
