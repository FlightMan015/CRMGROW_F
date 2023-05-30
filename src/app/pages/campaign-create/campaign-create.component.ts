import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { ReplaySubject, Subject, Subscription } from 'rxjs';
import {
  DialogSettings,
  STATUS,
  WORK_TIMES,
  HOURS
} from 'src/app/constants/variable.constants';
import { Contact } from 'src/app/models/contact.model';
import { StoreService } from 'src/app/services/store.service';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { MaterialService } from 'src/app/services/material.service';
import { CalendarMonthViewDay } from 'angular-calendar';
import { CampaignService } from 'src/app/services/campaign.service';
import { getCurrentTimezone, numPad, searchReg } from 'src/app/helper';
import { ToastrService } from 'ngx-toastr';
import { HelperService } from 'src/app/services/helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  takeUntil,
  tap
} from 'rxjs/operators';
import { Location } from '@angular/common';
import { UserService } from 'src/app/services/user.service';
import { CampaignAddContactComponent } from 'src/app/components/campaign-add-contact/campaign-add-contact.component';
import { ContactCreateComponent } from 'src/app/components/contact-create/contact-create.component';
import { TemplatesBrowserComponent } from 'src/app/components/templates-browser/templates-browser.component';
import { Template } from 'src/app/models/template.model';
import { TemplatesService } from 'src/app/services/templates.service';
import { ThemeService } from 'src/app/services/theme.service';
import * as moment from 'moment';
@Component({
  selector: 'app-campaign-create',
  templateUrl: './campaign-create.component.html',
  styleUrls: ['./campaign-create.component.scss']
})
export class CampaignCreateComponent implements OnInit {
  stepIndex = 1;

  STATUS = STATUS;
  TIMES = WORK_TIMES;
  SELECTED_ACTIONS = [
    {
      label: 'Remove from selection',
      type: 'button',
      command: 'deselect',
      loading: false
    }
  ];
  SELECTION_DISPLAY_COLUMNS = [
    'select',
    'contact_name',
    'contact_email',
    'contact_phone',
    'actions'
  ];
  @ViewChild('addDrawer') addDrawer: MatDrawer;
  @ViewChild('addPanel') addPanel: TemplatesBrowserComponent;
  panelType = '';

  selection: Contact[] = [];
  prevCampaignSelection: Contact[] = [];

  pageSelectionContacts = [];
  selectionPage = 1;
  selectedSelection: Contact[] = [];

  // Templates
  selectedTemplate;
  allMaterials = [];
  materialLoadSubscription: Subscription;
  loadingMaterials = false;

  // Calendars
  today: Date = new Date();
  viewDate: Date = new Date();
  selectedCalDate: Date = new Date();
  selectedDate: Date = new Date();
  newCampaignStatus = [];
  currentDateStatus;
  selectedTime = WORK_TIMES[0].id;
  events = [];
  dayStatus = [];
  time_zone;
  loadingCalendar = false;

  // Global
  title = '';
  saving = false;
  campaign_id = '';
  submitted = false;
  loadingCampaign = false;
  loadingCampaignContacts = false;
  dailyLimit = 300;
  submitAction = '';

  // attached Materials
  attachedMaterials: string[];

  // Campaign Load
  campaignForm: FormControl = new FormControl();
  inputControl: FormControl = new FormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('selector') selector: MatSelect;
  filteredCampaigns: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
  searchingCampaign = false;
  searchCampaignStr = '';
  protected _onDestroy = new Subject<void>();

  creatingTemplate = false;
  editingTemplate = false;
  creatingNewsletter = false;
  MIN_DATE = {};
  date;

  start_time;
  end_time = WORK_TIMES[WORK_TIMES.length - 1].id;

  constructor(
    public campaignService: CampaignService,
    private userService: UserService,
    private templateService: TemplatesService,
    private themeService: ThemeService,
    private materialService: MaterialService,
    private storeService: StoreService,
    private helperService: HelperService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private toast: ToastrService,
    private location: Location,
    private router: Router
  ) {
    const current = new Date();
    this.MIN_DATE = {
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      day: current.getDate()
    };
    this.date = {
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      day: current.getDate()
    };
  }

