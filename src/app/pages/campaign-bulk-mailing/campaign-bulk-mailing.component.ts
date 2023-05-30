import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { CampaignAddBroadcastComponent } from '../../components/campaign-add-broadcast/campaign-add-broadcast.component';
import { CampaignService } from '../../services/campaign.service';
import { sortStringArray } from '../../utils/functions';
import { Campaign } from '../../models/campaign.model';
import {
  BulkActions,
  DialogSettings,
  STATUS
} from '../../constants/variable.constants';
import { Subscription } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { searchReg } from 'src/app/helper';
@Component({
  selector: 'app-campaign-bulk-mailing',
  templateUrl: './campaign-bulk-mailing.component.html',
  styleUrls: ['./campaign-bulk-mailing.component.scss']
})
export class CampaignBulkMailingComponent implements OnInit, OnDestroy {
  bulkLists = [];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  DISPLAY_COLUMNS = [
    // 'select',
    'title',
    'status',
    'send-time',
    'delivered',
    'opened',
    'clicked',
    'action'
  ];
  page = 1;
  pageSize = this.PAGE_COUNTS[1];
  ACTIONS = BulkActions.BulkMailing;
  STATUS = STATUS;
  filteredResult = [];
  selectedLists = new SelectionModel<any>(true, []);
  isLoading = false;
  selectedSort = '';

  profileSubscription: Subscription;

  smtpConnected = false;
  smtpVerified = false;
  searchStr = '';
  searchCondition = {
    title: false,
    status: false
  };
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private userService: UserService,
    public campaignService: CampaignService
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      if (user && user._id) {
        this.smtpConnected = user.smtp_connected;
        this.smtpVerified = user.smtp_verified;
      }
    });
  }

  ngOnInit(): void {
    this.loadBulk();
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  loadBulk(): void {
    this.isLoading = true;
    this.campaignService.loadAll(true);
    this.campaignService.bulkLists$.subscribe(
      (res) => {
        this.isLoading = false;
        if (res && res.length > 0) {
          this.bulkLists = res;
          this.bulkLists.forEach((e) => {
            if (e.status == 'draft') {
              return;
            }
            if (!e.contacts) {
              e.status = 'closed';
              return;
            }
            if (e.sent && e.sent === e.contacts) {
              e.status = 'Completed';
            } else if (e.sent || e.failed) {
              e.status = 'Progressing';
            } else {
              e.status = 'Awaiting';
            }
          });
          this.filteredResult = this.bulkLists;
        }
      },
      (err) => {
        this.isLoading = false;
      }
    );
  }

  isSelectedPage(): any {
    if (this.bulkLists.length) {
      for (let i = 0; i < this.bulkLists.length; i++) {
        const e = this.bulkLists[i];
        if (!this.selectedLists.isSelected(e._id)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  selectAllPage(): void {
    if (this.isSelectedPage()) {
      this.bulkLists.forEach((e) => {
        if (this.selectedLists.isSelected(e._id)) {
          this.selectedLists.deselect(e._id);
        }
      });
    } else {
      this.bulkLists.forEach((e) => {
        if (!this.selectedLists.isSelected(e._id)) {
          this.selectedLists.select(e._id);
        }
      });
    }
  }

  selectAll(): void {
    this.bulkLists.forEach((e) => {
      if (!this.selectedLists.isSelected(e._id)) {
        this.selectedLists.select(e._id);
      }
    });
  }

  deselectAll(): void {
    this.bulkLists.forEach((e) => {
      if (this.selectedLists.isSelected(e._id)) {
        this.selectedLists.deselect(e._id);
      }
    });
  }

  addBroadcast(): void {
    this.dialog
      .open(CampaignAddBroadcastComponent, {
        width: '96vw',
        maxWidth: '600px',
        height: 'auto',
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.data) {
            const result = { ...res.data };
            if (result.sent && result.sent === result.contacts) {
              result.status = 'Completed';
            } else if (result.sent || result.failed) {
              result.status = 'Progressing';
            } else {
              result.status = 'Awaiting';
            }
            this.bulkLists = [...this.bulkLists, result];
          }
        }
      });
  }

  doAction(action: any): void {
    if (action.command === 'selectall') {
      this.selectAll();
    } else if (action.command === 'deselect') {
      this.deselectAll();
    }
  }

  connectSMTP(): void {
    this.router.navigate(['/campaign/smtp']);
  }
  verifyEmail(): void {
    this.router.navigate(['/campaign/smtp']);
  }

  changeSearchStr(): void {
    const filtered = this.bulkLists.filter((list) => {
      const str = list.title;
      return searchReg(str, this.searchStr);
    });
    this.filteredResult = filtered;
    this.sort(this.selectedSort, true);
    this.page = 1;
  }
  sort(field: string, keep: boolean = false) {
    if (this.selectedSort !== field) {
      this.selectedSort = field;
      return;
    }
    this.selectedSort = field;
    this.filteredResult = sortStringArray(
      this.filteredResult,
      field,
      this.searchCondition[field]
    );
    this.page = 1;
    if (!keep) {
      this.searchCondition[field] = !this.searchCondition[field];
    }
  }
  clearSearchStr(): void {
    this.searchStr = '';
    this.changeSearchStr();
  }
  changePageSize(type: any): void {
    this.pageSize = type;
  }
  closeCampaign(campaign: any): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Close campaign',
          message: 'Are you sure to close the current campaign',
          confirmLabel: 'Ok'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.campaignService.remove(campaign._id).subscribe((res) => {
            if (res && res['status']) {
              this.bulkLists.some((e, index) => {
                if (e._id === campaign._id) {
                  this.bulkLists.splice(index, 1);
                  return true;
                }
              });
            }
          });
        }
      });
  }
}
