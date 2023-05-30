import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { PACKAGE_LEVEL } from 'src/app/constants/variable.constants';
import { getUserLevel } from 'src/app/utils/functions';
import { PaymentCardComponent } from 'src/app/components/payment-card/payment-card.component';
import { SubscriptionCancelReasonComponent } from 'src/app/components/subscription-cancel-reason/subscription-cancel-reason.component';
import { User } from 'src/app/models/user.model';
import { UserService } from 'src/app/services/user.service';
import { TabItem } from 'src/app/utils/data.types';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {
  user: User = new User();
  loadingPayment = false;
  loadingInvoice = false;
  invoices = [];
  tabs: TabItem[] = [
    { label: 'Payment methods', id: 'methods', icon: '' },
    { label: 'Invoices', id: 'invoices', icon: '' }
  ];
  selectedTab: TabItem = this.tabs[0];
  currentPackage = PACKAGE_LEVEL.PRO;
  packageLevel = '';
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
  previewCardNumber = '';
  profileSubscription: Subscription;
  constructor(private dialog: MatDialog, private userService: UserService) {}

  ngOnInit(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile && profile._id) {
          this.user = profile;
          if (profile.payment) {
            this.loadingPayment = true;
            this.packageLevel = profile.package_level;
            this.currentPackage =
              PACKAGE_LEVEL[getUserLevel(profile.package_level)];
            this.userService.loadPayment(profile.payment);
            this.userService.payment$.subscribe(
              (res) => {
                this.loadingPayment = false;
                if (res) {
                  this.card = {
                    ...res,
                    number: res.last4
                  };
                  this.previewCardNumber = '•••• •••• •••• ' + this.card.number;
                }
              },
              () => {
                this.loadingPayment = false;
              }
            );
          } else {
            this.loadingPayment = false;
          }
        }
      }
    );
    this.getInvoice();
  }

  cancelAccount(): void {
    // this.step = 4;
    const messageDialog = this.dialog.open(SubscriptionCancelReasonComponent, {
      width: '800px',
      maxWidth: '800px',
      disableClose: true,
      data: {}
    });
    messageDialog['_overlayRef']['_host'].classList.add('top-dialog');
    messageDialog.afterClosed().subscribe((res) => {
      if (res) {
      }
    });
  }

  getInvoice(): void {
    this.loadingInvoice = true;
    this.userService.loadInvoice();
    this.userService.invoice$.subscribe(
      (res) => {
        this.loadingInvoice = false;
        if (res && res['status']) {
          this.invoices = res['data'];
        }
      },
      () => {
        this.loadingInvoice = false;
      }
    );
  }

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
  }

  createCard(): void {
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

          this.previewCardNumber = '•••• •••• •••• ' + this.card.number;
        }
      });
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
          this.previewCardNumber = '•••• •••• •••• ' + this.card.number;
        }
      });
  }
}
