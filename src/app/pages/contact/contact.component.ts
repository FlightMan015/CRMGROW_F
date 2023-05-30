import { Location } from '@angular/common';
import {
  Component,
  OnInit,
  ViewContainerRef,
  OnDestroy,
  ElementRef,
  ViewChild,
  TemplateRef,
  HostListener,
  Inject
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  Contact,
  ContactActivity,
  ContactDetail
} from 'src/app/models/contact.model';
import { ContactService } from 'src/app/services/contact.service';
import { StoreService } from 'src/app/services/store.service';
import { OverlayService } from 'src/app/services/overlay.service';
import { HelperService } from 'src/app/services/helper.service';
import { DetailActivity } from 'src/app/models/activityDetail.model';
import { Clipboard } from '@angular/cdk/clipboard';
import { MaterialService } from 'src/app/services/material.service';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MaterialBrowserComponent } from 'src/app/components/material-browser/material-browser.component';
import { ContactMergeComponent } from 'src/app/components/contact-merge/contact-merge.component';
import { Automation } from 'src/app/models/automation.model';
import {
  ActionName,
  DialogSettings,
  CALENDAR_DURATION,
  STATUS,
  ROUTE_PAGE,
  AUTOMATION_ICONS,
  PHONE_COUNTRIES
} from 'src/app/constants/variable.constants';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import {
  adjustPhoneNumber,
  getCurrentTimezone,
  listToTree
} from 'src/app/helper';
import { AutomationShowFullComponent } from 'src/app/components/automation-show-full/automation-show-full.component';
import { CalendarDialogComponent } from 'src/app/components/calendar-dialog/calendar-dialog.component';
import { JoinCallRequestComponent } from 'src/app/components/join-call-request/join-call-request.component';
import { TabItem } from 'src/app/utils/data.types';
import { Task, TaskDetail } from 'src/app/models/task.model';
import { NoteService } from 'src/app/services/note.service';
import { DealsService } from 'src/app/services/deals.service';
import { TaskService } from 'src/app/services/task.service';
import { HandlerService } from 'src/app/services/handler.service';
import * as _ from 'lodash';
import { SendEmailComponent } from 'src/app/components/send-email/send-email.component';
import { ContactEditComponent } from 'src/app/components/contact-edit/contact-edit.component';
import { AdditionalEditComponent } from 'src/app/components/additional-edit/additional-edit.component';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { NoteEditComponent } from 'src/app/components/note-edit/note-edit.component';
import { TaskEditComponent } from 'src/app/components/task-edit/task-edit.component';
import { TaskCreateComponent } from 'src/app/components/task-create/task-create.component';
import { NoteCreateComponent } from 'src/app/components/note-create/note-create.component';
import { AutomationService } from 'src/app/services/automation.service';
import { Subscription } from 'rxjs';
import { ContactShareComponent } from '../../components/contact-share/contact-share.component';
import { UserService } from 'src/app/services/user.service';
import * as moment from 'moment';
import { TeamService } from 'src/app/services/team.service';
import { NotifyComponent } from 'src/app/components/notify/notify.component';
import { AppointmentService } from 'src/app/services/appointment.service';
import { DealCreateComponent } from 'src/app/components/deal-create/deal-create.component';
import { ToastrService } from 'ngx-toastr';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { SendTextComponent } from 'src/app/components/send-text/send-text.component';
import { environment } from 'src/environments/environment';
import { User } from 'src/app/models/user.model';
import { AdditionalFieldsComponent } from 'src/app/components/additional-fields/additional-fields.component';
import { TemplatePortal } from '@angular/cdk/portal';
import { Note } from 'src/app/models/note.model';
import { DetailErrorComponent } from 'src/app/components/detail-error/detail-error.component';
import { Draft } from '../../models/draft.model';
import { filter, map } from 'rxjs/operators';
import { EmailService } from '../../services/email.service';
import { DialPlanComponent } from 'src/app/components/dial-plan/dial-plan.component';
import { Timeline } from '../../models/timeline.model';
import { DialerService } from 'src/app/services/dialer.service';
import { DialerCallComponent } from 'src/app/components/dialer-call/dialer-call.component';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';
import { CountryISO } from 'ngx-intl-tel-input';
import { PhoneInputComponent } from 'src/app/components/phone-input/phone-input.component';
import { InputTagComponent } from 'src/app/components/input-tag/input-tag.component';
import { DealMoveComponent } from 'src/app/components/deal-move/deal-move.component';
import { TaskRecurringDialogComponent } from 'src/app/components/task-recurring-dialog/task-recurring-dialog.component';