  ngOnInit(): void {
    const page = this.route.snapshot.routeConfig.path;
    if (page.indexOf('campaign/bulk/draft') !== -1) {
      this.campaign_id = this.route.snapshot.params.id;
    }

    if (this.campaign_id) {
      this.loadCampaign();
    }
    this.campaignService.loadAll();
    this.loadAvailableDates1();

    this.time_zone = getCurrentTimezone();

    this.userService.garbage$.subscribe((res) => {
      if (res && res.smtp_info) {
        const smtp_info = res.smtp_info;
        this.dailyLimit = smtp_info.daily_limit || 400;

        let startIndex = 0;
        let endIndex = HOURS.length - 1;
        if (smtp_info.start_time) {
          this.start_time = smtp_info.start_time;
          startIndex = HOURS.findIndex((e) => e.id == this.start_time);
        }
        if (smtp_info.end_time) {
          this.end_time = smtp_info.end_time;
          endIndex = HOURS.findIndex((e) => e.id == this.end_time);
        }

        this.TIMES = HOURS.filter(
          (e, index) => index >= startIndex && index <= endIndex
        );
        if (this.TIMES.length) {
          this.selectedTime = this.TIMES[0].id;
        }
      }
    });

    this.campaignService.bulkLists$.subscribe((filters) => {
      this.filteredCampaigns.next(filters);
    });
    this.inputControl.valueChanges
      .pipe(
        filter((search) => true),
        takeUntil(this._onDestroy),
        debounceTime(200),
        distinctUntilChanged(),
        tap(() => (this.searchingCampaign = true)),
        map((search) => {
          this.searchCampaignStr = search;
          return this.campaignService.bulkLists$;
        })
      )
      .subscribe(
        (data) => {
          data.subscribe((filters) => {
            if (this.searchCampaignStr) {
              const res = _.filter(filters, (e) => {
                return searchReg(e.title, this.searchCampaignStr);
              });
              this.filteredCampaigns.next(res);
            } else {
              this.filteredCampaigns.next(filters);
            }
            this.searchingCampaign = false;
          });
        },
        () => {
          this.searchingCampaign = false;
        }
      );
    this.campaignForm.valueChanges.subscribe((val) => {
      this.selectCampaign(val);
    });
  }

  /**
   * Go to back page
   */
  goToBack(): void {
    // this.location.back();
    this.router.navigate(['/campaign']);
  }

  goToStep(step: number): void {
    if (step === 2) {
      if (!this.selectedTemplate || !this.title) {
        this.toast.warning(
          'Please enter name or select email template for campaign.'
        );
        return;
      }
    }
    if (step === 3) {
      if (!this.selectedTemplate) {
        this.toast.warning('Please select email template for campaign.');
        return;
      }
      if (!this.selection || !this.selection.length) {
        this.toast.warning('Please select contacts for campaign.');
        return;
      }
    }
    if (step === 4) {
      if (!this.selectedTemplate) {
        this.toast.warning('Please select email template for campaign.');
        return;
      }
      if (!this.selection || !this.selection.length) {
        this.toast.warning('Please select contacts for campaign.');
        return;
      }
      if (!this.newCampaignStatus || !this.newCampaignStatus.length) {
        this.toast.warning('Please set the date for new campaign.');
        return;
      }
    }
    this.stepIndex = step;
  }

