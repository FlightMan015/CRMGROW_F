import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { STATUS } from 'src/app/constants/variable.constants';
import { ActivityService } from 'src/app/services/activity.service';
import { ContactService } from 'src/app/services/contact.service';
import { HandlerService } from 'src/app/services/handler.service';
import { StoreService } from 'src/app/services/store.service';

@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss']
})
export class ActivitiesComponent implements OnInit, OnDestroy {
  STATUS = STATUS;
  DISPLAY_COLUMNS = [
    'contact_name',
    'contact_label',
    'activity',
    'activity_time',
    'contact_email',
    'contact_phone',
    'contact_address'
  ];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 20, label: '20' },
    { id: 50, label: '50' }
  ];

  isUpdating = false;
  updateSubscription: Subscription;

  pageSize = this.PAGE_COUNTS[2];
  page = 1;
  constructor(
    public handlerService: HandlerService,
    public storeService: StoreService,
    public activityService: ActivityService,
    private contactService: ContactService
  ) {}

  ngOnInit(): void {
    // const currentPage = this.activityService.page.getValue();
    // this.changePage(currentPage || 1);

    const currentPageSize = this.activityService.pageSize.getValue();
    this.PAGE_COUNTS.some((e) => {
      if (e.id === currentPageSize) {
        this.pageSize = e;
        return true;
      }
    });
    this.activityService.load(0);
  }

  ngOnDestroy(): void {
    // Page Size and Page Index Save
    // this.activityService.page.next(this.page);
    this.activityService.pageSize.next(this.pageSize.id);
  }

  changePage(page: number): void {
    this.page = page;
    this.activityService.load(page);
  }

  onOverPages(page: number): void {
    this.changePage(page);
  }

  changePageSize(type: any): void {
    // Calculate New Page
    const newPage =
      Math.floor((this.pageSize.id * (this.page - 1)) / type.id) + 1;

    this.pageSize = type;
    this.activityService.pageSize.next(type.id);
    this.changePage(newPage);
  }

  updateLabel(label: string, _id: string): void {
    const newLabel = label ? label : null;
    const ids = [_id];
    this.isUpdating = true;
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.contactService
      .bulkUpdate(ids, { label: newLabel }, {})
      .subscribe((status) => {
        this.isUpdating = false;
        if (status) {
          this.handlerService.bulkContactUpdate$(ids, { label: newLabel }, {});
        }
      });
  }

  loadPage(param: string): void {
    if (param === 'first') {
      this.activityService.load(null);
      return;
    }
    if (param === 'next') {
      const last_activity = this.storeService.activities
        .getValue()
        .slice(-1)[0];
      let ids;
      if (
        last_activity.additional_field &&
        last_activity.additional_field.length
      ) {
        ids = [...last_activity.additional_field, last_activity._id];
      } else {
        ids = [last_activity._id];
      }
      ids.sort((a, b) => (a < b ? -1 : 1));
      this.activityService.load({ starting_after: ids[0] });
      return;
    }
    if (param === 'prev') {
      // this.activityService.load(0);
      const first_activity = this.storeService.activities.getValue()[0];
      let ids = [];
      if (
        first_activity.additional_field &&
        first_activity.additional_field.length
      ) {
        ids = [...first_activity.additional_field, first_activity._id];
      } else {
        ids = [first_activity._id];
      }
      ids.sort((a, b) => (a > b ? -1 : 1));
      this.activityService.load({ ending_before: ids[0] });
      return;
    }
  }
}