const ZONEREG = /-[0-1][0-9]:00|Z/;

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit, OnDestroy {
  SITE = environment.front;
  STATUS = STATUS;
  tabs: TabItem[] = [
    { icon: '', label: 'Activity', id: 'all' },
    { icon: '', label: 'Notes', id: 'note' },
    { icon: '', label: 'Emails', id: 'email' },
    { icon: '', label: 'Texts', id: 'text' },
    { icon: '', label: 'Meetings', id: 'appointment' },
    // { icon: '', label: 'Group Calls', id: 'group_call' },
    { icon: '', label: 'Tasks', id: 'follow_up' },
    { icon: '', label: 'Deals', id: 'deal' },
    { icon: '', label: 'Calls', id: 'phone_log' }
  ];
  tab: TabItem = this.tabs[0];
  activityType: TabItem = this.tabs[0];

  timeSorts = [
    { label: 'All', id: 'all' },
    { label: 'Overdue', id: 'overdue' },
    { label: 'Today', id: 'today' },
    { label: 'Tomorrow', id: 'tomorrow' },
    { label: 'This week', id: 'this_week' },
    { label: 'Next Week', id: 'next_week' },
    { label: 'Future', id: 'future' }
  ];
  selectedTimeSort = this.timeSorts[0];

  userId = '';
  _id = '';
  isUnsubscribed = false;
  contact: ContactDetail = new ContactDetail();
  originContact: ContactDetail = new ContactDetail();
  selectedContact: Contact = new Contact();
  groupActions = {};
  mainTimelines: DetailActivity[] = [];
  showingDetails = [];
  pageCount = 0;
  currentPage = 0;
  pageSize = 0;
  pageContacts: ContactActivity[] = [];
  isFirst = false;
  isLast = false;
  isEnable = false;
  materials = [];
  activityCounts = {
    all: 0,
    note: 0,
    email: 0,
    text: 0,
    appointment: 0,
    group_call: 0,
    follow_up: 0,
    deal: 0,
    phone_log: 0
  };
  editors = {};
  timezone;

  // Note
  noteSaving = false;
  noteContent = '';
  emptyValue = true;

  // Automation
  selectedAutomation: Automation;
  ActionName = ActionName;
  treeControl = new NestedTreeControl<any>((node) => node.children);

  allContactDataSource = new MatTreeNestedDataSource<any>();
  dataContactSource = new MatTreeNestedDataSource<any>();

  allDealDataSource = [];
  dataDealSource = [];

  hasChild = (_: number, node: any) =>
    !!node.children && node.children.length > 0;
  durations = CALENDAR_DURATION;
  canceling = false;
  assigning = false;
  cancelSubscription: Subscription;
  assignSubscription: Subscription;

  // Share Calendar
  sharable: boolean = false;
  hasCalendar: false;

  // Subscriptions & Related Contacts Load
  profileSubscription: Subscription;
  teamSubscription: Subscription;
  updateSubscription: Subscription;
  updateNoteSubscription: Subscription;
  loadingContact = false;
  detailContacts = [];
  loadContactSubscription: Subscription;

  // Contact Id Route & Additional Field
  routeChangeSubscription: Subscription;
  garbageSubscription: Subscription;
  lead_fields: any[] = [];
  extra_additional_fields: any = {}; // the extra additional fields which not defined from settings

  // Name Update
  nameEditable = false;
  contactFirstName = '';
  contactLastName = '';
  activeFieldName = '';
  saving = false;
  saveSubscription: Subscription;

  fieldEditable = {
    phone: false,
    primary_email: false,
    address: false,
    website: false,
    second_phone: false,
    second_email: false
  };
  contact_phone: any = {};
  second_contact_phone: any = {};
  LOCATION_COUNTRIES = ['US', 'CA'];
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;
  @ViewChild('phoneControl') phoneControl: PhoneInputComponent;
  @ViewChild('secondPhoneControl') secondPhoneControl: PhoneInputComponent;
  @ViewChild('primary_email') primary_email_field: ElementRef;
  @ViewChild('contact_address') contact_address_field: ElementRef;
  @ViewChild('contact_website') contact_website_field: ElementRef;
  @ViewChild('second_email') second_email_field: ElementRef;
  @ViewChild('addressplacesRef') addressPlacesRef: GooglePlaceDirective;

  // Overlay for Appointment & Group Call
  @ViewChild('appointmentPortalContent') appointmentPortalContent: TemplateRef<
    unknown
  >;
  @ViewChild('groupCallPortalContent') groupCallPortalContent: TemplateRef<
    unknown
  >;
  overlayRef: OverlayRef;
  templatePortal: TemplatePortal;
  event: any;
  overlayCloseSubscription: Subscription;
  selectedAppointment;
  selectedGroupCall;
  loadedAppointments = {};
  loadedGroupCalls = {};
  loadingAppointment = false;
  loadingGroupCall = false;
  appointmentLoadSubscription: Subscription;
  appointmentUpdateSubscription: Subscription;
  groupCallLoadSubscription: Subscription;

  data = {
    materials: [],
    notes: [],
    emails: [],
    texts: [],
    appointments: [],
    tasks: [],
    deals: [],
    users: [],
    phone_logs: []
  };
  dataObj = {
    materials: {},
    notes: {},
    emails: {},
    texts: {},
    appointments: {},
    tasks: {},
    deals: {},
    users: {},
    phone_logs: {}
  };
  materialMediaSending = {}; // video_send_activity: email_id || text_id
  materialSendingType = {}; // material_send_activity: media_type
  groups = []; // detail information about group
  dGroups = []; // group ID Array to display detail data
  showingMax = 4; // Max Limit to show the detail data
  isPackageAutomation = true;
  isPackageGroupEmail = true;
  isPackageText = true;
  isPackageDialer = true;
  disableTabs = [];

  // Call Log Recording Play
  recordingData = {};
  loadingRecord = false;
  selectedRecord = '';
  playingRecord = false;
  @ViewChild('audioRef') recordAudio: ElementRef;
  currentPlayTime = 0;
  callLabel = '';

  emailDialog = null;
  textDialog = null;
  createEmailDraftSubscription: Subscription;
  updateEmailDraftSubscription: Subscription;
  removeEmailDraftSubscription: Subscription;
  createTextDraftSubscription: Subscription;
  updateTextDraftSubscription: Subscription;
  removeTextDraftSubscription: Subscription;
  draftSubscription: Subscription;
  draftEmail = new Draft();
  contactId = '';
  draftText = new Draft();

  loadTimelineSubscription: Subscription;
  timelines;
  tasks = [];
  activeRoot: any;
  activePrevRoot: any;

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    public contactService: ContactService,
    public userService: UserService,
    private dialerService: DialerService,
    private noteService: NoteService,
    private taskService: TaskService,
    private storeService: StoreService,
    private overlayService: OverlayService,
    private handlerService: HandlerService,
    private helperSerivce: HelperService,
    private dealsService: DealsService,
    private automationService: AutomationService,
    private appointmentService: AppointmentService,
    private teamService: TeamService,
    private viewContainerRef: ViewContainerRef,
    private toastr: ToastrService,
    private element: ElementRef,
    private overlay: Overlay,
    private emailService: EmailService,
    public materialService: MaterialService,
    private clipboard: Clipboard
  ) {
    this.teamService.loadAll(false);
    this.appointmentService.loadCalendars(true);
    this.pageContacts = this.storeService.pageContacts.getValue();
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      try {
        // this.timezone = JSON.parse(user.time_zone_info);
        if (user._id) {
          const timezone = getCurrentTimezone();
          this.timezone = { zone: timezone };
          this.isPackageAutomation = user.automation_info?.is_enabled;
          this.isPackageGroupEmail = user.email_info?.mass_enable;
          this.isPackageText = user.text_info?.is_enabled;
          this.isPackageDialer = user.dialer_info?.is_enabled;

          this.disableTabs = [];
          if (this.isPackageDialer) {
            this.tabs = [
              { icon: '', label: 'Activity', id: 'all' },
              { icon: '', label: 'Notes', id: 'note' },
              { icon: '', label: 'Emails', id: 'email' },
              { icon: '', label: 'Texts', id: 'text' },
              { icon: '', label: 'Calls', id: 'phone_log' },
              { icon: '', label: 'Meetings', id: 'appointment' },
              // { icon: '', label: 'Group Calls', id: 'group_call' },
              { icon: '', label: 'Tasks', id: 'follow_up' },
              { icon: '', label: 'Deals', id: 'deal' }
            ];
          }
          if (!this.isPackageAutomation) {
            this.disableTabs.push({
              icon: '',
              label: 'Appointments',
              id: 'appointment'
            });
            const index = this.tabs.findIndex(
              (item) => item.id === 'appointment'
            );
            if (index >= 0) {
              this.tabs.splice(index, 1);
            }
          }
          if (!this.isPackageText) {
            this.disableTabs.push({ icon: '', label: 'Texts', id: 'text' });
            const index = this.tabs.findIndex((item) => item.id === 'text');
            if (index >= 0) {
              this.tabs.splice(index, 1);
            }
          }
        }
      } catch (err) {
        const timezone = getCurrentTimezone();
        this.timezone = { zone: timezone };
      }
      this.checkSharable();

      this.userId = user._id;
    });

    this.teamSubscription && this.teamSubscription.unsubscribe();
    this.teamSubscription = this.teamService.teams$.subscribe((teams) => {
      this.checkSharable();

      teams.forEach((team) => {
        if (team.editors && team.editors.length) {
          team.editors.forEach((e) => {
            this.editors[e._id] = new User().deserialize(e);
          });
        }
      });
    });

    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      if (this._id !== params['id']) {
        this.contact = new ContactDetail();
        this.originContact = new ContactDetail();
        this.selectedContact = new ContactDetail();

        this.clearContact();
        this._id = params['id'];
        this.loadContact(this._id);
        this.loadTimeline(this._id);
        this.loadTasks(this._id);
      }
    });

    this.appointmentUpdateSubscription &&
      this.appointmentUpdateSubscription.unsubscribe();
    this.appointmentUpdateSubscription = this.appointmentService.updateCommand$.subscribe(
      (data) => {
        if (data) {
          if (data.command === 'delete') {
            const deleteEventId = data.data.recurrence_id || data.data.event_id;
            // remove from activity list && detail data
            let idToDelete;
            for (const key in this.dataObj.appointments) {
              if (this.dataObj.appointments[key].event_id == deleteEventId) {
                idToDelete = key;
                delete this.dataObj.appointments[key];
              }
            }
            this.data.appointments = Object.values(this.dataObj.appointments);
            this.changeTab(this.tab);
            const deleteActivityIds = [];
            this.mainTimelines.some((e) => {
              if (e.appointments === idToDelete) {
                deleteActivityIds.push(e._id);
                return true;
              }
              return false;
            });
            if (deleteActivityIds.length) {
              this.contactService.deleteContactActivity(deleteActivityIds);
            }
          } else if (data.command === 'update') {
            const event = data.data;
            const eventId = event.recurrence_id || event.event_id;
            delete this.loadedAppointments[eventId];
            this.contactService.addLatestActivity(3);
          } else if (data.command === 'accept') {
            const acceptData = data.data;
            const acceptEventId =
              acceptData.recurrence_id || acceptData.event_id;
            delete this.loadedAppointments[acceptEventId];
          } else if (data.command === 'decline') {
            const declineData = data.data;
            const declineEventId =
              declineData.recurrence_id || declineData.event_id;
            delete this.loadedAppointments[declineEventId];
          }
        }
      }
    );
  }

  ngOnInit(): void {
    this.contactId = this.route.snapshot.params.id;
    if (this.handlerService.previousUrl || this.handlerService.currentUrl) {
      if (
        this.handlerService.previousUrl.includes('contacts') &&
        this.pageContacts.length
      ) {
        this.isEnable = true;
      }
    }
    if (this.isEnable) {
      this.currentPage = this.storeService.contactPage.getValue();
      this.pageSize = this.contactService.pageSize.getValue();
      this.pageCount = Math.ceil(
        this.contactService.total.getValue() / this.pageSize
      );
      const index = this.pageContacts.findIndex(
        (contact) => contact._id === this._id
      );
      if (
        index == this.pageContacts.length - 1 &&
        this.currentPage == this.pageCount
      ) {
        this.isLast = true;
      }
      if (index == 0 && this.currentPage == 1) {
        this.isFirst = true;
      }
    }
    this.storeService.selectedContact$.subscribe((contact) => {
      this.contact = contact;
      this.originContact = new ContactDetail().deserialize({ ...contact });
      if (
        this.contact.tags &&
        this.contact.tags.indexOf('unsubscribed') !== -1
      ) {
        this.isUnsubscribed = true;
      }
      this.selectedContact = new Contact().deserialize({ ...contact });

      if (this.contact && this.contact._id) {
        delete this.selectedContact['activity'];
        delete this.selectedContact['automation'];
        delete this.selectedContact['next'];
        delete this.selectedContact['prev'];
        delete this.selectedContact['details'];
        this.data.materials = [];
        this.data.notes = [];
        this.data.emails = [];
        this.data.texts = [];
        this.data.appointments = [];
        this.data.tasks = [];
        this.data.deals = [];
        this.data.users = [];
        this.data.phone_logs = [];
        this.dataObj.materials = {};
        this.dataObj.notes = {};
        this.dataObj.emails = {};
        this.dataObj.texts = {};
        this.dataObj.appointments = {};
        this.dataObj.tasks = {};
        this.dataObj.deals = {};
        this.dataObj.users = {};
        this.dataObj.phone_logs = {};

        if (contact._id && contact.details) {
          this.data.materials = contact.details.materials || [];
          this.data.notes = contact.details.notes || [];
          this.data.emails = contact.details.emails || [];
          this.data.texts = contact.details.texts || [];
          this.data.appointments = contact.details.appointments || [];
          this.data.tasks = contact.details.tasks || [];
          this.data.deals = contact.details.deals || [];
          this.data.users = contact.details.users || [];
          this.data.phone_logs = contact.details.phone_logs || [];

          this.materialMediaSending = {};
          this.materialSendingType = {};
          contact.activity.forEach((e) => {
            if (e.emails && e.emails.length) {
              this.materialMediaSending[e._id] = {
                type: 'emails',
                id: e.emails
              };
              return;
            }
            if (e.texts && e.texts.length) {
              this.materialMediaSending[e._id] = { type: 'texts', id: e.texts };
              return;
            }
            if (
              e.type === 'videos' ||
              e.type === 'images' ||
              e.type === 'pdfs'
            ) {
              if (e.content.indexOf('email') !== -1) {
                this.materialSendingType[e._id] = 'emails';
              } else {
                this.materialSendingType[e._id] = 'texts';
              }
              return;
            }
          });

          this.groupActivities();
          this.getActivityCount();
        }
        for (const key in this.data) {
          if (key !== 'materials') {
            this.data[key].forEach((e) => {
              this.dataObj[key][e._id] = e;
            });
          } else {
            this.data[key].forEach((e) => {
              e.material_type = 'video';
              if (e.type) {
                if (e.type.indexOf('pdf') !== -1) {
                  e.material_type = 'pdf';
                } else if (e.type.indexOf('image') !== -1) {
                  e.material_type = 'image';
                }
              } else {
                if (e.thumbnail) {
                  e.material_type = 'video';
                } else if (e.url.legnth > 1) {
                  e.material_type = 'image';
                } else {
                  e.material_type = 'pdf';
                }
              }
              this.dataObj[key][e._id] = e;
            });
          }
        }

        if (this.tab.id !== 'all') {
          this.changeTab(this.tab);
        }

        this.getLatestCallLabel();

        if (this.contact.additional_field) {
          for (const key in this.contact.additional_field) {
            if (
              this.lead_fields.findIndex(
                (lead_field) => lead_field.name == key
              ) < 0
            ) {
              this.extra_additional_fields[key] = this.contact.additional_field[
                key
              ];
            }
          }
        }
      }
    });

    this.handlerService.pageName.next('detail');
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        this.lead_fields = _garbage.additional_fields.map((e) => e);
      }
    );

    this.routerHandle();
  }

  // ngAfterViewInit(): void {
  //   const signature =
  //     'q6Oggy7to8EEgSyJTwvinjslHitdRjuC76UEtw8kxyGRDAlF1ogg3hc4WzW2vnzc';
  //   const payload = {
  //     userId: '704e070acb0761ed0382211136fdd457'
  //   };
  //   const issuer = 'k8d8BvqFWV9rSTwZyGed64Dc0SbjSQ6D';
  //   const token = jwt.sign(payload, signature, { issuer, expiresIn: 3600 });

  //   init(token);
  // }

  ngOnDestroy(): void {
    this.handlerService.pageName.next('');
    this.storeService.selectedContact.next(new ContactDetail());

    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.teamSubscription && this.teamSubscription.unsubscribe();
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
    this.garbageSubscription && this.garbageSubscription.unsubscribe();

    this.contactService.contactConversation.next(null);
  }

  /**
   * Load Contact Detail information
   * @param _id: Contact id to load
   */
  loadContact(_id: string): void {
    this.contactService.read(_id);
  }

  loadTimeline(_id: string): void {
    this.loadTimelineSubscription &&
      this.loadTimelineSubscription.unsubscribe();
    this.loadTimelineSubscription = this.contactService
      .loadTimeline(_id)
      .subscribe((res) => {
        if (res) {
          this.timelines = res;
          this.timeLineArrangement();
        }
      });
  }

  /**
   * Load the tasks list (campaign, schedule, recurring email/texts/automation)
   * @param _id : contact id
   */
  loadTasks(_id: string): void {
    this.contactService.loadTasks(_id).subscribe((res) => {
      let tasks = [];
      let automations = [];
      const automationDic = {};
      res.forEach((e) => {
        Object.keys(e).forEach((key) => {
          if (key !== 'automations') {
            tasks = [...tasks, ...e[key]];
          } else {
            automations = e[key];
          }
        });
      });
      automations.forEach((e) => {
        automationDic[e._id] = e;
      });
      this.tasks = tasks;
      this.tasks.forEach((e) => {
        if (e.campaign) {
          e.task_type = 'campaign';
          e.task_original_type = 'campaign';
        } else if (e.type === 'assign_automation') {
          e.task_type = 'Assign Automation';
          e.task_original_type = 'automation';
          const automation_id = e.action.automation_id || e.action.automation;
          if (automation_id && automationDic[automation_id]) {
            e.details = automationDic[automation_id];
          }
        } else if (e.type === 'send_email') {
          e.task_original_type = 'email';
          if (e.set_recurrence && e.recurrence_mode) {
            e.task_type = e.recurrence_mode + ' recurring email';
          } else if (e.set_recurrence === false) {
            e.task_type = 'Scheduled email';
          } else {
            e.task_type = 'Email';
          }
        } else if (e.type === 'send_text') {
          e.task_original_type = 'text';
          if (e.set_recurrence && e.recurrence_mode) {
            e.task_type = e.recurrence_mode + ' recurring text';
          } else if (e.set_recurrence === false) {
            e.task_type = 'Scheduled text';
          }
        }
      });
      if (this.tasks.length) {
        this.changeTabs(
          {
            icon: '',
            label: 'TO-DO',
            id: 'tasks'
          },
          'insert'
        );
      }
    });
  }

  /**
   * Remove the current contact from task
   * @param task : Task object
   */
  removeContactFromTask(task: any): void {
    const payload = {
      contact: this.contactId,
      task: task._id,
      type: task.task_original_type === 'campaign' ? 'campaign' : 'task'
    };
    this.contactService.removeFromTask(payload).subscribe((res) => {
      if (res.data) {
        this.toastr.show('Deleted this contact from the task');
        const task_index = this.tasks.findIndex((e) => task._id === e._id);
        if (task_index !== -1) {
          this.tasks.splice(task_index, 1);
        }
      }
    });
  }

  /**
   * Go to Task Detail Page
   * @param task : Task object
   */
  goToTaskDetail(task: any): void {
    switch (task.task_original_type) {
      case 'email':
        this.router.navigate(['/email-queue/' + task.process]);
        break;
      case 'text':
        this.router.navigate(['/text-queue/' + task.process]);
        break;
      case 'automation':
        this.router.navigate(['/automation-queue/' + task.process]);
        break;
      case 'campaign':
        this.router.navigate(['/campaign/bulk/' + task.campaign?._id]);
        break;
    }
  }

  /**
   * Change the tabs
   * @param tab : Tab Item
   * @param mode : 'remove' | 'insert'
   */
  changeTabs(tab: TabItem, mode: string): void {
    const index = this.tabs.findIndex((e) => e.id === tab.id);
    if (mode === 'insert') {
      if (index === -1) {
        this.tabs.push(tab);
      }
    } else if (mode === 'remove') {
      if (index !== -1) {
        this.tabs.splice(index, 1);
      }
    }
  }

  clearContact(): void {
    this.groupActions = {};
    this.mainTimelines = [];
    this.showingDetails = [];
    this.activityCounts = {
      all: 0,
      note: 0,
      email: 0,
      text: 0,
      appointment: 0,
      group_call: 0,
      follow_up: 0,
      deal: 0,
      phone_log: 0
    };
  }

  /**
   * Group Activities
   */
  groupActivities(): void {
    this.groupActions = {};
    this.mainTimelines = [];
    this.groups = [];
    for (let i = this.contact.activity.length - 1; i >= 0; i--) {
      try {
        const e = this.contact.activity[i];
        if (e.type.indexOf('tracker') !== -1) {
          e.activity = e[e.type].activity;
        }
        const groupData = this.generateUniqueId(e);
        if (!groupData) {
          continue;
        }
        const { type, group, media, material } = groupData;
        if (this.groupActions[group]) {
          this.groupActions[group].push(e);
        } else {
          e.group_id = group;
          this.groupActions[group] = [e];
          this.groups.push({ type, group, media, material });
        }
      } catch (err) {
        console.log('groupizing is failed');
      }
    }
    for (let i = 0; i < this.groups.length; i++) {
      if (this.groups[i].type === 'emails' || this.groups[i].type === 'texts') {
        const latest = this.groupActions[this.groups[i]['group']][0];
        if (
          latest.type === 'videos' ||
          latest.type === 'pdfs' ||
          latest.type === 'images'
        ) {
          const activity = this.groupActions[this.groups[i]['group']].filter(
            (e) => e.type === 'emails' || e.type === 'texts'
          )[0];
          activity && this.mainTimelines.push(activity);
        } else {
          latest && this.mainTimelines.push(latest);
        }
      } else {
        this.groupActions[this.groups[i]['group']][0] &&
          this.mainTimelines.push(
            this.groupActions[this.groups[i]['group']][0]
          );
      }
    }
  }

  getActivityCount(): void {
    this.activityCounts = {
      all: 0,
      note: 0,
      email: 0,
      text: 0,
      appointment: 0,
      group_call: 0,
      follow_up: 0,
      deal: 0,
      phone_log: 0
    };
    if (this.mainTimelines.length > 0) {
      this.mainTimelines.forEach((activity) => {
        if (activity.type == 'contacts') {
          this.activityCounts.all++;
        }
        if (activity.type == 'notes') {
          this.activityCounts.note++;
          this.activityCounts.all++;
        }
        if (
          activity.type == 'emails' ||
          activity.type == 'email_trackers' ||
          activity.type == 'videos' ||
          activity.type == 'video_trackers' ||
          activity.type == 'pdfs' ||
          activity.type == 'pdf_trackers' ||
          activity.type == 'images' ||
          activity.type == 'image_trackers'
        ) {
          this.activityCounts.email++;
          this.activityCounts.all++;
        }
        if (activity.type == 'texts') {
          this.activityCounts.text++;
          this.activityCounts.all++;
        }
        if (activity.type == 'appointments') {
          this.activityCounts.appointment++;
          this.activityCounts.all++;
        }
        if (activity.type == 'team_calls') {
          this.activityCounts.group_call++;
          this.activityCounts.all++;
        }
        if (activity.type == 'follow_ups') {
          this.activityCounts.follow_up++;
          this.activityCounts.all++;
        }
        if (activity.type == 'deals') {
          this.activityCounts.deal++;
          this.activityCounts.all++;
        }
        if (activity.type == 'phone_logs') {
          this.activityCounts.phone_log++;
          this.activityCounts.all++;
        }
      });
    }
  }

  /**
   * Generate the unique group id that the activity would be included
   * @param activity : Activity Detail Information
   */
  generateUniqueId(activity: DetailActivity): any {
    const trackerActivityTypes = {
      video_trackers: 'videos',
      pdf_trackers: 'pdfs',
      image_trackers: 'images'
    };
    switch (activity.type) {
      case 'emails':
      case 'texts':
      case 'notes':
      case 'appointments':
      case 'follow_ups':
      case 'phone_logs':
      case 'deals':
        return {
          type: activity.type,
          group: activity[activity.type]
        };
      case 'video_trackers':
      case 'pdf_trackers':
      case 'image_trackers':
        if (this.materialMediaSending[activity.activity]) {
          return {
            type: this.materialMediaSending[activity.activity].type,
            group: this.materialMediaSending[activity.activity].id
          };
        } else {
          return {
            type: trackerActivityTypes[activity.type],
            group: activity.activity,
            material: activity[trackerActivityTypes[activity.type]],
            media: this.materialSendingType[activity.activity]
          };
        }
      case 'email_trackers':
        return {
          type: 'emails',
          group: activity.emails
        };
      case 'text_trackers':
        return {
          type: 'texts',
          group: activity.texts
        };
      case 'videos':
      case 'pdfs':
      case 'images':
        if (activity.emails && activity.emails.length) {
          return {
            type: 'emails',
            group: activity.emails
          };
        }
        if (activity.texts && activity.texts.length) {
          return {
            type: 'texts',
            group: activity.texts
          };
        }
        const media = activity.content.indexOf('email') ? 'emails' : 'texts';
        return {
          type: activity.type,
          group: activity._id,
          media,
          material: activity[activity.type]
        };
      case 'users':
        return {
          type: 'users',
          group: activity.users
        };
      case 'contacts':
        return {
          type: 'contacts',
          group: activity.contacts
        };
    }
    // if (!activity.activity_detail) {
    //   if (activity.type === 'follow_ups' && activity.follow_ups) {
    //     return activity.follow_ups;
    //   }
    //   return activity._id;
    // }
    // let material_id;
    // switch (activity.type) {
    //   case 'video_trackers':
    //   case 'pdf_trackers':
    //   case 'image_trackers':
    //   case 'email_trackers':
    //     const material_type = activity.type.split('_')[0];
    //     material_id = activity.activity_detail[material_type];
    //     if (material_id instanceof Array) {
    //       material_id = material_id[0];
    //     }
    //     let activity_id = activity.activity_detail['activity'];
    //     if (activity_id instanceof Array) {
    //       activity_id = activity_id[0];
    //     }
    //     return `${material_id}_${activity_id}`;
    //   case 'videos':
    //   case 'pdfs':
    //   case 'images':
    //   case 'emails':
    //     material_id = activity.activity_detail['_id'];
    //     if (activity.type !== 'emails') {
    //       activity.activity_detail['content'] = activity.content;
    //       activity.activity_detail['subject'] = activity.subject;
    //       activity.activity_detail['updated_at'] = activity.updated_at;
    //       this.sentHistory[activity._id] = material_id;
    //     }
    //     const group_id = `${material_id}_${activity._id}`;
    //     this.detailData[group_id] = activity.activity_detail;
    //     this.detailData[group_id]['data_type'] = activity.type;
    //     this.detailData[group_id]['group_id'] = group_id;
    //     this.detailData[group_id]['emails'] = activity.emails;
    //     this.detailData[group_id]['texts'] = activity.texts;
    //     return group_id;
    //   case 'texts':
    //     material_id = activity.activity_detail['_id'];
    //     const text_group_id = `${material_id}_${activity._id}`;
    //     this.detailData[text_group_id] = activity.activity_detail;
    //     this.detailData[text_group_id]['data_type'] = activity.type;
    //     this.detailData[text_group_id]['group_id'] = text_group_id;
    //     this.detailData[text_group_id]['emails'] = activity.emails;
    //     this.detailData[text_group_id]['texts'] = activity.texts;
    //     if (activity.content.indexOf('sent') !== -1) {
    //       this.detailData[text_group_id]['sent'] = true;
    //     }
    //     return text_group_id;
    //   default:
    //     const detailKey = activity.activity_detail['_id'];
    //     this.detailData[detailKey] = activity.activity_detail;
    //     this.detailData[detailKey]['data_type'] = activity.type;
    //     return detailKey;
    // }
  }

  /**
   * Go to Contact List Page
   */
  goToBack(): void {
    // this.location.back();
    if (this.contact._id && this.nameEditable) {
      this.checkAndSave();
    }
    const prevUrl = this.handlerService.previousUrl;
    if (prevUrl) {
      if (prevUrl.includes('/contacts/')) {
        this.router.navigate(['/contacts']);
      } else {
        this.router.navigate([prevUrl]);
      }
    } else {
      this.router.navigate(['/contacts']);
    }
  }

  /**
   * Load Previous Contact Detail Information
   */
  prevContact(): void {
    if (this.isFirst) {
      return;
    }
    if (this.isLast) {
      this.isLast = !this.isLast;
    }
    let index = this.pageContacts.findIndex(
      (contact) => contact._id === this._id
    );
    index -= 1;
    if (index > 0) {
      this.nextContactImple(index);
    } else if (index == 0) {
      if (this.currentPage == 1) {
        this.isFirst = true;
      }
      this.nextContactImple(index);
    } else {
      let skip = (this.currentPage - 2) * this.pageSize;
      skip = skip < 0 ? 0 : skip;
      this.contactService.loadImpl(skip).subscribe((res) => {
        if (res) {
          this.pageContacts = res.contacts;
          index = this.pageContacts.length - 1;
          this.currentPage -= 1;
          this.storeService.contactPage.next(this.currentPage);
          this.nextContactImple(index);
        }
      });
    }
  }

  /**
   * Load Next Contact Detail Information
   */
  nextContact(): void {
    if (this.isLast) {
      return;
    }
    if (this.isFirst) {
      this.isFirst = !this.isFirst;
    }
    let index = this.pageContacts.findIndex(
      (contact) => contact._id === this._id
    );
    index += 1;
    if (index > this.pageContacts.length - 1) {
      index = 0;
      let skip = this.currentPage * this.pageSize;
      skip = skip < 0 ? 0 : skip;
      this.contactService.loadImpl(skip).subscribe((res) => {
        if (res) {
          this.pageContacts = res.contacts;
          this.currentPage += 1;
          this.storeService.contactPage.next(this.currentPage);
          this.nextContactImple(index);
        }
      });
    } else if (index == this.pageContacts.length - 1) {
      if (this.currentPage == this.pageCount) {
        this.isLast = true;
      }
      this.nextContactImple(index);
    } else {
      this.nextContactImple(index);
    }
  }

  nextContactImple(index: number): void {
    this.contact = new ContactDetail();
    this.originContact = new ContactDetail();
    if (this.contact['cell_phone']) {
      this.contact_phone = this.contact['cell_phone'];
    }
    if (this.contact['secondary_phone']) {
      this.second_contact_phone = this.contact['secondary_phone'];
    }
    this.selectedContact = new ContactDetail();
    this.clearContact();
    this._id = this.pageContacts[index]._id;
    this.loadContact(this._id);
    this.loadTimeline(this._id);
    this.location.replaceState(`/contacts/${this._id}`);
  }

  /**
   * Delete the current contact
   */
  deleteContact(): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Delete contact',
          message: 'Are you sure to delete this contact?',
          confirmLabel: 'Delete'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.contactService
            .bulkDelete([this.contact._id])
            .subscribe((status) => {
              if (!status) {
                return;
              }
              this.storeService.selectedContact.next(new ContactDetail());
              this.goToBack();
            });
        }
      });
  }

  openCall(): void {
    const contacts = [
      {
        contactId: this.contact._id,
        number: this.contact.cell_phone,
        name: this.contact.fullName
      }
    ];
    this.handlerService.callCommand.next({
      contacts,
      type: 'single'
    });
  }

  /**
   * Open dialog to merge
   */
  openMergeContactDlg(): void {
    this.dialog
      .open(ContactMergeComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '700px',
        data: {
          contact: this.selectedContact
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.handlerService.reload$();
        }
      });
  }

  /**
   * Open the Campagin Dialog to assign the curent contact to the compaign list.
   */
  openCampaignAssignDlg(): void {}

  /**
   * Open the Contact Edit Dialog
   */
  editContacts(type: string, evt: any): void {
    if (evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }
    this.dialog
      .open(ContactEditComponent, {
        width: '98vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          contact: {
            ...this.contact
          },
          type: type
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.contact = new ContactDetail().deserialize({ ...res });
          if (type == 'main') {
            // this.toastr.success('Successfully updated contact details.');
          } else {
            // this.toastr.success(
            //   'Successfully updated secondary contact details'
            // );
          }
          // this.reloadLatest();
        }
      });
  }

  editAdditional(event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.dialog
      .open(AdditionalEditComponent, {
        width: '98vw',
        maxWidth: '600px',
        data: {
          contact: {
            ...this.selectedContact
          },
          lead_fields: this.lead_fields
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.success) {
          // this.toastr.success('Successfully updated additional information.');
          this.contact.additional_field = res.additional_field;
          this.extra_additional_fields = {};
          for (const key in this.contact.additional_field) {
            if (
              this.lead_fields.findIndex(
                (lead_field) => lead_field.name == key
              ) < 0
            ) {
              this.extra_additional_fields[key] = this.contact.additional_field[
                key
              ];
            }
          }
          this.reloadLatest();
        }
      });
  }

  /**
   * Share Contact to Team
   */
  shareContact(): void {}

  /**
   * Open dialog to create new group call
   */
  openGroupCallDlg(): void {
    const contact = new Contact().deserialize({
      _id: this.contact._id,
      first_name: this.contact.first_name,
      last_name: this.contact.last_name,
      email: this.contact.email,
      cell_phone: this.contact.cell_phone
    });

    this.dialog
      .open(JoinCallRequestComponent, {
        width: '98vw',
        maxWidth: '530px',
        height: 'auto',
        disableClose: true,
        data: {
          contacts: [contact]
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.contactService.addLatestActivity(4);
        }
      });
  }

  /**
   * Open Dialog to create new appointment
   */
  openAppointmentDlg(): void {
    // Check Calendars
    const calendars = this.appointmentService.calendars.getValue();
    if (!calendars || !calendars.length) {
      this.dialog.open(DetailErrorComponent, {
        width: '98vw',
        maxWidth: '420px',
        data: {
          errorCode: 407
        }
      });
      return;
    }

    const contact = new Contact().deserialize({
      _id: this.contact._id,
      first_name: this.contact.first_name,
      last_name: this.contact.last_name,
      email: this.contact.email,
      cell_phone: this.contact.cell_phone
    });

    if (!contact.email) {
      this.toastr.error(
        `This contact doesn't have a email.`,
        `Can't create the new appointment`
      );
      return;
    }

    this.dialog
      .open(CalendarDialogComponent, {
        width: '100vw',
        maxWidth: '600px',
        maxHeight: '700px',
        data: {
          contacts: [contact]
        }
      })
      .afterClosed()
      .subscribe((event) => {
        if (event) {
          this.contactService.addLatestActivity(4);
        }
      });
  }

  /**
   * Open Dialog to create new task
   */
  openTaskDlg(): void {
    this.dialog.open(TaskCreateComponent, {
      ...DialogSettings.TASK,
      data: {
        contacts: [this.selectedContact]
      }
    });
  }

  openSendEmail(): void {
    if (!this.emailDialog) {
      this.draftSubscription && this.draftSubscription.unsubscribe();
      if (this.contactId) {
        const draftData = {
          contact: this.contactId,
          type: 'contact_email'
        };
        this.draftSubscription = this.emailService
          .getDraft(draftData)
          .subscribe((res) => {
            if (res) {
              this.draftEmail = res;
            }
            this.emailDialog = this.dialog.open(SendEmailComponent, {
              position: {
                bottom: '0px',
                right: '0px'
              },
              width: '100vw',
              panelClass: 'send-email',
              backdropClass: 'cdk-send-email',
              disableClose: false,
              data: {
                contact: this.contact,
                type: 'contact_email',
                draft: this.draftEmail
              }
            });

            const openedDialogs = this.storeService.openedDraftDialogs.getValue();
            if (openedDialogs && openedDialogs.length > 0) {
              for (const dialog of openedDialogs) {
                if (dialog._overlayRef._host.classList.contains('top-dialog')) {
                  dialog._overlayRef._host.classList.remove('top-dialog');
                }
              }
            }
            this.emailDialog._overlayRef._host.classList.add('top-dialog');
            this.storeService.openedDraftDialogs.next([
              ...openedDialogs,
              this.emailDialog
            ]);

            this.emailDialog.afterClosed().subscribe((response) => {
              const dialogs = this.storeService.openedDraftDialogs.getValue();
              if (dialogs && dialogs.length > 0) {
                const index = dialogs.findIndex(
                  (item) => item.id === this.emailDialog.id
                );
                if (index >= 0) {
                  dialogs.splice(index, 1);
                  this.storeService.openedDraftDialogs.next([...dialogs]);
                }
              }
              this.emailDialog = null;
              if (response && response.status) this.loadTasks(this._id);
              if (response && response.draft) {
                this.saveEmailDraft(response.draft);
                this.storeService.emailContactDraft.next({});
              }
              if (response && response.send) {
                const sendEmail = response.send;
                if (sendEmail._id) {
                  this.emailService
                    .removeDraft(sendEmail._id)
                    .subscribe((result) => {
                      if (result) {
                        this.draftEmail = new Draft();
                        this.storeService.emailContactDraft.next({});
                      }
                    });
                }
              }
            });
          });
      }
    } else {
      const openedDialogs = this.storeService.openedDraftDialogs.getValue();
      if (openedDialogs && openedDialogs.length > 0) {
        for (const dialog of openedDialogs) {
          if (dialog._overlayRef._host.classList.contains('top-dialog')) {
            dialog._overlayRef._host.classList.remove('top-dialog');
          }
        }
      }
      this.emailDialog._overlayRef._host.classList.add('top-dialog');
    }
  }

  openSendText(): void {
    if (!this.textDialog) {
      this.draftSubscription && this.draftSubscription.unsubscribe();
      if (this.contactId) {
        const draftData = {
          contact: this.contactId,
          type: 'contact_text'
        };
        this.draftSubscription = this.emailService
          .getDraft(draftData)
          .subscribe((res) => {
            if (res) {
              this.draftText = res;
            }
            this.textDialog = this.dialog.open(SendTextComponent, {
              position: {
                bottom: '0px',
                right: '0px'
              },
              width: '100vw',
              panelClass: 'send-email',
              backdropClass: 'cdk-send-email',
              disableClose: false,
              data: {
                type: 'single',
                contact: this.contact,
                draft_type: 'contact_text',
                draft: this.draftText
              }
            });

            const openedDialogs = this.storeService.openedDraftDialogs.getValue();
            if (openedDialogs && openedDialogs.length > 0) {
              for (const dialog of openedDialogs) {
                if (dialog._overlayRef._host.classList.contains('top-dialog')) {
                  dialog._overlayRef._host.classList.remove('top-dialog');
                }
              }
            }
            this.textDialog._overlayRef._host.classList.add('top-dialog');
            this.storeService.openedDraftDialogs.next([
              ...openedDialogs,
              this.textDialog
            ]);

            this.textDialog.afterClosed().subscribe((response) => {
              const dialogs = this.storeService.openedDraftDialogs.getValue();
              if (dialogs && dialogs.length > 0) {
                const index = dialogs.findIndex(
                  (item) => item.id === this.textDialog.id
                );
                if (index >= 0) {
                  dialogs.splice(index, 1);
                  this.storeService.openedDraftDialogs.next([...dialogs]);
                }
              }
              this.textDialog = null;
              if (response && response.status) this.loadTasks(this._id);
              if (response && response.draft) {
                this.saveTextDraft(response.draft);
                this.storeService.textContactDraft.next({});
              }
              if (response && response.send) {
                const sendText = response.send;
                if (sendText._id) {
                  this.emailService
                    .removeDraft(sendText._id)
                    .subscribe((result) => {
                      if (result) {
                        this.draftText = new Draft();
                        this.storeService.textContactDraft.next({});
                      }
                    });
                }
              }
            });
          });
      }
    } else {
      const openedDialogs = this.storeService.openedDraftDialogs.getValue();
      if (openedDialogs && openedDialogs.length > 0) {
        for (const dialog of openedDialogs) {
          if (dialog._overlayRef._host.classList.contains('top-dialog')) {
            dialog._overlayRef._host.classList.remove('top-dialog');
          }
        }
      }
      this.textDialog._overlayRef._host.classList.add('top-dialog');
    }
  }

  openDealDlg(): void {
    const contact = new Contact().deserialize({
      _id: this.contact._id,
      first_name: this.contact.first_name,
      last_name: this.contact.last_name,
      email: this.contact.email,
      cell_phone: this.contact.cell_phone
    });

    this.dialog
      .open(DealCreateComponent, {
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          contacts: [contact]
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.contactService.addLatestActivity(4);
        }
      });
  }

  checkSharable(): void {
    const userId = this.userService.profile.getValue()._id;
    const teams = this.teamService.teams.getValue();
    if (!teams || !teams.length) {
      this.sharable = false;
      return;
    }
    let isValid = false;
    teams.some((e) => {
      if (e.isActive(userId)) {
        isValid = true;
        return true;
      }
    });
    if (isValid) {
      this.sharable = true;
      return;
    }
  }

  openShareContactDlg(): void {
    if (this.sharable) {
      this.dialog.open(ContactShareComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          contacts: [this.contact]
        }
      });
    } else {
      this.dialog.open(NotifyComponent, {
        ...DialogSettings.ALERT,
        data: {
          title: 'Share Contact',
          message: 'You have no active teams.'
        }
      });
    }
  }
  /**************************************
   * Timeline Actions
   **************************************/
  changeTab(tab: TabItem): void {
    this.tab = tab;

    if (this.tab.id !== 'all') {
      this.showingDetails = [];
      if (tab.id === 'note') {
        this.showingDetails = [...this.data.notes];
        this.showingDetails.sort((a, b) => {
          if (new Date(a.updated_at + '') < new Date(b.updated_at + '')) {
            return 1;
          }
          return -1;
        });
        return;
      }
      if (tab.id === 'appointment') {
        this.showingDetails = [...this.data.appointments];
        this.showingDetails.sort((a, b) => {
          if (new Date(a.updated_at + '') < new Date(b.updated_at + '')) {
            return 1;
          }
          return -1;
        });
        return;
      }
      if (tab.id === 'follow_up') {
        this.changeSort(this.selectedTimeSort);
      }
      if (tab.id === 'phone_log') {
        this.showingDetails = [...this.data.phone_logs];
        this.showingDetails.sort((a, b) => {
          if (new Date(a.updated_at + '') < new Date(b.updated_at + '')) {
            return 1;
          }
          return -1;
        });
        return;
      }
      if (tab.id === 'deal') {
        this.showingDetails = [...this.data.deals];
        this.showingDetails.sort((a, b) => {
          if (new Date(a.updated_at + '') < new Date(b.updated_at + '')) {
            return 1;
          }
          return -1;
        });
        return;
      }
      if (tab.id === 'email') {
        this.contact.activity.forEach((e) => {
          if (
            (e.type === 'videos' || e.type === 'pdfs' || e.type === 'images') &&
            (!e.emails || !e.emails.length) &&
            (!e.texts || !e.texts.length)
          ) {
            if (e.content.indexOf('email') !== -1) {
              this.showingDetails.push({
                ...this.dataObj.materials[e[e.type]],
                activity_id: e._id,
                data_type: e.type,
                send_time: e.updated_at
              });
            }
          }
        });
        this.data.emails.forEach((e) => {
          this.showingDetails.push({
            ...e,
            data_type: 'emails',
            send_time: e.updated_at
          });
        });
        this.showingDetails.sort((a, b) =>
          a.send_time > b.send_time ? -1 : 1
        );
        return;
      }
      if (tab.id === 'text') {
        this.contact.activity.forEach((e) => {
          if (
            (e.type === 'videos' || e.type === 'pdfs' || e.type === 'images') &&
            (!e.emails || !e.emails.length) &&
            (!e.texts || !e.texts.length)
          ) {
            if (
              e.content.indexOf('sms') !== -1 ||
              e.content.indexOf('text') !== -1
            ) {
              this.showingDetails.push({
                ...this.dataObj.materials[e[e.type]],
                activity_id: e._id,
                data_type: e.type,
                send_time: e.created_at
              });
            }
          }
        });
        this.data.texts.forEach((e) => {
          this.showingDetails.push({
            ...e,
            data_type: 'texts',
            send_time: e.created_at
          });
        });
        this.showingDetails.sort((a, b) =>
          a.created_at > b.created_at ? -1 : 1
        );
        return;
      }
    }
  }

  changeActivityTypes(type: TabItem): void {
    this.activityType = type;
  }

  changeSort(timeSort: any): void {
    this.showingDetails = [...this.data.tasks];
    const today = moment().startOf('day');
    const weekDay = moment().startOf('week');
    this.selectedTimeSort = timeSort;
    // if (this.timezone.tz_name) {
    //   today = moment().tz(this.timezone.tz_name).startOf('day');
    //   weekDay = moment().tz(this.timezone.tz_name).startOf('week');
    // } else {
    //   today = moment().utcOffset(this.timezone.zone).startOf('day');
    //   weekDay = moment().utcOffset(this.timezone.zone).startOf('week');
    // }
    let start_date = today.clone();
    let end_date = today.clone();

    if (timeSort.id === 'future' || timeSort.id === 'all') {
      const last_recurrence = [];
      this.showingDetails = _.orderBy(
        this.showingDetails,
        ['due_date', 'updated_at'],
        ['asc', 'asc']
      ).filter((detail) => {
        if (timeSort.id === 'future') {
          start_date = weekDay.clone().add(2, 'week');
          if (moment(detail.due_date).isBefore(start_date)) {
            return false;
          }
        }
        if (detail.set_recurrence && !detail.due_date) {
          return false;
        } else if (
          detail.status !== 0 ||
          !detail.set_recurrence ||
          !detail.parent_follow_up
        ) {
          return true;
        } else {
          if (last_recurrence.includes(detail.parent_follow_up)) {
            return false;
          } else {
            last_recurrence.push(detail.parent_follow_up);
            return true;
          }
        }
      });
    }

    this.showingDetails = _.orderBy(
      this.showingDetails,
      ['updated_at', 'due_date'],
      ['desc', 'desc']
    );

    if (timeSort.id === 'overdue') {
      this.showingDetails = _.orderBy(
        this.showingDetails,
        ['due_date', 'updated_at'],
        ['desc', 'desc']
      );
    } else {
      this.showingDetails = _.orderBy(
        this.showingDetails,
        ['due_date', 'updated_at'],
        ['asc', 'asc']
      );
    }
    switch (this.selectedTimeSort.id) {
      case 'overdue':
        end_date = today.clone();
        this.showingDetails = this.showingDetails.filter(
          (detail) =>
            detail.due_date &&
            moment(detail.due_date).isBefore(end_date) &&
            !detail.status
        );
        break;
      case 'today':
        start_date = today.clone();
        end_date = today.clone().add(1, 'day');
        this.showingDetails = this.showingDetails.filter(
          (detail) =>
            detail.due_date &&
            moment(detail.due_date).isSameOrAfter(start_date) &&
            moment(detail.due_date).isBefore(end_date)
        );
        break;
      case 'tomorrow':
        start_date = today.clone().add('day', 1);
        end_date = today.clone().add(2, 'day');
        this.showingDetails = this.showingDetails.filter(
          (detail) =>
            detail.due_date &&
            moment(detail.due_date).isSameOrAfter(start_date) &&
            moment(detail.due_date).isBefore(end_date)
        );
        break;
      case 'this_week':
        start_date = weekDay.clone();
        end_date = weekDay.clone().add(1, 'week');
        this.showingDetails = this.showingDetails.filter(
          (detail) =>
            detail.due_date &&
            moment(detail.due_date).isSameOrAfter(start_date) &&
            moment(detail.due_date).isBefore(end_date)
        );
        break;
      case 'next_week':
        start_date = weekDay.clone().add(1, 'week');
        end_date = weekDay.clone().add(2, 'week');
        this.showingDetails = this.showingDetails.filter(
          (detail) =>
            detail.due_date &&
            moment(detail.due_date).isSameOrAfter(start_date) &&
            moment(detail.due_date).isBefore(end_date)
        );
        break;
    }
  }

  showMoreDetail(group_id): void {
    if (this.dGroups.length >= this.showingMax) {
      this.dGroups.shift();
    }
    this.dGroups.push(group_id);
  }
  hideMoreDetail(group_id): void {
    const pos = this.dGroups.indexOf(group_id);
    if (pos !== -1) {
      this.dGroups.splice(pos, 1);
    }
  }

  showDetail(event: any): void {
    const target: HTMLElement = <HTMLElement>event.target;
    const parent: HTMLElement = <HTMLElement>(
      target.closest('.main-history-item')
    );
    if (parent) {
      parent.classList.add('expanded');
    }
  }
  hideDetail(event: any): void {
    const target: HTMLElement = <HTMLElement>event.target;
    const parent: HTMLElement = <HTMLElement>(
      target.closest('.main-history-item')
    );
    if (parent) {
      parent.classList.remove('expanded');
    }
  }

  editTask(activity: any): void {
    const data = {
      ...activity,
      contact: { _id: this.contact._id }
    };

    this.dialog
      .open(TaskEditComponent, {
        width: '98vw',
        maxWidth: '394px',
        data: {
          task: new TaskDetail().deserialize(data)
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.status == 'deleted' && !res.deleted_all) {
          this.deleteTaskFromTasksArray(activity._id);
          this.contactService.deleteContactActivityByDetail(
            activity._id,
            'follow_ups'
          );
        }
        if (res && res.status == 'deleted' && res.deleted_all) {
          this.deleteRecurranceTasks(activity);
        }
      });
  }

  completeTask(activity: any): void {
    const taskId = activity._id;
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        position: { top: '100px' },
        data: {
          title: 'Complete Task',
          message: 'Are you sure to complete the task?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Complete',
          comment: {
            label: 'Task completion comment'
          }
        }
      })
      .afterClosed()
      .subscribe((confirm) => {
        if (confirm) {
          this.taskService
            .complete(taskId, confirm['comment'])
            .subscribe((res) => {
              this.editTaskComment(taskId, confirm['comment']);
              if (res) {
                this.handlerService.updateTaskInDetail$(res);
              }
            });
        }
      });
  }

  leaveTaskComment(task): void {
    const taskId = task._id;
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        position: { top: '100px' },
        data: {
          title: 'Leave task comment',
          message: 'Please leave the note about your task completion',
          cancelLabel: 'Cancel',
          confirmLabel: 'Leave',
          comment: {
            label: 'Task completion comment',
            required: false,
            value: task.comment || ''
          }
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res['comment']) {
          this.taskService
            .leaveComment(taskId, res['comment'])
            .subscribe((status) => {
              if (status) {
                this.editTaskComment(taskId, res['comment']);
              }
            });
        }
      });
  }

  editTaskComment(taskId: string, comment: string): void {
    this.data.tasks.some((e) => {
      if (e._id === taskId) {
        e.comment = comment;
        return true;
      }
    });
    this.dataObj.tasks[taskId].comment = comment;
  }

  archiveTask(activity: any): void {
    const taskId = activity._id;
    if (
      activity.set_recurrence &&
      activity.status !== 1 &&
      this.selectedTimeSort.id === 'all'
    ) {
      this.dialog
        .open(TaskRecurringDialogComponent, {
          disableClose: true,
          data: {
            title: 'Delete the recurring task.'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (!res) {
            return;
          }
          const include_recurrence = res.type == 'all';

          this.taskService
            .archive([activity], include_recurrence)
            .subscribe((status) => {
              if (status) {
                include_recurrence
                  ? this.deleteRecurranceTasks(activity)
                  : this.deleteTaskFromTasksArray(activity._id);
                this.changeTab(this.tab);
              }
            });
        });
    } else {
      this.dialog
        .open(ConfirmComponent, {
          ...DialogSettings.CONFIRM,
          data: {
            title: 'Archive Task',
            message: 'Are you sure to archive the task?',
            cancelLabel: 'Cancel',
            confirmLabel: 'Confirm'
          }
        })
        .afterClosed()
        .subscribe((confirm) => {
          if (confirm) {
            this.taskService.archive([activity]).subscribe((status) => {
              if (status) {
                this.deleteTaskFromTasksArray(taskId);
                this.contactService.deleteContactActivityByDetail(
                  taskId,
                  'follow_ups'
                );
                this.changeTab(this.tab);
              }
            });
          }
        });
    }
  }

  deleteRecurranceTasks(activity): void {
    const currentContact = this.storeService.selectedContact.getValue();

    const deleted = _.remove(
      this.data.tasks,
      (e) =>
        e.parent_follow_up === activity.parent_follow_up &&
        e.status === activity.status
    );

    deleted.forEach((e) => {
      delete this.dataObj.tasks[e._id];
    });
    _.remove(
      currentContact.activity,
      (ele) =>
        ele['follow_ups'] &&
        (ele['follow_ups'] === activity.parent_follow_up ||
          ele['follow_ups'][0] === activity.parent_follow_up)
    );

    currentContact.details['tasks'] = this.data.tasks;
    this.storeService.selectedContact.next(currentContact);
  }
  deleteTaskFromTasksArray(_id: string): void {
    _.remove(this.data.tasks, (e) => e._id === _id);
    delete this.dataObj.tasks[_id];
    this.handlerService.updateContactRelated$('tasks', this.data.tasks);
  }

  /**
   * Create Note
   */
  openNoteDlg(): void {
    this.dialog.open(NoteCreateComponent, {
      ...DialogSettings.NOTE,
      data: {
        contacts: [this.selectedContact]
      }
    });
  }

  createNote(): void {
    this.noteContent = '';
    this.emptyValue = true;
    const noteData = {
      assigned_contacts: [],
      contact: [this._id],
      content: '',
      user: [this.userId],
      _id: ''
    };
    this.showingDetails.unshift(noteData);
  }

  noteChange(evt: string): void {
    if (evt) {
      this.emptyValue = false;
    } else {
      this.emptyValue = true;
    }
  }

  addNote(): void {
    const data = {
      contact: this._id,
      content: this.noteContent
    };
    this.noteSaving = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();
    this.saveSubscription = this.noteService.create(data).subscribe((res) => {
      this.noteSaving = false;
      if (res) {
        this.data.notes.push(res);
        this.changeTab(this.tab);
        this.handlerService.activityAdd$([this._id], 'note');
        this.handlerService.registerActivity$(res);
        this.noteContent = '';
      }
    });
  }

  cancelNoteItem(detail: any): void {
    detail.editing = false;
  }
  cancelNote(): void {
    this.showingDetails.splice(0, 1);
  }
  /**
   * Edit the Note Content
   * @param detail : Note Detail
   */
  updateNoteItem(detail: any): void {
    detail.editing = true;
    this.noteContent = detail.content;
    if (!detail) {
      return;
    }
  }
  updateNoteDetail(detail: any): void {
    if (!detail) {
      return;
    }
    const data = {
      note: detail,
      contact: { _id: this.contact._id },
      contact_name: this.contact.fullName
    };
    this.dialog
      .open(NoteEditComponent, {
        width: '98vw',
        maxWidth: '394px',
        data
      })
      .afterClosed()
      .subscribe((note) => {
        if (note) {
          detail.content = note.content;
          this.mainTimelines.some((e) => {
            if (e.type !== 'notes') {
              return;
            }
            if (e.activity_detail && e.activity_detail._id === detail._id) {
              e.activity_detail.content = note.content;
              return true;
            }
          });
          // Update the Notes Array with new content
          this.updateNotesArray(detail._id, note.content);
          this.changeTab(this.tab);
        }
      });
  }
  updateNote(detail: any) {
    this.noteSaving = true;
    detail = { ...detail, content: this.noteContent };
    this.updateNoteSubscription && this.updateNoteSubscription.unsubscribe();
    this.updateNoteSubscription = this.noteService
      .update(detail._id, detail)
      .subscribe((res) => {
        if (res) {
          this.mainTimelines.some((e) => {
            if (e.type !== 'notes') {
              return;
            }
            if (e.activity_detail && e.activity_detail._id === detail._id) {
              e.activity_detail.content = this.noteContent;
              return true;
            }
          });
          this.updateNotesArray(detail._id, this.noteContent);
          this.changeTab(this.tab);
          this.noteSaving = false;
        }
      });
  }
  deleteNoteDetail(detail: any): void {
    this.dialog
      .open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Delete Note',
          message: 'Are you sure to delete the note?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm'
        }
      })
      .afterClosed()
      .subscribe((confirm) => {
        if (confirm) {
          const data = {
            contact: this.contact._id
          };
          this.noteService.delete(detail._id, data).subscribe((res) => {
            if (res) {
              // this.mainTimelines.some((e) => {
              //   if (e.type !== 'notes') {
              //     return;
              //   }
              //   if (e.activity_detail && e.activity_detail._id === detail._id) {
              //     e.activity_detail = null;
              //     return true;
              //   }
              // });
              // Remove the note from notes array
              this.deleteNoteFromNotesArray(detail._id);
              this.contactService.deleteContactActivityByDetail(
                detail._id,
                'notes'
              );
              this.changeTab(this.tab);
            }
          });
        }
      });
  }

  updateNotesArray(_id: string, content: string): void {
    this.data.notes.some((e) => {
      if (e._id === _id) {
        e.content = content;
        e.editing = false;
        return true;
      }
    });
  }
  deleteNoteFromNotesArray(_id: string): void {
    _.remove(this.data.notes, (e) => e._id === _id);
    delete this.dataObj.notes[_id];
    this.handlerService.updateContactRelated$('notes', this.data.notes);
  }
  openMaterialDlg(): any {
    const content = '';
    const materials = this.helperSerivce.getMaterials(content);
    const materialDialog = this.dialog.open(MaterialBrowserComponent, {
      width: '98vw',
      maxWidth: '940px',
      data: {
        hideMaterials: materials,
        title: 'Select material',
        multiple: false,
        onlyMine: false,
        buttonLabel: 'Select'
      }
    });
    materialDialog['_overlayRef']['_host'].classList.add('top-dialog');
    materialDialog.afterClosed().subscribe((res) => {
      if (res && res.materials && res.materials.length) {
        let url;
        let tempData;
        const material = res.materials[0];
        if (material.material_type == 'video') {
          tempData = {
            content: 'generated link',
            type: 'videos',
            contacts: this.contact._id,
            videos: [material._id]
          };
        } else if (material.material_type == 'pdf') {
          tempData = {
            content: 'generated link',
            type: 'pdfs',
            contacts: this.contact._id,
            pdfs: [material._id]
          };
        } else {
          tempData = {
            content: 'generated link',
            type: 'images',
            contacts: this.contact._id,
            images: [material._id]
          };
        }
        this.materialService.createActivity(tempData).subscribe((res) => {
          if (res) {
            const activity = res.data;
            if (material.material_type == 'video') {
              url = environment.website + '/video1/' + activity._id;
            } else if (material.material_type == 'pdf') {
              url = environment.website + '/pdf1/' + activity._id;
            } else if (material.material_type == 'image') {
              url = environment.website + '/image/' + activity._id;
            }
            this.clipboard.copy(url);
            this.toastr.success('Generated the trackable link to clipboard');
            this.reloadLatest();
          }
        });
      }
    });
  }

  /**************************************
   * Appointment Activity Relative Functions
   **************************************/
  getTime(start: any, end: any): any {
    const start_hour = new Date(start).getHours();
    const end_hour = new Date(end).getHours();
    const start_minute = new Date(start).getMinutes();
    const end_minute = new Date(end).getMinutes();
    const duration = end_hour - start_hour + (end_minute - start_minute) / 60;
    const durationTime = this.durations.filter(
      (time) => time.value == duration
    );
    if (durationTime && durationTime.length) {
      return durationTime[0].text;
    } else {
      return '';
    }
  }

  /*****************************************
   * Automation Select & Display
   *****************************************/
  /**
   * Select Automation To assign
   * @param evt :Automation
   */
  selectAutomation(evt: Automation): void {
    this.selectedAutomation = evt;
  }
  getLink(activity: any): void {
    let url;
    if (activity.type.includes('video')) {
      url = environment.website + '/video1/' + activity._id;
    } else if (activity.type.includes('pdf')) {
      url = environment.website + '/pdf1/' + activity._id;
    } else if (activity.type.includes('image')) {
      url = environment.website + '/image/' + activity._id;
    }
    this.clipboard.copy(url);
    this.toastr.success(' Got trackable link to clipboard');
  }

  remakeTimeLines(timelines): void {
    if (timelines && timelines.length > 0) {
      for (const e of timelines) {
        if (e.action) {
          let type = e.action.type;
          const videos = e.action.videos ? e.action.videos : [];
          const pdfs = e.action.pdfs ? e.action.pdfs : [];
          const images = e.action.images ? e.action.images : [];
          const materials = [...videos, ...pdfs, ...images];
          if (e.action.type === 'text') {
            if (materials.length === 0) {
              type = 'text';
            } else {
              if (materials.length === 1) {
                if (videos.length > 0) {
                  type = 'send_text_video';
                }
                if (pdfs.length > 0) {
                  type = 'send_text_pdf';
                }
                if (images.length > 0) {
                  type = 'send_text_image';
                }
              } else if (materials.length > 1) {
                type = 'send_text_material';
              }
            }
          } else if (e.action.type === 'email') {
            if (materials.length === 0) {
              type = 'email';
            } else {
              if (materials.length === 1) {
                if (videos.length > 0) {
                  type = 'send_email_video';
                }
                if (pdfs.length > 0) {
                  type = 'send_email_pdf';
                }
                if (images.length > 0) {
                  type = 'send_email_image';
                }
              } else if (materials.length > 1) {
                type = 'send_email_material';
              }
            }
          }
          e.action.type = type;
          e.action.label = this.ActionName[type];
        }
      }
    }
  }

  timeLineArrangement(): any {
    if (!this.timelines) {
      return;
    }

    this.allContactDataSource = new MatTreeNestedDataSource<any>();
    this.dataContactSource = new MatTreeNestedDataSource<any>();
    this.allDealDataSource = [];
    this.dataDealSource = [];

    if (
      this.timelines['contact_timelines'] &&
      this.timelines['contact_timelines'].length > 0
    ) {
      this.allContactDataSource = new MatTreeNestedDataSource<any>();
      this.remakeTimeLines(this.timelines['contact_timelines']);
      this.allContactDataSource.data = listToTree(
        this.timelines['contact_timelines']
      );
      let root = null;
      if (this.allContactDataSource.data?.length == 0) {
        return;
      }
      // if (this.allDataSource.data[0]?.status == 'completed') {
      //   root = JSON.parse(JSON.stringify(this.allDataSource.data[0]));
      // } else {
      //   return;
      // }
      root = JSON.parse(JSON.stringify(this.allContactDataSource.data[0]));
      const rootNode = { ...root };
      this.activeRoot = null;
      this.activePrevRoot = null;

      // get status = 'active' first action and set it to root
      this.getActiveRoot(rootNode);

      // if nothing status = 'active', get status = 'checking' first action and set it to root
      if (!this.activeRoot) {
        this.getCheckingRoot(rootNode);
      }

      let activeRoot = null;
      if (this.activeRoot) {
        activeRoot = { ...this.activeRoot };
      } else {
        activeRoot = { ...root };
      }
      const activePrevRoot = { ...this.activePrevRoot };
      if (activePrevRoot && Object.keys(activePrevRoot).length > 0) {
        activeRoot = { ...activePrevRoot };
      }

      if (activeRoot) {
        for (const firstChild of activeRoot.children)
          for (const secondChild of firstChild.children)
            secondChild.children = [];

        this.dataContactSource = new MatTreeNestedDataSource<any>();
        this.dataContactSource.data.push(activeRoot);
      }
    }

    if (
      this.timelines['deal_timelines'] &&
      this.timelines['deal_timelines'].length > 0
    ) {
      for (const dealTimeline of this.timelines['deal_timelines']) {
        const dealDataSource = new MatTreeNestedDataSource<any>();
        const timelines = dealTimeline.timeline;

        this.remakeTimeLines(timelines);

        let rootNode = new Timeline();

        // get root node in timelines
        let rootNodeId = timelines[0].parent_ref;
        if (rootNodeId !== 'a_10000') {
          while (true) {
            const rootIndex = timelines.findIndex(
              (item) => item.ref === rootNodeId
            );
            if (rootIndex >= 0) {
              rootNodeId = timelines[rootIndex].parent_ref;
            } else {
              break;
            }
          }
        }

        rootNode = Object.assign({}, timelines[rootNodeId]);

        if (rootNodeId === 'a_10000') {
          // add root node.
          rootNode.ref = 'a_10000';
          rootNode.parent_ref = '0';
          rootNode.root = true;

          timelines.unshift(rootNode);
          dealDataSource.data = listToTree(
            timelines,
            rootNode.parent_ref,
            'deal'
          );
        } else {
          dealDataSource.data = listToTree(timelines, rootNodeId, 'deal');
        }

        let root = null;
        if (dealDataSource.data?.length == 0) {
          return;
        }
        // if (this.allDataSource.data[0]?.status == 'completed') {
        //   root = JSON.parse(JSON.stringify(this.allDataSource.data[0]));
        // } else {
        //   return;
        // }
        this.allDealDataSource.push(dealDataSource);

        root = JSON.parse(JSON.stringify(dealDataSource.data[0]));

        const rootDealNode = { ...root };
        this.activeRoot = null;
        this.activePrevRoot = null;

        // get status = 'active' first action and set it to root
        this.getActiveRoot(rootDealNode);

        // if nothing status = 'active', get status = 'checking' first action and set it to root
        if (!this.activeRoot) {
          this.getCheckingRoot(rootDealNode);
        }

        let activeRoot = null;
        if (this.activeRoot) {
          activeRoot = { ...this.activeRoot };
        } else {
          activeRoot = { ...root };
        }
        const activePrevRoot = { ...this.activePrevRoot };
        if (activePrevRoot && Object.keys(activePrevRoot).length > 0) {
          activeRoot = { ...activePrevRoot };
        }

        if (activeRoot) {
          for (const firstChild of activeRoot.children)
            for (const secondChild of firstChild.children)
              secondChild.children = [];

          const dealSource = new MatTreeNestedDataSource<any>();
          dealSource.data.push(activeRoot);

          this.dataDealSource.push(dealSource);
        }
      }
    }
  }

  getActiveRoot(root, parent = null): void {
    if (root.status === 'active') {
      if (this.activeRoot) {
        if (new Date(this.activeRoot.updated_at) < new Date(root.updated_at)) {
          this.activeRoot = { ...root };
          if (parent) {
            this.activePrevRoot = { ...parent };
          }
        }
      } else {
        this.activeRoot = { ...root };
        if (parent) {
          this.activePrevRoot = { ...parent };
        }
      }
    }
    if (root.children && root.children.length > 0) {
      for (const child of root.children) {
        this.getActiveRoot(child, root);
      }
    }
  }

  getCheckingRoot(root, parent = null): void {
    if (root.status === 'checking') {
      if (this.activeRoot) {
        if (new Date(this.activeRoot.updated_at) < new Date(root.updated_at)) {
          this.activeRoot = { ...root };
          if (parent) {
            this.activePrevRoot = { ...parent };
          }
        }
      } else {
        this.activeRoot = { ...root };
        if (parent) {
          this.activePrevRoot = { ...parent };
        }
      }
    }
    if (root.children && root.children.length > 0) {
      for (const child of root.children) {
        this.getCheckingRoot(child, root);
      }
    }
  }

  activeActionsCount(index): number {
    let count = 0;
    const timelines = this.timelines['deal_timelines'][index];
    if (timelines.timeline && timelines.timeline.length > 0) {
      for (const timeline of timelines.timeline) {
        if (timeline.status === 'active') {
          count++;
        }
      }
    }
    return count;
  }

  isBranchNode(node): boolean {
    for (const dealTimeline of this.timelines['deal_timelines']) {
      const timeline = dealTimeline.timeline;
      if (node && timeline.length > 0) {
        const siblingNodes = [];
        for (const item of timeline) {
          if (item.parent_ref === node.parent_ref) {
            siblingNodes.push(item);
          }
        }
        if (siblingNodes.length >= 2 && !node.condition) {
          return true;
        }
      }
    }
    return false;
  }

  showFullAutomation(type, index = 0): void {
    let automation = {};
    let timelines;
    if (type === 'contact') {
      automation = this.timelines['contact_automation'];
      timelines = this.timelines['contact_timelines'];
    } else {
      automation = this.timelines['deal_timelines'][index]['automation'];
      timelines = this.timelines['deal_timelines'][index]['timeline'];
    }

    this.dialog.open(AutomationShowFullComponent, {
      position: { top: '100px' },
      width: '98vw',
      maxWidth: '700px',
      height: 'calc(65vh + 70px)',
      data: {
        id: automation['_id'],
        automation: automation,
        timelines: timelines,
        type: type
      }
    });
  }

  easyView(node: any, origin: any, content: any): void {
    this.overlayService.open(
      origin,
      content,
      this.viewContainerRef,
      'automation',
      {
        data: node
      }
    );
  }
  assignAutomation(): void {
    if (!this.selectedAutomation) {
      return;
    }
    if (!this.contact._id) {
      return;
    }
    if (this.allContactDataSource.data.length) {
      this.dialog
        .open(ConfirmComponent, {
          maxWidth: '400px',
          width: '96vw',
          data: {
            title: 'Reassign new automation',
            message:
              'Are you sure to stop the current automation and start new automation?',
            cancelLabel: 'Cancel',
            confirmLabel: 'Assign'
          }
        })
        .afterClosed()
        .subscribe((status) => {
          if (status) {
            this.assigning = true;
            // this.assignSubscription && this.assignSubscription.unsubscribe();
            this.automationService
              .bulkAssign(this.selectedAutomation._id, [this.contact._id], null)
              .subscribe((res) => {
                this.assigning = false;
                this.loadTimeline(this._id);
              });
          }
        });
    } else {
      this.assigning = true;
      this.assignSubscription && this.assignSubscription.unsubscribe();
      this.automationService
        .bulkAssign(this.selectedAutomation._id, [this.contact._id], null)
        .subscribe((status) => {
          this.assigning = false;
          this.loadTimeline(this._id);
        });
    }
  }
  closeAutomation(): void {
    if (!this.allContactDataSource.data.length) {
      return;
    }
    if (!this.contact._id) {
      return;
    }
    this.dialog
      .open(ConfirmComponent, {
        maxWidth: '400px',
        width: '96vw',
        data: {
          title: 'Unassign automation',
          message: 'Are you sure to stop the automation?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Unassign'
        }
      })
      .afterClosed()
      .subscribe((status) => {
        if (status) {
          this.canceling = true;
          this.cancelSubscription && this.cancelSubscription.unsubscribe();
          this.automationService
            .unAssign(this.contact._id)
            .subscribe((status) => {
              this.canceling = false;
              if (status) {
                this.loadTimeline(this._id);
              }
            });
        }
      });
  }
  addAdditionalFields(): void {
    this.dialog
      .open(AdditionalFieldsComponent, {
        maxWidth: '480px',
        width: '96vw',
        disableClose: true,
        data: {
          additional_field: { ...this.extra_additional_fields }
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          // Save the additional fields
          const original_additional_field = {
            ...this.contact.additional_field
          };
          this.contact.additional_field = { ...res };
          this.lead_fields.forEach((field) => {
            if (original_additional_field[field.name]) {
              this.contact.additional_field[field.name] =
                original_additional_field[field.name];
            }
          });
          this.updateSubscription = this.contactService
            .updateContact(this.contact._id, {
              additional_field: { ...this.contact.additional_field }
            })
            .subscribe((updateRes) => {
              if (updateRes) {
                this.extra_additional_fields = { ...res };
                this.reloadLatest();
              } else {
                this.contact.additional_field = original_additional_field;
              }
            });
        }
      });
  }

  getPrevPage(): string {
    if (!this.handlerService.previousUrl) {
      return 'to Contacts';
    }
    if (this.handlerService.previousUrl.includes('/materials/analytics/')) {
      return 'to Material Analytics';
    }
    for (const route in ROUTE_PAGE) {
      if (this.handlerService.previousUrl === route) {
        return 'to ' + ROUTE_PAGE[route];
      }
    }
    return '';
  }

  changeLabel(event: string): void {
    const label = event ? event : null;
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.contactService
      .bulkUpdate([this.contact._id], { label: label }, {})
      .subscribe((status) => {
        if (status) {
          this.handlerService.bulkContactUpdate$(
            [this.contact._id],
            { label: label },
            {}
          );
        }
      });
  }

  /******************************************************
   * ****************************************************
   * Name Change Function
   * ****************************************************
   ******************************************************/
  focusName(): void {
    this.nameEditable = true;
    this.contactFirstName = this.contact.first_name;
    this.contactLastName = this.contact.last_name;
    setTimeout(() => {
      if (this.element.nativeElement.querySelector('.first-name-input')) {
        this.element.nativeElement.querySelector('.first-name-input').focus();
      }
    }, 200);
  }
  checkBlurName(event): void {
    if (event.keyCode === 13) {
      this.checkAndSave();
    }
  }
  focusNameField(field: string): void {
    this.activeFieldName = field;
  }
  checkNameFields(field): void {
    setTimeout(() => {
      if (this.activeFieldName != field) {
        return;
      } else {
        this.activeFieldName = '';
        this.checkAndSave();
      }
    }, 200);
  }
  checkAndSave(): void {
    if (
      this.contact.first_name === this.contactFirstName &&
      this.contact.last_name === this.contactLastName
    ) {
      this.nameEditable = false;
      return;
    }
    if (!this.contact._id) {
      return;
    }
    this.saving = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();
    this.saveSubscription = this.contactService
      .updateContact(this.contact._id, {
        first_name: this.contactFirstName,
        last_name: this.contactLastName
      })
      .subscribe((res) => {
        this.saving = false;
        if (res) {
          this.contact.first_name = this.contactFirstName;
          this.contact.last_name = this.contactLastName;
          this.nameEditable = false;
        }
      });
  }

  // saveField(field: string): void {
  //   switch (field) {
  //     case 'phone':
  //       if (this.contact_phone && this.contact_phone['internationalNumber']) {
  //         this.contact.cell_phone = adjustPhoneNumber(
  //           this.contact_phone['internationalNumber']
  //         );
  //       } else {
  //         this.contact.cell_phone = '';
  //       }
  //       if (this.originContact.cell_phone == this.contact.cell_phone) {
  //         this.fieldEditable[field] = false;
  //         return;
  //       } else {
  //         this.originContact.cell_phone = this.contact.cell_phone;
  //         this.checkSave(field);
  //       }
  //       return;
  //     case 'primary_email':
  //       if (this.originContact.email == this.contact.email) {
  //         this.fieldEditable[field] = false;
  //         return;
  //       } else {
  //         this.originContact.email = this.contact.email;
  //         this.checkSave(field);
  //       }
  //       return;
  //     case 'address':
  //       if (this.originContact.address == this.contact.address) {
  //         this.fieldEditable[field] = false;
  //         return;
  //       } else {
  //         this.originContact.address = this.contact.address;
  //         this.checkSave(field);
  //       }
  //       return;
  //     case 'website':
  //       if (this.originContact.website == this.contact.website) {
  //         this.fieldEditable[field] = false;
  //         return;
  //       } else {
  //         this.originContact.website = this.contact.website;
  //         this.checkSave(field);
  //       }
  //       return;
  //     case 'second_phone':
  //       if (
  //         this.second_contact_phone &&
  //         this.second_contact_phone['internationalNumber']
  //       ) {
  //         this.contact.secondary_phone = adjustPhoneNumber(
  //           this.second_contact_phone['internationalNumber']
  //         );
  //       } else {
  //         this.contact.secondary_phone = '';
  //       }
  //       if (
  //         this.originContact.secondary_phone == this.contact.secondary_phone
  //       ) {
  //         this.fieldEditable[field] = false;
  //         return;
  //       } else {
  //         this.originContact.cell_phone = this.contact.cell_phone;
  //         this.checkSave(field);
  //       }
  //       return;
  //     case 'second_email':
  //       if (
  //         this.originContact.secondary_email == this.contact.secondary_email
  //       ) {
  //         this.fieldEditable[field] = false;
  //         return;
  //       } else {
  //         this.originContact.secondary_email = this.contact.secondary_email;
  //         this.checkSave(field);
  //       }
  //       return;
  //   }
  // }

  // focus(evt: any, field: string): void {
  //   if (evt) {
  //     this.fieldEditable[field] = true;
  //     setTimeout(() => {
  //       switch (field) {
  //         case 'phone':
  //           this.phoneControl.control.nativeElement.focus();
  //           return;
  //         case 'primary_email':
  //           this.primary_email_field.nativeElement.focus();
  //           return;
  //         case 'address':
  //           this.contact_address_field.nativeElement.focus();
  //           return;
  //         case 'website':
  //           this.contact_website_field.nativeElement.focus();
  //           return;
  //         case 'second_phone':
  //           this.secondPhoneControl.control.nativeElement.focus();
  //           return;
  //         case 'second_email':
  //           this.second_email_field.nativeElement.focus();
  //           return;
  //       }
  //     }, 300);
  //   }
  // }

  // checkBlur(evt: any, field: string): void {
  //   if (evt.keyCode === 13) {
  //     this.saveField(field);
  //   }
  // }

  // checkSave(field: string): void {
  //   switch (field) {
  //     case 'phone':
  //       this.saveSubscription && this.saveSubscription.unsubscribe();
  //       this.saveSubscription = this.contactService
  //         .updateContact(this.contact._id, {
  //           cell_phone: this.contact.cell_phone
  //         })
  //         .subscribe((res) => {
  //           if (res) {
  //             this.fieldEditable[field] = false;
  //           }
  //         });
  //       return;
  //     case 'primary_email':
  //       this.saveSubscription && this.saveSubscription.unsubscribe();
  //       this.saveSubscription = this.contactService
  //         .updateContact(this.contact._id, {
  //           email: this.contact.email
  //         })
  //         .subscribe((res) => {
  //           if (res) {
  //             this.fieldEditable[field] = false;
  //           }
  //         });
  //       return;
  //     case 'address':
  //       this.saveSubscription && this.saveSubscription.unsubscribe();
  //       this.saveSubscription = this.contactService
  //         .updateContact(this.contact._id, {
  //           address: this.contact.address
  //         })
  //         .subscribe((res) => {
  //           if (res) {
  //             this.fieldEditable[field] = false;
  //           }
  //         });
  //       return;
  //     case 'website':
  //       this.saveSubscription && this.saveSubscription.unsubscribe();
  //       this.saveSubscription = this.contactService
  //         .updateContact(this.contact._id, {
  //           website: this.contact.website
  //         })
  //         .subscribe((res) => {
  //           if (res) {
  //             this.fieldEditable[field] = false;
  //           }
  //         });
  //       return;
  //     case 'second_phone':
  //       this.saveSubscription && this.saveSubscription.unsubscribe();
  //       this.saveSubscription = this.contactService
  //         .updateContact(this.contact._id, {
  //           secondary_phone: this.contact.secondary_phone
  //         })
  //         .subscribe((res) => {
  //           if (res) {
  //             this.fieldEditable[field] = false;
  //           }
  //         });
  //       return;
  //     case 'second_email':
  //       this.saveSubscription && this.saveSubscription.unsubscribe();
  //       this.saveSubscription = this.contactService
  //         .updateContact(this.contact._id, {
  //           secondary_email: this.contact.secondary_email
  //         })
  //         .subscribe((res) => {
  //           if (res) {
  //             this.fieldEditable[field] = false;
  //           }
  //         });
  //       return;
  //   }
  // }

  // handleAddressChange(evt: any, field: string): void {
  //   this.contact.address = '';
  //   for (const component of evt.address_components) {
  //     if (!component['types']) {
  //       continue;
  //     }
  //     if (component['types'].indexOf('street_number') > -1) {
  //       this.contact.address = component['long_name'] + ' ';
  //     }
  //     if (component['types'].indexOf('route') > -1) {
  //       this.contact.address += component['long_name'];
  //     }
  //     if (component['types'].indexOf('administrative_area_level_1') > -1) {
  //       this.contact.state = component['long_name'];
  //     }
  //     if (
  //       component['types'].indexOf('sublocality_level_1') > -1 ||
  //       component['types'].indexOf('locality') > -1
  //     ) {
  //       this.contact.city = component['long_name'];
  //     }
  //     if (component['types'].indexOf('postal_code') > -1) {
  //       this.contact.zip = component['long_name'];
  //     }
  //     if (component['types'].indexOf('country') > -1) {
  //       this.contact.country = component['short_name'];
  //     }
  //   }
  //   this.saveField(field);
  //   this.setContactStates();
  // }

  setContactStates(): void {
    this.addressPlacesRef.options.componentRestrictions.country = this.contact.country;
    this.addressPlacesRef.reset();
  }

  loadContacts(ids: string[]): void {
    if (ids && ids.length >= 0) {
      this.loadingContact = true;
      this.loadContactSubscription &&
        this.loadContactSubscription.unsubscribe();
      this.loadContactSubscription = this.contactService
        .getContactsByIds(ids)
        .subscribe((contacts) => {
          this.loadingContact = false;
          if (contacts) {
            this.detailContacts = contacts;
          }
        });
    }
  }

  reloadLatest(): void {
    this.contactService.addLatestActivity(24);
    this.loadTimeline(this._id);
  }

  loadDetailAppointment(event): void {
    if (!event.meta.event_id) {
      const loadedEvent = { ...event };
      this.selectedAppointment = loadedEvent;
      return;
    }
    const calendars = this.appointmentService.subCalendars.getValue();
    const currentCalendar = calendars[event.meta.calendar_id];
    if (!currentCalendar) {
      return;
    }
    const connected_email = currentCalendar.account;
    this.loadingAppointment = true;
    this.appointmentLoadSubscription &&
      this.appointmentLoadSubscription.unsubscribe();
    this.appointmentLoadSubscription = this.appointmentService
      .getEvent({
        connected_email,
        event_id: event.meta.event_id,
        calendar_id: event.meta.calendar_id
      })
      .subscribe((res) => {
        this.loadingAppointment = false;
        const loadedEvent = {
          ...event,
          timezone: res.timezone,
          service_type: res.service_type
        };
        loadedEvent.meta.is_organizer = res.is_organizer;
        loadedEvent.meta.organizer = res.organizer;
        loadedEvent.meta.guests = res.guests || [];
        let _start = moment(res.due_start).toDate();
        let _end = moment(res.due_end).toDate();
        if (res.service_type === 'outlook') {
          if (!ZONEREG.test(res.due_start)) {
            _start = moment(res.due_start + 'Z').toDate();
          }
          if (!ZONEREG.test(event.due_end)) {
            _end = moment(res.due_end + 'Z').toDate();
          }
        }
        loadedEvent['start'] = _start;
        loadedEvent['end'] = _end;
        if (res.recurrence) {
          loadedEvent.meta.recurrence = res.recurrence;
        } else {
          delete loadedEvent.meta.recurrence_id;
        }

        this.loadedAppointments[event.meta.event_id] = loadedEvent;
        this.selectedAppointment = loadedEvent;
      });
  }

  openDetailEvent(detail, event): void {
    console.log('detal', detail);
    let _start = moment(detail.due_start).toDate();
    let _end = moment(detail.due_end).toDate();
    try {
      if (detail.service_type === 'outlook') {
        if (!ZONEREG.test(detail.due_start)) {
          _start = moment(detail.due_start + 'Z').toDate();
        }
        if (!ZONEREG.test(detail.due_end)) {
          _end = moment(detail.due_end + 'Z').toDate();
        }
      }
    } catch (err) {
      console.log('outlook time assigning', err);
    }
    const _formattedEvent = {
      title: detail.title,
      start: _start,
      end: _end,
      meta: {
        contacts: detail.contacts,
        calendar_id: detail.calendar_id,
        description: detail.description,
        location: detail.location,
        type: detail.type,
        guests: detail.guests,
        event_id: detail.event_id,
        recurrence: detail.recurrence,
        recurrence_id: detail.recurrence_id,
        is_organizer: detail.is_organizer,
        organizer: detail.organizer,
        timezone: detail.timezone,
        service_type: detail.service_type
      }
    };
    const oldAppointmentId = this.selectedAppointment
      ? this.selectedAppointment['meta']['event_id']
      : '';
    this.selectedAppointment = _formattedEvent;
    const newAppointmentId = this.selectedAppointment
      ? this.selectedAppointment['meta']['event_id']
      : '';
    const originX = event.clientX;
    const originY = event.clientY;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const size = {
      maxWidth: '360px',
      minWidth: '300px',
      maxHeight: 410,
      minHeight: 320
    };
    const positionStrategy = this.overlay.position().global();
    if (screenW - originX > 380) {
      positionStrategy.left(originX + 'px');
    } else if (originX > 380) {
      positionStrategy.left(originX - 380 + 'px');
    } else if (screenW - originX > 320) {
      positionStrategy.left(originX + 'px');
    } else {
      positionStrategy.centerHorizontally();
    }

    if (screenH < 440) {
      positionStrategy.centerVertically();
    } else if (originY < 220) {
      positionStrategy.top('10px');
    } else if (screenH - originY < 220) {
      positionStrategy.top(screenH - 430 + 'px');
    } else {
      positionStrategy.top(originY - 220 + 'px');
    }
    size['height'] = 'unset';
    this.templatePortal = new TemplatePortal(
      this.appointmentPortalContent,
      this.viewContainerRef
    );

    if (
      !this.loadedAppointments[newAppointmentId] &&
      newAppointmentId != oldAppointmentId
    ) {
      this.loadDetailAppointment(this.selectedAppointment);
    } else {
      if (this.loadedAppointments[newAppointmentId]) {
        this.selectedAppointment = this.loadedAppointments[newAppointmentId];
      }
    }

    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
      }
      this.overlayRef.updatePositionStrategy(positionStrategy);
      this.overlayRef.updateSize(size);
      this.overlayRef.attach(this.templatePortal);
    } else {
      this.overlayRef = this.overlay.create({
        scrollStrategy: this.overlay.scrollStrategies.block(),
        positionStrategy,
        ...size
      });
      this.overlayRef.outsidePointerEvents().subscribe((evt) => {
        this.selectedAppointment = null;
        this.selectedGroupCall = null;
        this.overlayRef.detach();
        return;
      });
      this.overlayRef.attach(this.templatePortal);
    }
  }

  closeOverlay(event): void {
    this.overlayRef.detach();
  }

  isDisableTab(tabItem): boolean {
    const index = this.disableTabs.findIndex((item) => item.id === tabItem.id);
    return index >= 0;
  }

  isUrl(str): boolean {
    let url = '';
    if (str && str.startsWith('http')) {
      url = str;
    } else {
      url = 'http://' + str;
    }
    if (url.indexOf('.') === -1) {
      return false;
    }
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i'
    );
    return !!pattern.test(url);
  }

  routerHandle(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {})
      )
      .subscribe(() => {
        if (this.emailDialog) {
          setTimeout(() => {
            const draftData = this.storeService.emailContactDraft.getValue();
            this.saveEmailDraft(draftData);
          }, 1000);

          const dialogs = this.storeService.openedDraftDialogs.getValue();
          if (dialogs && dialogs.length > 0) {
            const index = dialogs.findIndex(
              (item) => item.id === this.emailDialog.id
            );
            if (index >= 0) {
              dialogs.splice(index, 1);
              this.storeService.openedDraftDialogs.next([...dialogs]);
            }
          }

          this.emailDialog.close();
          this.emailDialog = null;
        }
        if (this.textDialog) {
          setTimeout(() => {
            const draftData = this.storeService.textContactDraft.getValue();
            this.saveTextDraft(draftData);
          }, 1000);

          const dialogs = this.storeService.openedDraftDialogs.getValue();
          if (dialogs && dialogs.length > 0) {
            const index = dialogs.findIndex(
              (item) => item.id === this.textDialog.id
            );
            if (index >= 0) {
              dialogs.splice(index, 1);
              this.storeService.openedDraftDialogs.next([...dialogs]);
            }
          }

          this.textDialog.close();
          this.textDialog = null;
        }
      });
  }
  /** comment by sniper88t 2021.10.28 */
  /**
   resubscribe(): void {
    const index = this.contact.tags.indexOf('unsubscribed');
    this.contact.tags.splice(index, 1);
    this.contactService
      .updateContact(this.contact._id, { tags: this.contact.tags })
      .subscribe((res) => {
        if (res) {
          this.isUnsubscribed = false;
        }
      });
  }
   */

  saveEmailDraft(data): void {
    if (this.draftEmail && this.draftEmail.user) {
      if (!data.content && !data.subject) {
        this.removeEmailDraftSubscription &&
          this.removeEmailDraftSubscription.unsubscribe();
        this.removeEmailDraftSubscription = this.emailService
          .removeDraft(this.draftEmail._id)
          .subscribe((res) => {
            if (res) {
              this.draftEmail = null;
            }
          });
      } else {
        if (
          data.content !== this.draftEmail.content ||
          data.subject !== this.draftEmail.subject
        ) {
          this.updateEmailDraftSubscription &&
            this.updateEmailDraftSubscription.unsubscribe();
          this.updateEmailDraftSubscription = this.emailService
            .updateDraft(this.draftEmail._id, data)
            .subscribe((res) => {
              if (res) {
                this.draftEmail = {
                  ...this.draftEmail,
                  ...data
                };
              }
            });
        }
      }
    } else {
      if (!data.content && !data.subject) {
        return;
      }
      const defaultEmail = this.userService.email.getValue();
      if (defaultEmail) {
        if (
          data.content === defaultEmail.content.replace(/^\s+|\s+$/g, '') &&
          data.subject === defaultEmail.subject
        ) {
          return;
        }
      }

      this.createEmailDraftSubscription &&
        this.createEmailDraftSubscription.unsubscribe();
      this.createEmailDraftSubscription = this.emailService
        .createDraft(data)
        .subscribe((res) => {
          if (res) {
            this.draftEmail = res;
          }
        });
    }
  }

  saveTextDraft(data): void {
    if (this.draftText && this.draftText.user) {
      if (!data.content) {
        this.removeTextDraftSubscription &&
          this.removeTextDraftSubscription.unsubscribe();
        this.removeTextDraftSubscription = this.emailService
          .removeDraft(this.draftText._id)
          .subscribe((res) => {
            if (res) {
              this.draftText = null;
            }
          });
      } else {
        if (data.content !== this.draftText.content) {
          this.updateTextDraftSubscription &&
            this.updateTextDraftSubscription.unsubscribe();
          this.updateTextDraftSubscription = this.emailService
            .updateDraft(this.draftText._id, data)
            .subscribe((res) => {
              if (res) {
                this.draftText = {
                  ...this.draftText,
                  ...data
                };
              }
            });
        }
      }
    } else {
      if (!data.content) {
        return;
      }
      const defaultText = this.userService.sms.getValue();
      if (defaultText) {
        if (data.content === defaultText.content.replace(/^\s+|\s+$/g, '')) {
          return;
        }
      }

      this.createTextDraftSubscription &&
        this.createTextDraftSubscription.unsubscribe();
      this.createTextDraftSubscription = this.emailService
        .createDraft(data)
        .subscribe((res) => {
          if (res) {
            this.draftText = res;
          }
        });
    }
  }

  getDealLink(activity): string {
    let link = '/deals/';
    if (activity.activity_detail) {
      link += activity.activity_detail._id;
    } else if (activity.deals) {
      link += activity.deals;
    }
    return link;
  }

  getLatestCallLabel(): void {
    if (this.data.phone_logs && this.data.phone_logs.length) {
      const latest = _.maxBy(this.data.phone_logs, (e) => {
        if (e.label) {
          return new Date(e.created_at + '').getTime();
        }
        return 0;
      });
      this.callLabel = latest.label;
    }
  }
  editCallComment(phone_log): void {
    this.dialog
      .open(DialerCallComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          call: phone_log
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.status && res.data) {
          phone_log.rating = res.data.rating || 0;
          phone_log.content = res.data.content;
          phone_log.label = res.data.label;
          this.getLatestCallLabel();
        }
      });
  }

  playRecording(record): void {
    this.selectedRecord = record;
    if (this.recordingData[record]) {
      this.playingRecord = true;
      this.recordAudio.nativeElement.src = this.recordingData[record];
    } else {
      this.loadingRecord = true;
      this.dialerService.loadRecording(record).subscribe((res) => {
        if (res.status && res.data && res.data.url) {
          this.loadingRecord = false;
          this.playingRecord = true;
          this.recordAudio.nativeElement.src = res.data.url;
          this.recordingData[record] = res.data.url;
        } else {
          this.selectedRecord = '';
        }
      });
    }
  }

  updatePlayingTime(event): void {
    this.currentPlayTime = Math.ceil(
      (this.recordAudio.nativeElement.currentTime /
        this.recordAudio.nativeElement.duration) *
        100
    );
  }

  audioEnded(): void {
    this.playingRecord = false;
    this.currentPlayTime = 0;
  }

  seekAudioTime(event): void {
    if (event) {
      const currentTime =
        (this.recordAudio.nativeElement.duration * event.value) / 100;
      this.recordAudio.nativeElement.currentTime = currentTime;
    }
  }

  pauseRecording(): void {
    this.playingRecord = false;
    this.recordAudio.nativeElement.pause();
  }
  resumeRecording(): void {
    this.playingRecord = true;
    this.recordAudio.nativeElement.play();
  }

  downloadRecord(record, event): void {
    const downloadBtn = event.target.closest('.download-btn');
    if (!downloadBtn) {
      return;
    }
    downloadBtn.classList.add('downloading');
    const dom = document.createElement('a');
    dom.download = 'recording.mp3';
    if (this.recordingData[record]) {
      const url = this.recordingData[record];
      fetch(url)
        .then((r) => {
          r.blob()
            .then((blob) => {
              const dUrl = window.URL.createObjectURL(blob);
              dom.href = dUrl;
              dom.click();
              downloadBtn.classList.remove('downloading');
            })
            .catch((err) => {
              alert(
                'Downloading call recorded material is failed.' + err.message
              );
              downloadBtn.classList.remove('downloading');
            });
        })
        .catch((err) => {
          alert('Downloading call recorded material is failed.' + err.message);
          downloadBtn.classList.remove('downloading');
        });
    } else {
      this.dialerService.loadRecording(record).subscribe((res) => {
        if (res.status && res.data && res.data.url) {
          const url = res.data.url;
          fetch(url)
            .then((r) => {
              r.blob()
                .then((blob) => {
                  const dUrl = window.URL.createObjectURL(blob);
                  dom.href = dUrl;
                  dom.click();
                  downloadBtn.classList.remove('downloading');
                })
                .catch((err) => {
                  alert(
                    'Downloading call recorded material is failed.' +
                      err.message
                  );
                  downloadBtn.classList.remove('downloading');
                });
            })
            .catch((err) => {
              alert(
                'Downloading call recorded material is failed.' + err.message
              );
              downloadBtn.classList.remove('downloading');
            });
        } else {
          downloadBtn.classList.remove('downloading');
        }
      });
    }
  }

  expandCallNote(event): void {
    const noteContentDom = event.target.closest('.call-note-content');
    if (noteContentDom) {
      noteContentDom.classList.add('expanded');
    }
  }

  collapseCallNote(event): void {
    const noteContentDom = event.target.closest('.call-note-content');
    if (noteContentDom) {
      noteContentDom.classList.remove('expanded');
    }
  }

  moveDeal(activity: any): void {
    this.dialog
      .open(DealMoveComponent, {
        width: '100vw',
        maxWidth: '500px',
        disableClose: true,
        data: {
          stage_id: activity.deal_stage,
          deal_id: activity._id
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          activity.deal_stage = res;
        }
      });
  }

  /**
   * Remove activity
   * @param activity: activity content to remove
   */
  removeActivity(activity: any, type: string): void {
    console.log(
      'remove activity',
      activity,
      this.dataObj[type][activity[type]]
    );
    if (type === 'appointments') {
      const detail = this.dataObj[type][activity[type]];
      const payload = {
        event_id: detail.event_id,
        calendar_id: detail.calendar_id,
        connected_email: detail.calendar_id,
        contact_email: this.contact?.email,
        contact_id: this.contact?._id
      };
      this.appointmentService.removeGuest(payload).subscribe((res) => {
        console.log('remove guest response', res);
      });
    }
  }

  removeDeal(deal: any): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        position: { top: '100px' },
        data: {
          title: 'Remove deal',
          message: 'Are you sure to remove this deal from contact?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.dialog
            .open(ConfirmComponent, {
              ...DialogSettings.CONFIRM,
              data: {
                title: 'Delete Deal',
                message:
                  'Do you want to remove all the data and all the activities related this deal from contact?',
                cancelLabel: 'No',
                confirmLabel: 'Yes'
              }
            })
            .afterClosed()
            .subscribe((confirm) => {
              if (confirm === true) {
                this.dealsService
                  .updateContact(deal._id, 'remove', [this._id])
                  .subscribe((status) => {
                    if (status) {
                      const selectedContact = this.storeService.selectedContact.getValue();
                      const index = selectedContact.details.deals.findIndex(
                        (e) => e._id == deal._id
                      );
                      selectedContact.details.deals.splice(index, 1);
                      selectedContact.activity.forEach((e, i) => {
                        if (e['type'] == 'deals' && e['deals'] == deal._id) {
                          selectedContact.activity.splice(i, 1);
                        }
                      });
                      this.storeService.selectedContact.next(selectedContact);
                      this.reloadLatest();
                    }
                  });
              }
              if (confirm === false) {
                this.dealsService
                  .updateContact(deal._id, 'remove', [this._id], false)
                  .subscribe((status) => {
                    if (status) {
                      const selectedContact = this.storeService.selectedContact.getValue();
                      const index = selectedContact.details.deals.findIndex(
                        (e) => e._id == deal._id
                      );
                      selectedContact.details.deals.splice(index, 1);
                      selectedContact.activity.forEach((e, i) => {
                        if (e['type'] == 'deals' && e['deals'] == deal._id) {
                          selectedContact.activity.splice(i, 1);
                        }
                      });
                      this.storeService.selectedContact.next(selectedContact);
                      this.reloadLatest();
                    }
                  });
              }
            });
          // this.dealsService
          //   .updateContact(deal._id, 'remove', [this._id])
          //   .subscribe((status) => {
          //     if (status) this.reloadLatest();
          //   });
        }
      });
  }

  ICONS = {
    follow_up: AUTOMATION_ICONS.FOLLOWUP,
    update_follow_up: AUTOMATION_ICONS.UPDATE_FOLLOWUP,
    note: AUTOMATION_ICONS.CREATE_NOTE,
    text: AUTOMATION_ICONS.SEND_TEXT,
    email: AUTOMATION_ICONS.SEND_EMAIL,
    audio: AUTOMATION_ICONS.SEND_AUDIO,
    send_email_video: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    send_text_video: AUTOMATION_ICONS.SEND_VIDEO_TEXT,
    send_email_pdf: AUTOMATION_ICONS.SEND_PDF_EMAIL,
    send_text_pdf: AUTOMATION_ICONS.SEND_PDF_TEXT,
    send_email_image: AUTOMATION_ICONS.SEND_IMAGE_EMAIL,
    send_text_image: AUTOMATION_ICONS.SEND_IMAGE_TEXT,
    update_contact: AUTOMATION_ICONS.UPDATE_CONTACT,
    deal: AUTOMATION_ICONS.NEW_DEAL,
    move_deal: AUTOMATION_ICONS.MOVE_DEAL,
    send_email_material: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    send_text_material: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    root: AUTOMATION_ICONS.DEAL_ROOT,
    automation: AUTOMATION_ICONS.AUTOMATION
  };

  getFollowUp(taskId) {
    if (this.dataObj.tasks[taskId] && this.dataObj.tasks[taskId].due_date) {
      return this.dataObj.tasks[taskId];
    } else {
      const recurrences = this.data.tasks
        .filter((e) => e.parent_follow_up === taskId && e.status !== 1)
        .sort((a, b) =>
          moment(a.due_date).isSameOrBefore(b.due_date) ? -1 : 1
        );

      if (recurrences.length) {
        return recurrences[0];
      } else {
        return null;
      }
    }
  }

  /** =================== OLD FUNCTIONS ===============
  getSessionIndex(i: number, activities: any[]): string {
    const notTrackers = activities.filter((e) => {
      if (e.activity_detail && e.activity_detail.type === 'watch') {
        return false;
      } else {
        return true;
      }
    });
    return `#${activities.length - notTrackers.length - i}`;
  }

  convertContent(content = ''): any {
    const dom = document.createElement('div');
    dom.innerHTML = content;
    const materials = dom.querySelectorAll('.material-object');
    let convertString = '';
    materials.forEach((material) => {
      const url = material.getAttribute('href');
      const id = url.replace(
        new RegExp(
          environment.website +
            '/video1/|' +
            environment.website +
            '/pdf1/|' +
            environment.website +
            '/image1/',
          'gi'
        ),
        ''
      );
      convertString += material.outerHTML;
    });
    if (materials.length === 1) {
      const material = this.details[this.sentHistory[activityIds[0]]];
      convertString += `<div class="title">${
        material ? material.title : ''
      }</div><div class="description">${
        material ? material.description : ''
      }</div>`;
      convertString = `<div class="single-material-send">${convertString}</div>`;
    }
    return convertString;
  }

  convertTextContent(content = ''): string {
    const videoReg = new RegExp(
      environment.website + '/video1/' + '([0-9a-zA-Z]{24})',
      'gi'
    );
    const imageReg = new RegExp(
      environment.website + '/image1/' + '([0-9a-zA-Z]{24})',
      'gi'
    );
    const pdfReg = new RegExp(
      environment.website + '/pdf1/' + '([0-9a-zA-Z]{24})',
      'gi'
    );
    const videoLinks = content.match(videoReg) || [];
    const imageLinks = content.match(imageReg) || [];
    const pdfLinks = content.match(pdfReg) || [];
    const activityIds = [];
    const materials = [...videoLinks, ...imageLinks, ...pdfLinks];
    materials.forEach((material) => {
      const id = material.replace(
        new RegExp(
          environment.website +
            '/video1/|' +
            environment.website +
            '/pdf1/|' +
            environment.website +
            '/image1/',
          'gi'
        ),
        ''
      );
      activityIds.push(id);
    });
    let resultHTML = content;
    activityIds.forEach((activity) => {
      const material = this.details[this.sentHistory[activity]];
      if (material) {
        let prefix = 'video?video=';
        let activityPrefix = 'video1';
        if (material.type && material.type.indexOf('pdf') !== -1) {
          prefix = 'pdf?pdf=';
          activityPrefix = 'pdf1';
        }
        if (material.type && material.type.indexOf('image') !== -1) {
          prefix = 'image?image=';
          activityPrefix = 'image1';
        }
        const link = `<a target="_blank" href="${environment.website}/${prefix}${material._id}&user=${this.userId}" class="material-thumbnail"><img src="${material.preview}"></a>`;
        const originalLink = `${environment.website}/${activityPrefix}/${activity}`;
        resultHTML = resultHTML.replace(originalLink, link);
      }
    });
    if (activityIds.length) {
      return resultHTML;
    }
    return resultHTML;
  }

  getVideoBadge(activity): string {
    let hasThumbed = false;
    let finishedCount = 0;
    const material = this.dataObj.materials[activity.videos];
    if (material) {
      this.groupActions[activity.group_id].forEach((e) => {
        if (!e.activity_detail) {
          return;
        }
        if (e.activity_detail.type === 'thumbs up') {
          hasThumbed = true;
          return;
        }
        if (
          e.activity_detail.type === 'watch' &&
          e.activity_detail.duration &&
          e.activity_detail.duration / material.duration > 0.97
        ) {
          finishedCount++;
        }
      });
    }
    if (hasThumbed || finishedCount) {
      let html = `<div class="c-blue font-weight-bold">${material?.title}</div>`;
      if (hasThumbed) {
        html += '<div class="i-icon i-like bgc-blue thumb-icon mx-1"></div>';
      }
      if (finishedCount) {
        html += `<div class="full-badge text-center f-3 font-weight-bold ml-auto">${finishedCount}</div><div class="c-blue font-weight-bold f-5">Video finished!</div>`;
      }
      return html;
    } else {
      return `<div class="font-weight-bold">${material?.title}</div>`;
    }
  }

  getPdfImageBadge(activity): string {
    let hasThumbed = false;
    const material = this.dataObj.materials[activity.videos];
    this.groupActions[activity.group_id].some((e) => {
      if (!e.activity_detail) {
        return;
      }
      if (e.activity_detail.type === 'thumbs up') {
        hasThumbed = true;
        return true;
      }
    });
    if (hasThumbed) {
      let html = `<div class="c-blue font-weight-bold">${material?.title}</div>`;
      if (hasThumbed) {
        html += '<div class="i-icon i-like bgc-blue thumb-icon mx-1"></div>';
      }
      return html;
    } else {
      return `<div class="font-weight-bold">${material?.title}</div>`;
    }
  }
  */

  /** =================== Get Detail Data Count Function ===============
  detailCounts = {
    notes: 0,
    emails: 0,
    texts: 0,
    appointments: 0,
    team_calls: 0,
    follow_ups: 0,
    deals: 0
  };

  getDetailCounts(): void {
    this.detailCounts = {
      notes: 0,
      emails: 0,
      texts: 0,
      appointments: 0,
      team_calls: 0,
      follow_ups: 0,
      deals: 0
    };
    const details = Object.values(this.detailData);
    details.forEach((e) => {
      switch (e['data_type']) {
        case 'emails':
          this.detailCounts['emails']++;
          break;
        case 'videos':
        case 'pdfs':
        case 'images':
          if (!e['emails']) {
            this.detailCounts['emails']++;
          }
          break;
        default:
          this.detailCounts[e['data_type']]++;
      }
    });
    this.tabs[1]['badge'] = this.detailCounts['notes'];
    this.tabs[2]['badge'] = this.detailCounts['emails'];
    this.tabs[3]['badge'] = this.detailCounts['texts'];
    this.tabs[4]['badge'] = this.detailCounts['appointments'];
    // this.tabs[5]['badge'] = this.detailCounts['team_calls'];
    this.tabs[5]['badge'] = this.detailCounts['follow_ups'];
    this.tabs[6]['badge'] = this.detailCounts['deals'];
  } */

  /** ============================= Group Call Open Overlay Function ========================
  openGroupCall(detail, event): void {
    const oldCallId = this.selectedGroupCall
      ? this.selectedGroupCall['_id']
      : '';
    this.selectedGroupCall = detail;
    const newCallId = this.selectedGroupCall
      ? this.selectedGroupCall['_id']
      : '';
    const originX = event.clientX;
    const originY = event.clientY;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const size = {
      maxWidth: '360px',
      minWidth: '300px',
      maxHeight: 410,
      minHeight: 320
    };
    const positionStrategy = this.overlay.position().global();
    if (screenW - originX > 380) {
      positionStrategy.left(originX + 'px');
    } else if (originX > 380) {
      positionStrategy.left(originX - 380 + 'px');
    } else if (screenW - originX > 320) {
      positionStrategy.left(originX + 'px');
    } else {
      positionStrategy.centerHorizontally();
    }

    if (screenH < 440) {
      positionStrategy.centerVertically();
    } else if (originY < 220) {
      positionStrategy.top('10px');
    } else if (screenH - originY < 220) {
      positionStrategy.top(screenH - 430 + 'px');
    } else {
      positionStrategy.top(originY - 220 + 'px');
    }
    size['height'] = 'unset';
    this.templatePortal = new TemplatePortal(
      this.groupCallPortalContent,
      this.viewContainerRef
    );

    if (!this.loadedGroupCalls[newCallId] && newCallId != oldCallId) {
      this.loadDetailGroupCall(newCallId);
    } else {
      if (this.loadedGroupCalls[newCallId]) {
        this.selectedGroupCall = this.loadedGroupCalls[newCallId];
      }
    }

    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
      }
      this.overlayRef.updatePositionStrategy(positionStrategy);
      this.overlayRef.updateSize(size);
      this.overlayRef.attach(this.templatePortal);
    } else {
      this.overlayRef = this.overlay.create({
        scrollStrategy: this.overlay.scrollStrategies.block(),
        positionStrategy,
        ...size
      });
      this.overlayRef.outsidePointerEvents().subscribe((evt) => {
        this.overlayRef.detach();
        return;
      });
      this.overlayRef.attach(this.templatePortal);
    }
    return;
  }

  loadDetailGroupCall(id: string): void {
    this.loadingGroupCall = true;
    this.groupCallLoadSubscription &&
      this.groupCallLoadSubscription.unsubscribe();
    this.groupCallLoadSubscription = this.teamService
      .getCallById(id)
      .subscribe((call) => {
        this.loadingGroupCall = false;
        if (call.contacts && call.contacts.length) {
          const contacts = [];
          call.contacts.forEach((e) => {
            contacts.push(new Contact().deserialize(e));
          });
          call.contacts = contacts;
        }
        if (call.leader) {
          call.leader = new User().deserialize(call.leader);
        }
        this.loadedGroupCalls[id] = call;
        this.selectedGroupCall = call;
      });
  }
   */
}