  loadCampaign(): void {
    this.loadingCampaign = true;
    this.campaignService.loadDraft(this.campaign_id).subscribe((res) => {
      this.loadingCampaign = false;
      if (res && res['data']) {
        if (res['data'] && res['data']['contacts']) {
          this.selection = res['data']['contacts'].map((e) =>
            new Contact().deserialize(e)
          );
        }
        if (res['data'] && res['data']['campaign']) {
          const campaign = res['data']['campaign'];
          this.title = campaign['title'];
          this.selectedTemplate =
            campaign['email_template'] || campaign['newsletter'];
          if (campaign['due_start']) {
            const due_date = new Date(campaign['due_start']);
            const year = due_date.getFullYear();
            const month = numPad(due_date.getMonth() + 1);
            const date = numPad(due_date.getDate());
            const hour = numPad(due_date.getHours());
            const min = numPad(due_date.getMinutes());
            this.selectedDate = new Date(
              `${year}-${month}-${date}T00:00:00.000${this.time_zone}`
            );
            this.selectedTime = `${hour}:${min}:00.000`;
            this.viewDate = due_date;
            this.selectedCalDate = this.viewDate;
          }
          const selection = campaign['contacts'].map((e) =>
            new Contact().deserialize({ _id: e })
          );
          this.selection = [...this.selection, ...selection];
          this.selection = _.uniqBy(this.selection, '_id');
          // Load All contacts
          if (this.selection.length > 50) {
            this.loadAllCampaignContacts();
          }
        }
        if (
          this.selectedDate &&
          this.selection &&
          this.selection.length &&
          this.selectedTemplate
        ) {
          this.stepIndex = 4;
        } else if (
          this.selectedTemplate &&
          this.selection &&
          this.selection.length
        ) {
          this.stepIndex = 3;
        } else if (this.selection && this.selection.length) {
          this.stepIndex = 2;
        }
      } else {
        // Go Back
        this.goToBack();
      }
    });
  }

  loadAllCampaignContacts(): void {
    this.loadingCampaignContacts = true;
    this.campaignService.loadContacts(this.campaign_id).subscribe((res) => {
      this.loadingCampaignContacts = false;
      if (res && res['data']) {
        this.selection = res['data'].map((e) => new Contact().deserialize(e));
      }
    });
  }

  selectCampaign(campaign: any): void {
    this.loadingCampaignContacts = true;
    this.campaignService.loadContacts(campaign._id).subscribe((res) => {
      this.loadingCampaignContacts = false;
      this.prevCampaignSelection = res['data'].map((e) =>
        new Contact().deserialize(e)
      );
      this.selection = _.uniqBy(
        [...this.selection, ...this.prevCampaignSelection],
        '_id'
      );
    });
  }

  /*******************************************
   *******************************************
   Step 1 - Contacts Select
   *******************************************
   *******************************************/
  createContact(): void {
    this.dialog
      .open(ContactCreateComponent, {
        ...DialogSettings.CONTACT
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.contact) {
          this.selection.push(new Contact().deserialize(res.contact));
        }
      });
  }

  selectFromContacts(): void {
    this.dialog
      .open(CampaignAddContactComponent, {
        width: '96vw',
        maxWidth: '1440px',
        height: 'calc(65vh + 140px)'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.contacts && res.contacts.length) {
          // contacts
          this.selection = _.uniqBy(
            [...this.selection, ...res.contacts],
            '_id'
          );
        }
      });
  }

  masterSelectionToggle(): void {
    const page = this.selectionPage;
    let skip = (page - 1) * 50;
    skip = skip < 0 ? 0 : skip;
    // Reset the Page Contacts
    this.pageSelectionContacts = this.selection.slice(skip, skip + 50);
    if (this.isAllSelectionSelected()) {
      this.selectedSelection = _.differenceBy(
        this.selectedSelection,
        this.pageSelectionContacts,
        '_id'
      );
      return;
    }
    this.pageSelectionContacts.forEach((e) => {
      if (!this.isSelectionSelected(e)) {
        this.selectedSelection.push(e);
      }
    });
  }
  isAllSelectionSelected(): boolean {
    const currentSelection = _.intersectionBy(
      this.selectedSelection,
      this.pageSelectionContacts,
      '_id'
    );
    return currentSelection.length === this.pageSelectionContacts.length;
  }
  toggleSelection(contact: Contact): void {
    const selectedContact = contact;
    const toggledAllSelection = _.xorBy(
      this.selectedSelection,
      [selectedContact],
      '_id'
    );
    this.selectedSelection = toggledAllSelection;
  }
  isSelectionSelected(contact: Contact): boolean {
    return _.findIndex(this.selectedSelection, contact, '_id') !== -1;
  }
  removeSelected(contact: Contact): void {
    const toggledAllSelection = _.xorBy(this.selection, [contact], '_id');
    this.selection = toggledAllSelection;
  }
  removeSelections(): void {
    const toggledAllSelection = _.xorBy(
      this.selection,
      this.selectedSelection,
      '_id'
    );
    this.selection = toggledAllSelection;
    this.selectedSelection = [];
  }
  doSelectedAction(event: any): void {
    if (event.command === 'deselect') {
      this.removeSelections();
    }
  }

  changeSelectedPage(page: number): void {
    this.selectionPage = page;
    let skip = (page - 1) * 50;
    skip = skip < 0 ? 0 : skip;
    // Reset the Page Contacts
    this.pageSelectionContacts = this.selection.slice(skip, skip + 50);
  }

  /*******************************************
   *******************************************
   Step 2 - Select Templates
   *******************************************
   *******************************************/
  browseTemplate(): void {
    this.addDrawer.open();
  }

  openAction(): void {
    this.addDrawer.open();
  }

  closeAddAction($event): void {
    if ($event) {
      this.selectTemplate($event);
    }
    this.addDrawer.close();
  }

  createTemplate(): void {
    this.creatingTemplate = true;
    this.editingTemplate = false;
    this.creatingNewsletter = false;
  }

  editTemplate(): void {
    this.editingTemplate = true;
    this.creatingTemplate = false;
    this.creatingNewsletter = false;
  }

  createNewsletter(): void {
    this.creatingTemplate = false;
    this.editingTemplate = false;
    this.creatingNewsletter = true;
  }

  editNewsletter(): void {
    this.creatingTemplate = false;
    this.editingTemplate = false;
    this.creatingNewsletter = true;
  }

  onEditTemplate(event: any): void {
    if (event) {
      this.selectedTemplate = new Template().deserialize(event);
    }
    this.editingTemplate = false;
  }

  onCreateTemplate(event: any): void {
    if (event) {
      this.selectedTemplate = new Template().deserialize(event);
      this.templateService.create$(this.selectedTemplate);
    }
    this.creatingTemplate = false;
  }

  onEditNewsletter(event: any): void {
    if (event) {
      this.selectedTemplate = new Template().deserialize(event);
    }
    this.creatingNewsletter = false;
  }
  onCreateNewsletter(event: any): void {
    if (event) {
      this.selectedTemplate = new Template().deserialize(event);
      this.themeService.create$(this.selectedTemplate);
    }
    this.creatingNewsletter = false;
  }

  selectTemplate(template: any): void {
    this.selectedTemplate = template;
  }
  /*******************************************
   *******************************************
   Step 3 - Select Date
   *******************************************
   *******************************************/
  _processCampaigns(_items, _reducedCount, count_value): any {
    let sum_contacts_count = 0;
    const res_arr = [];
    for (let i = 0; i < _items.length; i++) {
      const tempSum = sum_contacts_count;
      sum_contacts_count += _items[i].contacts.length;
      if (
        _reducedCount - count_value >= tempSum &&
        _reducedCount - count_value < sum_contacts_count
      ) {
        res_arr.push({
          title: _items[i].campaign[0].title,
          subject: _items[i].campaign[0].subject
        });
      } else if (
        _reducedCount - count_value < tempSum &&
        _reducedCount >= tempSum
      ) {
        res_arr.push({
          title: _items[i].campaign[0].title,
          subject: _items[i].campaign[0].subject
        });
      }
    }
    return res_arr;
  }
  loadAvailableDates1(): void {
    this.campaignService.loadDayStatus().subscribe((res) => {
      if (res['status']) {
        let campaigns = [];
        res['data'].forEach((e) => {
          if (e.items && e.items.length > 0) {
            e.items.forEach((element) => {
              if (element.campaign && element.campaign.length > 0) {
                element.campaign.forEach((campaign) => {
                  if (
                    moment(campaign['due_start']).isSameOrAfter(
                      moment().startOf('day')
                    )
                  ) {
                    campaigns.push(campaign);
                  }
                });
              }
            });
          }
        });
        campaigns = _.orderBy(campaigns, ['due_start'], ['asc']);

        campaigns.forEach((e) => {
          const contacts_count = e.contacts.length;
          let curDate = moment(e.due_start).startOf('day');
          const { title, subject } = e;

          let currentCount = contacts_count;
          while (currentCount > 0) {
            const index = this.dayStatus.findIndex((item) =>
              moment(item.curDate).isSame(curDate)
            );
            if (index >= 0) {
              const sameDayStatus = this.dayStatus[index];
              if (sameDayStatus.count < this.dailyLimit) {
                const limit_count = this.dailyLimit - sameDayStatus.count;
                const count =
                  currentCount > limit_count ? limit_count : currentCount;

                this.dayStatus[index] = {
                  ...sameDayStatus,
                  campaigns: [
                    ...sameDayStatus.campaigns,
                    { title, subject, count }
                  ],
                  count: sameDayStatus.count + count
                };
                currentCount -= limit_count;
              }
            } else {
              const count =
                currentCount > this.dailyLimit ? this.dailyLimit : currentCount;
              this.dayStatus.push({
                curDate: curDate.clone().toDate(),
                campaigns: [{ title, subject, count }],
                count
              });
              currentCount -= this.dailyLimit;
            }
            curDate = curDate.add(1, 'day');
          }
        });
      }
    });
  }

  loadAvailableDates(): void {
    this.loadingCalendar = true;
    this.campaignService.loadDayStatus().subscribe((res) => {
      this.loadingCalendar = false;
      this.events = [];
      res['data'].forEach((event) => {
        const year = event._id.year;
        const month = numPad(event._id.month);
        const day = numPad(event._id.day);
        const date = new Date(`${year}-${month}-${day}`);

        const _formattedEvent = {
          title: event.contacts_count,
          start: date,
          end: date
        };
        this.events.push(_formattedEvent);
      });
    });
  }

  calendarDateChange(mode: string): void {}

  selectDate(day): void {
    if (day.date) {
      this.selectedDate = day.date;
      this.selectedCalDate = day.date;
    }
  }

  dateIsValid(date: Date): boolean {
    return date.getTime() + 3600 * 1000 * 18 < new Date().getTime();
  }
  dateIsSelected(date: Date): boolean {
    return (
      date.toLocaleDateString() === this.selectedCalDate.toLocaleDateString()
    );
  }

  applyDateSelectionPolicy({ body }: { body: CalendarMonthViewDay[] }): void {
    body.forEach((day) => {
      let cssClass = '';
      if (day.events && day.events.length) {
        if (parseInt(day.events[0].title + '') > this.dailyLimit) {
          cssClass += 'over-campaign';
        } else {
          cssClass += 'has-campaign';
        }
      }
      if (this.dateIsValid(day.date)) {
        cssClass += ' disabled-date';
      }
      day.cssClass = cssClass;
    });
  }

  /*******************************************
   *******************************************
   Step 4 - Select Date
   *******************************************
   *******************************************/

  getDueTime(): Date {
    if (this.selectedDate) {
      const year = this.selectedDate.getFullYear();
      const month = this.selectedDate.getMonth() + 1;
      const day = this.selectedDate.getDate();
      const time = this.selectedTime || WORK_TIMES[0].id;

      const due_date = new Date(
        `${year}-${numPad(month)}-${numPad(day)}T${time}${this.time_zone}`
      );
      return due_date;
    } else {
      return null;
    }
  }

  generateCampaignData(): any {
    const contacts = this.selection.map((e) => e._id);
    const campaign = {
      contacts: contacts,
      videos: [],
      pdfs: [],
      images: [],
      title: '',
      due_start: null,
      newsletter: null,
      // email_template: null
      subject: '',
      content: ''
    };
    if (this.campaign_id) {
      campaign['id'] = this.campaign_id;
    }
    campaign.title = this.title;
    campaign.due_start = this.getDueTime();
    if (this.selectedTemplate && this.selectedTemplate.type === 'email') {
      // campaign['email_template'] = this.selectedTemplate['_id'];
      campaign['subject'] = this.selectedTemplate['subject'];
      campaign['content'] = this.selectedTemplate['content'];
      campaign.videos = this.selectedTemplate.video_ids;
      campaign.pdfs = this.selectedTemplate.pdf_ids;
      campaign.images = this.selectedTemplate.image_ids;
    } else {
      campaign['newsletter'] = this.selectedTemplate['_id'];
    }
    return campaign;
  }

  saveDraft(): void {
    this.submitted = true;
    if (!this.title) {
      return;
    }
    const campaign = this.generateCampaignData();
    this.submitAction = 'draft';
    this.saving = true;
    this.campaignService.saveAsDraft(campaign).subscribe((res) => {
      this.saving = false;
      if (res['status']) {
        this.goToBack();
      }
    });
  }

  publish(): void {
    this.submitted = true;
    if (!this.title) {
      return;
    }
    const campaign = this.generateCampaignData();
    this.submitAction = 'publish';
    this.saving = true;
    this.campaignService.publish(campaign).subscribe((res) => {
      this.saving = false;
      if (res['status']) {
        this.goToBack();
      }
    });
  }

  create(): void {
    this.submitted = true;
    if (!this.title) {
      return;
    }
    const campaign = this.generateCampaignData();
    this.submitAction = 'publish';
    this.saving = true;
    this.campaignService.create(campaign).subscribe((res) => {
      this.saving = false;
      if (res['status']) {
        this.goToBack();
      }
    });
  }

  onChangeDate($event): void {
    this.selectedDate = moment({
      years: $event.year,
      months: $event.month - 1,
      days: $event.day
    }).toDate();

    this.currentDateStatus = this.dayStatus.find((item) =>
      moment(item.curDate).isSame(moment(this.selectedDate))
    );

    this.newCampaignStatus = [];
  }

  onSetDate($event): void {
    const selectedDate = moment({
      years: $event.year,
      months: $event.month - 1,
      days: $event.day
    });
    if (selectedDate.isoWeekday() > 5) {
      this.toast.warning('Please select the business date for new campaign.');
      return;
    }
    if (
      moment(this.end_time, 'HH:mm:ss.SSS').isBefore(moment()) &&
      moment().format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD')
    ) {
      this.toast.warning(
        'Current time is out of business hours. Please select another date.'
      );
      return;
    }

    this.selectedDate = selectedDate.toDate();

    const dayStatusTmp = JSON.parse(JSON.stringify(this.dayStatus));
    const nextDay = moment(this.selectedDate).clone();
    let c_contacts_count = this.selection.length;
    const limit_count = this.dailyLimit;
    const cur_campaign = [];
    cur_campaign.push(this.title);
    this.newCampaignStatus = [];
    while (c_contacts_count > 0) {
      let count_value = limit_count;
      let is_push = false;
      const oldStatus = dayStatusTmp.find((item) =>
        nextDay.isSame(moment(item.curDate))
      );
      if (oldStatus) {
        if (oldStatus.count < limit_count) {
          count_value = limit_count - oldStatus.count;
          is_push = true;
        }
      } else {
        is_push = true;
      }
      if (is_push) {
        if (c_contacts_count >= count_value) {
          c_contacts_count = c_contacts_count - count_value;
        } else {
          count_value = c_contacts_count;
          c_contacts_count = 0;
        }

        this.newCampaignStatus.push({
          curDate: nextDay.toDate(),
          count: count_value
        });
        if (oldStatus) {
          if (oldStatus.count < limit_count) {
            oldStatus.count = oldStatus.count + count_value;
            oldStatus.campaigns.push(this.title);
          }
        } else {
          dayStatusTmp.push({
            curDate: nextDay.toDate(),
            count: count_value,
            campaigns: cur_campaign,
            virtual: true
          });
        }
      }
      if (nextDay.isoWeekday() == 7) {
        nextDay.day(1);
      } else if (nextDay.isoWeekday() >= 5) {
        nextDay.day(8);
      } else {
        nextDay.add(1, 'day');
      }
    }
    this.currentDateStatus = this.dayStatus.find(
      (item) =>
        item.curDate.setHours(0, 0, 0, 0) === this.selectedDate.getTime()
    );
  }
}
