import { TaskRecurringDialogComponent } from 'src/app/components/task-recurring-dialog/task-recurring-dialog.component';
import {
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { DealsService } from 'src/app/services/deals.service';
import { Deal } from 'src/app/models/deal.model';
import { Contact } from 'src/app/models/contact.model';
import { TabItem } from 'src/app/utils/data.types';
import { MatDialog } from '@angular/material/dialog';
import { CalendarDialogComponent } from 'src/app/components/calendar-dialog/calendar-dialog.component';
import { TaskCreateComponent } from 'src/app/components/task-create/task-create.component';
import {
  AUTOMATION_ICONS,
  CALENDAR_DURATION,
  DialogSettings,
  ROUTE_PAGE,
  ActionName
} from 'src/app/constants/variable.constants';
import { SendEmailComponent } from 'src/app/components/send-email/send-email.component';
import { NoteCreateComponent } from 'src/app/components/note-create/note-create.component';
import { DealEditComponent } from 'src/app/components/deal-edit/deal-edit.component';
import { Subscription } from 'rxjs';
import { NoteEditComponent } from '../../components/note-edit/note-edit.component';
import { ConfirmComponent } from '../../components/confirm/confirm.component';
import { NoteService } from '../../services/note.service';
import { TaskEditComponent } from '../../components/task-edit/task-edit.component';
import { TaskDetail } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { HandlerService } from '../../services/handler.service';
import { DealContactComponent } from 'src/app/components/deal-contact/deal-contact.component';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Location } from '@angular/common';
import { JoinCallRequestComponent } from 'src/app/components/join-call-request/join-call-request.component';
import { AppointmentService } from 'src/app/services/appointment.service';
import { TeamService } from 'src/app/services/team.service';
import { UserService } from 'src/app/services/user.service';
import { getCurrentTimezone, listToTree } from 'src/app/helper';
import { DetailActivity } from 'src/app/models/activityDetail.model';
import { User } from 'src/app/models/user.model';
import { SendBulkTextComponent } from 'src/app/components/send-bulk-text/send-bulk-text.component';
import { ToastrService } from 'ngx-toastr';
import { DetailErrorComponent } from 'src/app/components/detail-error/detail-error.component';
import { AdditionalFieldsComponent } from '../../components/additional-fields/additional-fields.component';
import { AdditionalEditComponent } from '../../components/additional-edit/additional-edit.component';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Draft } from '../../models/draft.model';
import { EmailService } from '../../services/email.service';
import { filter, map } from 'rxjs/operators';
import { StoreService } from '../../services/store.service';
import { Automation } from '../../models/automation.model';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { AutomationService } from '../../services/automation.service';
import { OverlayService } from '../../services/overlay.service';
import { AutomationShowFullComponent } from '../../components/automation-show-full/automation-show-full.component';
import { Timeline } from '../../models/timeline.model';

@Component({
  selector: 'app-deals-detail',
  templateUrl: './deals-detail.component.html',
  styleUrls: ['./deals-detail.component.scss']
})
export class DealsDetailComponent implements OnInit {
  ACTIVITY_GEN = {
    video_trackers: {
      watch: 'watched video',
      'thumbs up': 'thumbs up the video'
    },
    image_trackers: {
      review: 'reviewed image',
      'thumbs up': 'thumbs up the image'
    },
    pdf_trackers: {
      review: 'reviewed pdf',
      'thumbs up': 'thumbs up the pdf'
    },
    email_trackers: {
      open: 'opened email',
      click: 'Clicked the link on email'
    }
  };
  TRACKER_FIELD = {
    video_trackers: 'video',
    image_trackers: 'image',
    pdf_trackers: 'pdf',
    email_trackers: 'email'
  };
  timezone;
  dealId;
  deal = {
    main: new Deal(),
    activities: [],
    contacts: [],
    primary_contact: null
  };
  stages: any[] = [];
  selectedStage;
  selectedStageId = '';
  tabs: TabItem[] = [
    { icon: '', label: 'Activity', id: 'all' },
    { icon: '', label: 'Notes', id: 'notes' },
    { icon: '', label: 'Emails', id: 'emails' },
    { icon: '', label: 'Texts', id: 'texts' },
    { icon: '', label: 'Meetings', id: 'appointments' },
    // { icon: '', label: 'Group Calls', id: 'team_calls' },
    { icon: '', label: 'Tasks', id: 'follow_ups' },
    { icon: '', label: 'Calls', id: 'phone_logs' }
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
  durations = CALENDAR_DURATION;
  dealPanel = true;
  contactsPanel = true;

  activityCounts = {
    all: 0,
    notes: 0,
    emails: 0,
    texts: 0,
    appointments: 0,
    group_calls: 0,
    follow_ups: 0
  };
  notes = [];
  emails = [];
  texts = [];
  appointments = [];
  groupCalls = [];
  tasks = [];

  activities: DetailActivity[] = [];
  mainTimelines = [];
  showingDetails = [];
  groupActions = {};
  details = {};
  detailData = {};
  sendActions = {};

  editors = {};

  routeChangeSubscription: Subscription;
  profileSubscription: Subscription;
  stageLoadSubscription: Subscription;
  loadSubscription: Subscription;
  activitySubscription: Subscription;
  noteSubscription: Subscription;
  emailSubscription: Subscription;
  textSubscription: Subscription;
  appointmentSubscription: Subscription;
  groupCallSubscription: Subscription;
  taskSubscription: Subscription;
  dealSubscription: Subscription;
  teamsLoadSubscription: Subscription;
  updateSubscription: Subscription;
  reloadSubscription: Subscription;

  materialActivitySubscription: Subscription;
  cancelSubscription: Subscription;
  assignSubscription: Subscription;

  titleEditable = false;
  dealTitle = '';
  saving = false;
  saveSubscription: Subscription;
  disableTabs = [];
  isPackageAutomation = true;
  isPackageText = true;
  isPackageDialer = false;

  loading = false;
  contacts = {};
  data = {
    materials: [],
    notes: [],
    emails: [],
    texts: [],
    appointments: [],
    tasks: [],
    phone_logs: []
  };
  dataObj = {
    materials: {},
    notes: {},
    emails: {},
    texts: {},
    appointments: {},
    tasks: {},
    phone_logs: {}
  };
  sub_calls = {};
  trackers = {};
  groups = [];
  dGroups = [];
  showingMax = 4;
  loadingAppointment = false;
  loadedAppointments = {};
  selectedAppointment;
  showAll = false;
  sliceNum = 5;
  showText = 'Show all';

  overlayRef: OverlayRef;
  templatePortal: TemplatePortal;
  appointmentLoadSubscription: Subscription;
  @ViewChild('appointmentPortalContent') appointmentPortalContent: TemplateRef<
    unknown
  >;

  userId = '';
  emailDialog = null;
  textDialog = null;
  createEmailDraftSubscription: Subscription;
  updateEmailDraftSubscription: Subscription;
  removeEmailDraftSubscription: Subscription;
  createTextDraftSubscription: Subscription;
  updateTextDraftSubscription: Subscription;
  removeTextDraftSubscription: Subscription;
  setPrimaryContactSubscription: Subscription;
  draftSubscription: Subscription;
  draftEmail = new Draft();
  draftText = new Draft();

  // Automation
  selectedAutomation: Automation;
  assigning = false;
  canceling = false;
  allDataSource = new MatTreeNestedDataSource<any>();
  dataSource = new MatTreeNestedDataSource<any>();
  treeControl = new NestedTreeControl<any>((node) => node.children);
  ActionName = ActionName;

  hasChild = (_: number, node: any) =>
    !!node.children && node.children.length > 0;

  timeLines = [];
  automation = null;

  activeRoot: any;
  activePrevRoot: any;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    public dealsService: DealsService,
    private noteService: NoteService,
    private taskService: TaskService,
    private appointmentService: AppointmentService,
    private teamService: TeamService,
    private handlerService: HandlerService,
    private toast: ToastrService,
    private location: Location,
    private element: ElementRef,
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    private emailService: EmailService,
    private storeService: StoreService,
    private automationService: AutomationService,
    private overlayService: OverlayService
  ) {
    this.appointmentService.loadCalendars(false);
    this.teamService.loadAll(true);

    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      try {
        if (user._id) {
          this.userId = user._id;
          // this.timezone = JSON.parse(user.time_zone_info);
          const timezone = getCurrentTimezone();
          this.timezone = { zone: timezone };
          this.isPackageAutomation = user.automation_info?.is_enabled;
          this.isPackageText = user.text_info?.is_enabled;
          this.isPackageDialer = user.dialer_info?.is_enabled || false;

          this.disableTabs = [];
          if (!this.isPackageAutomation) {
            this.disableTabs.push({
              icon: '',
              label: 'Appointments',
              id: 'appointments'
            });
            const index = this.tabs.findIndex(
              (item) => item.id === 'appointments'
            );
            if (index >= 0) {
              this.tabs.splice(index, 1);
            }
          }
          if (!this.isPackageText) {
            this.disableTabs.push({ icon: '', label: 'Texts', id: 'texts' });
            const index = this.tabs.findIndex((item) => item.id === 'texts');
            if (index >= 0) {
              this.tabs.splice(index, 1);
            }
          }
        }
      } catch (err) {
        const timezone = getCurrentTimezone();
        this.timezone = { zone: timezone };
      }
    });

    this.stageLoadSubscription = this.dealsService.stages$.subscribe((res) => {
      this.stages = res;
      this.changeSelectedStage();
    });

    this.teamsLoadSubscription && this.teamsLoadSubscription.unsubscribe();
    this.teamsLoadSubscription = this.teamService.teams$.subscribe((teams) => {
      teams.forEach((team) => {
        if (team.editors && team.editors.length) {
          team.editors.forEach((e) => {
            this.editors[e._id] = new User().deserialize(e);
          });
        }
      });
    });

    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      if (this.dealId !== params['id']) {
        this.dealId = params['id'];
        this.loadSubscription && this.loadSubscription.unsubscribe();
        this.loadSubscription = this.dealsService
          .getDeal(this.dealId)
          .subscribe((res) => {
            if (res) {
              this.deal = res;
              this.deal.contacts = (res.contacts || []).map((e) =>
                new Contact().deserialize(e)
              );
              this.deal.contacts.forEach((e) => {
                this.contacts[e._id] = e;
              });
              if (this.deal.main.deal_stage) {
                this.selectedStageId = this.deal.main.deal_stage;
                this.changeSelectedStage();
              }
              this.loadActivity();
              this.getTimeLines();
              this.getSiblings();
            }
          });
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params.id;
    if (id) {
      this.dealId = id;
      this.loadSubscription && this.loadSubscription.unsubscribe();
      this.loadSubscription = this.dealsService.getDeal(id).subscribe((res) => {
        if (res) {
          this.deal = res;
          this.deal.contacts = (res.contacts || []).map((e) =>
            new Contact().deserialize(e)
          );
          if (res.primary_contact) {
            this.deal.primary_contact = res.primary_contact;
            const index = this.deal.contacts.findIndex(
              (item) => item._id === this.deal.primary_contact
            );
            if (index >= 0) {
              const primaryContact = this.deal.contacts[index];
              this.deal.contacts.splice(index, 1);
              this.deal.contacts.unshift(primaryContact);
            }
          }
          if (this.deal.main.deal_stage) {
            this.selectedStageId = this.deal.main.deal_stage;
            this.changeSelectedStage();
          }
          this.loadActivity();
          this.getTimeLines();
          this.getSiblings();
        }
      });
      this.routerHandle();
    }
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.stageLoadSubscription && this.stageLoadSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.teamsLoadSubscription && this.teamsLoadSubscription.unsubscribe();
  }

  changeSelectedStage(): void {
    this.stages.some((e) => {
      if (e._id === this.selectedStageId) {
        this.selectedStage = e;
      }
    });
  }

  backPage(): void {
    this.handlerService.goBack('/deals');
  }

  loadActivity(): void {
    this.activitySubscription && this.activitySubscription.unsubscribe();
    this.loading = true;
    this.activitySubscription = this.dealsService
      .getActivity({ deal: this.dealId })
      .subscribe((res) => {
        this.loading = false;
        if (res) {
          this.activities = res['activity'].map((e) =>
            new DetailActivity().deserialize(e)
          );
          this.details = res['details'];
          this.dataObj.materials = {};
          this.dataObj.notes = {};
          this.dataObj.emails = {};
          this.dataObj.texts = {};
          this.dataObj.appointments = {};
          this.dataObj.tasks = {};
          this.dataObj.phone_logs = {};
          this.sub_calls = {};
          this.groups = [];

          //populate assigned contact in activity

          for (const activity of this.activities) {
            if (activity.type === 'notes') {
              const index = this.details['notes'].findIndex(
                (item) => item._id === activity['notes']
              );
              if (index >= 0) {
                const contacts = this.details['notes'][index][
                  'assigned_contacts'
                ];
                const assignedContacts = [];
                for (const contact of contacts) {
                  const contactIndex = this.deal.contacts.findIndex(
                    (item) => item._id === contact
                  );
                  if (contactIndex >= 0) {
                    assignedContacts.push(this.deal.contacts[contactIndex]);
                  }
                }
                activity['assigned_contacts'] = assignedContacts;
              }
            }
            if (activity.type === 'texts') {
              const index = this.details['texts'].findIndex(
                (item) => item._id === activity['texts']
              );
              if (index >= 0) {
                const contacts = this.details['texts'][index][
                  'assigned_contacts'
                ];
                const assignedContacts = [];
                for (const contact of contacts) {
                  const contactIndex = this.deal.contacts.findIndex(
                    (item) => item._id === contact
                  );
                  if (contactIndex >= 0) {
                    assignedContacts.push(this.deal.contacts[contactIndex]);
                  }
                }
                activity['assigned_contacts'] = assignedContacts;
              }
            }

            if (activity.type === 'emails') {
              const index = this.details['emails'].findIndex(
                (item) => item._id === activity['emails']
              );
              if (index >= 0) {
                const contacts = this.details['emails'][index][
                  'assigned_contacts'
                ];
                const assignedContacts = [];
                for (const contact of contacts) {
                  const contactIndex = this.deal.contacts.findIndex(
                    (item) => item._id === contact
                  );
                  if (contactIndex >= 0) {
                    assignedContacts.push(this.deal.contacts[contactIndex]);
                  }
                }
                activity['assigned_contacts'] = assignedContacts;
              }
            }

            if (activity.type === 'follow_ups') {
              const index = this.details['tasks'].findIndex(
                (item) => item._id === activity['follow_ups']
              );
              if (index >= 0) {
                const contacts = this.details['tasks'][index][
                  'assigned_contacts'
                ];
                const assignedContacts = [];
                for (const contact of contacts) {
                  const contactIndex = this.deal.contacts.findIndex(
                    (item) => item._id === contact
                  );
                  if (contactIndex >= 0) {
                    assignedContacts.push(this.deal.contacts[contactIndex]);
                  }
                }
                activity['assigned_contacts'] = assignedContacts;
              }
            }

            if (activity.type === 'phone_logs') {
              const index = this.details['phone_logs'].findIndex(
                (item) => item._id === activity['phone_logs']
              );
              if (index >= 0) {
                const contacts = this.details['phone_logs'][index][
                  'assigned_contacts'
                ];
                const assignedContacts = [];
                for (const contact of contacts) {
                  const contactIndex = this.deal.contacts.findIndex(
                    (item) => item._id === contact
                  );
                  if (contactIndex >= 0) {
                    assignedContacts.push(this.deal.contacts[contactIndex]);
                  }
                }
                activity['assigned_contacts'] = assignedContacts;
              }
            }
          }

          this.data.materials = this.details['materials'] || [];
          this.data.notes = this.details['notes'] || [];
          this.data.emails = this.details['emails'] || [];
          this.data.texts = this.details['texts'] || [];
          this.data.appointments = this.details['appointments'] || [];
          this.data.tasks = this.details['tasks'] || [];
          this.data.phone_logs = this.details['phone_logs'] || [];
          (this.details['sub_calls'] || []).forEach((call) => {
            const key = call.shared_log;
            if (!this.sub_calls[key] || !this.sub_calls[key].length) {
              this.sub_calls[key] = [call];
            } else {
              this.sub_calls[key].push(call);
            }
          });
          for (const key in this.sub_calls) {
            this.sub_calls[key] = _.uniqBy(this.sub_calls[key], '_id');
          }
          this.trackers = this.details['trackers'] || {};

          this.groupActivities();
          this.arrangeActivity();
          this.setLastActivity();

          //populate assigned contact in detail
          if (this.data.notes.length) {
            for (const note of this.data.notes) {
              if (note.assigned_contacts && note.assigned_contacts.length > 0) {
                const assigned_contacts = [];
                for (const contact of note.assigned_contacts) {
                  const index = this.deal.contacts.findIndex(
                    (item) => item._id === contact
                  );
                  if (index >= 0) {
                    assigned_contacts.push(this.deal.contacts[index]);
                  }
                }
                note.assigned_contacts = assigned_contacts;
              }
            }
          }
          if (this.data.emails.length) {
            for (const email of this.data.emails) {
              if (
                email.assigned_contacts &&
                email.assigned_contacts.length > 0
              ) {
                const assigned_contacts = [];
                for (const contact of email.assigned_contacts) {
                  const index = this.deal.contacts.findIndex(
                    (item) => item._id === contact
                  );
                  if (index >= 0) {
                    assigned_contacts.push(this.deal.contacts[index]);
                  }
                }
                email.assigned_contacts = assigned_contacts;
              }
            }
          }
          if (this.data.texts.length) {
            for (const text of this.data.texts) {
              if (text.assigned_contacts && text.assigned_contacts.length > 0) {
                const assigned_contacts = [];
                for (const contact of text.assigned_contacts) {
                  const index = this.deal.contacts.findIndex(
                    (item) => item._id === contact
                  );
                  if (index >= 0) {
                    assigned_contacts.push(this.deal.contacts[index]);
                  }
                }
                text.assigned_contacts = assigned_contacts;
              }
            }
          }
          if (this.data.tasks.length) {
            for (const task of this.data.tasks) {
              if (task.assigned_contacts && task.assigned_contacts.length > 0) {
                const assigned_contacts = [];
                for (const contact of task.assigned_contacts) {
                  const index = this.deal.contacts.findIndex(
                    (item) => item._id === contact
                  );
                  if (index >= 0) {
                    assigned_contacts.push(this.deal.contacts[index]);
                  }
                }
                task.assigned_contacts = assigned_contacts;
              }
            }
          }

          if (this.data.phone_logs.length) {
            for (const log of this.data.phone_logs) {
              if (log.assigned_contacts && log.assigned_contacts.length > 0) {
                const assigned_contacts = [];
                for (const contact of log.assigned_contacts) {
                  const index = this.deal.contacts.findIndex(
                    (item) => item._id === contact
                  );
                  if (index >= 0) {
                    assigned_contacts.push(this.deal.contacts[index]);
                  }
                }
                log.assigned_contacts = assigned_contacts;
              }
            }
          }
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
              }
              this.dataObj[key][e._id] = e;
            });
          }
        }

        this.changeTab(this.tab);
      });
  }

  groupActivities(): void {
    this.groupActions = {};
    this.mainTimelines = [];
    const groupTypeIndex = {};
    for (let i = this.activities.length - 1; i >= 0; i--) {
      const e = this.activities[i];
      const groupData = this.generateUniqueId(e);
      if (!groupData) {
        continue;
      }
      const { type, group } = groupData;

      e.group_id = group;
      if (this.activities[i].type == 'deals' && this.activities[i].contacts) {
        continue;
      }
      if (this.groupActions[group] && this.activities[i].type != 'deals') {
        this.groupActions[group].push(e);
      } else {
        this.groupActions[group] = [e];
        groupTypeIndex[group] = type;
      }
    }
    for (const group in this.groupActions) {
      if (this.trackers[group]) {
        for (const type in this.trackers[group]) {
          this.trackers[group][type].forEach((e) => {
            const activity = {};
            activity['type'] = type;
            activity['content'] = this.ACTIVITY_GEN[type][e.type];
            activity['created_at'] = e.created_at;
            activity['updated_at'] = e.updated_at;
            activity['videos'] = [];
            activity['pdfs'] = [];
            activity['images'] = [];
            // user,contacts,emails,texts,
            if (e.user && e.user instanceof Array) {
              activity['user'] = e.user[0];
            } else {
              activity['user'] = e.user;
            }
            if (e.contact && e.contact instanceof Array) {
              activity['contacts'] = e.contact[0];
            } else {
              activity['contacts'] = e.contact;
            }
            if (type === 'video_trackers') {
              if (e.video && e.video instanceof Array) {
                activity['videos'] = e.video;
              } else {
                activity['videos'] = [e.video];
              }
            }
            if (type === 'pdf_trackers') {
              if (e.pdf && e.pdf instanceof Array) {
                activity['pdfs'] = e.pdf;
              } else {
                activity['pdfs'] = [e.pdf];
              }
            }
            if (type === 'image_trackers') {
              if (e.image && e.image instanceof Array) {
                activity['images'] = e.image;
              } else {
                activity['images'] = [e.image];
              }
            }
            if (type === 'email_trackers') {
              if (e.email && e.email instanceof Array) {
                activity['emails'] = e.email[0];
              } else {
                activity['images'] = e.email;
              }
            }

            activity[type] = e;
            this.groupActions[group].push(
              new DetailActivity().deserialize(activity)
            );
          });

          this.groupActions[group].sort((a, b) =>
            a.created_at < b.created_at ? 1 : -1
          );
        }
      }

      const actions = this.groupActions[group].sort((a, b) =>
        a.updated_at < b.updated_at ? 1 : -1
      );

      this.mainTimelines.push(actions[0]);

      this.groups.push({
        type: groupTypeIndex[group],
        group,
        latest_time: actions[0].updated_at
      });
    }
    this.mainTimelines.sort((a, b) => {
      return a.updated_at < b.updated_at ? 1 : -1;
    });
    this.groups.sort((a, b) => {
      return a.latest_time < b.latest_time ? 1 : -1;
    });
  }

  getSiblings(): void {
    this.dealsService.getSiblings(this.dealId);
  }

  generateUniqueId(activity: DetailActivity): any {
    switch (activity.type) {
      case 'emails':
      case 'texts':
      case 'notes':
      case 'appointments':
      case 'follow_ups':
      case 'phone_logs':
        return {
          type: activity.type,
          group: activity[activity.type]
        };
      case 'deals':
        return {
          type: activity.type,
          group: activity._id
        };
    }
  }

  getActivityContent(media_type, tracker_type): string {
    let actionStr = '';
    switch (tracker_type) {
      case 'click':
        actionStr = 'clicked the link';
        break;
      case 'watch':
        actionStr = 'watched ';
        break;
      case 'open':
        actionStr = 'opened ';
        break;
      case 'unsubscribed':
        actionStr = 'unsubscribed ';
        break;
      case 'sent':
        actionStr = 'sent';
        break;
      case 'thumbs up':
        actionStr = 'gave thumbs up';
        return actionStr;
        break;
      default:
        actionStr = '';
    }

    return actionStr + ' ' + media_type.replace('_trackers', '');
  }

  generateMaterialActivity(trackers): any {
    const detailActivities = [];
    for (const key in trackers) {
      if (trackers[key] && trackers[key].length > 0) {
        for (const tracker of trackers[key]) {
          const activity = new DetailActivity();
          activity['_id'] = tracker._id;
          if (Array.isArray(tracker.contact)) {
            const contacts = [];
            for (const contact of tracker.contact) {
              const index = this.deal.contacts.findIndex(
                (item) => item._id === contact
              );
              if (index >= 0) {
                contacts.push(this.deal.contacts[index]);
              }
            }
            activity['assigned_contacts'] = [...contacts];
          } else {
            const index = this.deal.contacts.findIndex(
              (item) => item._id === tracker.contact
            );
            if (index >= 0) {
              activity['assigned_contacts'] = [this.deal.contacts[index]];
            } else {
              activity['assigned_contacts'] = [];
            }
          }
          if (Array.isArray(tracker.user)) {
            activity['user'] = tracker.user[0];
          } else {
            activity['user'] = tracker.user;
          }
          activity['type'] = key;
          activity['emails'] = tracker.email;
          activity[key] = tracker;
          activity['content'] = this.getActivityContent(key, tracker.type);
          activity['created_at'] = tracker.created_at;
          activity['updated_at'] = tracker.updated_at;
          if (Array.isArray(tracker.contact)) {
            activity['activity'] = tracker.activity[0];
          } else {
            activity['activity'] = tracker.activity;
          }

          detailActivities.push(activity);
        }
      }
    }
    detailActivities.sort((a, b) => {
      if (new Date(a.created_at + '') < new Date(b.created_at + '')) {
        return 1;
      }
      return -1;
    });

    return detailActivities;
  }

  showMoreDetail(group_id, activity = null): void {
    if (activity && !activity.loadExpand) {
      this.materialActivitySubscription &&
        this.materialActivitySubscription.unsubscribe();
      activity.loadingTracker = true;
      this.materialActivitySubscription = this.dealsService
        .getMaterialActivity(activity._id)
        .subscribe((res) => {
          if (res) {
            const detailActivities = this.generateMaterialActivity(res);
            if (this.groupActions[activity.group_id]) {
              for (const detailActivity of detailActivities) {
                const index = this.groupActions[activity.group_id].findIndex(
                  (item) => item._id === detailActivity._id
                );
                if (index < 0) {
                  this.groupActions[activity.group_id].push(detailActivity);
                  this.groupActions[activity.group_id] = [
                    ...this.groupActions[activity.group_id]
                  ];
                }
              }
            }
            activity['loadExpand'] = true;
          }
          activity.loadingTracker = false;
        });
    }
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
        const loadedEvent = { ...event };
        loadedEvent.meta.is_organizer = res.organizer.self;
        loadedEvent.meta.organizer = res.organizer.email;
        loadedEvent.meta.guests = res.attendees || [];
        loadedEvent.meta.guests.forEach((e) => {
          e.response = e.responseStatus;
        });
        this.loadedAppointments[event.meta.event_id] = loadedEvent;
        this.selectedAppointment = loadedEvent;
      });
  }

  openDetailEvent(detail, event): void {
    const _formattedEvent = {
      title: detail.title,
      start: new Date(detail.due_start),
      end: new Date(detail.due_end),
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
        organizer: detail.organizer
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
        this.overlayRef.detach();
        return;
      });
      this.overlayRef.attach(this.templatePortal);
    }
  }

  openAppointmentDlg(): void {
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

    this.dialog
      .open(CalendarDialogComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        maxHeight: '700px',
        data: {
          deal: this.dealId,
          contacts: this.deal.contacts
        }
      })
      .afterClosed()
      .subscribe((status) => {
        if (status) {
          this.reloadLatest(2);
        }
      });
  }

  openGroupCallDlg(): void {
    this.dialog
      .open(JoinCallRequestComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '530px',
        data: {
          deal: this.dealId,
          contacts: this.deal.contacts
        }
      })
      .afterClosed()
      .subscribe((status) => {
        if (status) {
          this.reloadLatest(2);
        }
      });
  }

  openSendEmail(): void {
    if (!this.emailDialog) {
      if (this.dealId) {
        this.draftSubscription && this.draftSubscription.unsubscribe();
        const draftData = {
          deal: this.dealId,
          type: 'deal_email'
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
              panelClass: 'send-email',
              backdropClass: 'cdk-send-email',
              disableClose: false,
              data: {
                deal: this.dealId,
                contacts: this.deal.contacts,
                type: 'deal_email',
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
              if (response && response.draft) {
                this.saveEmailDraft(response.draft);
                this.storeService.emailDealDraft.next({});
              }
              if (response && response.send) {
                const sendEmail = response.send;
                if (sendEmail._id) {
                  this.emailService
                    .removeDraft(sendEmail._id)
                    .subscribe((result) => {
                      if (result) {
                        this.draftEmail = new Draft();
                        this.storeService.emailDealDraft.next({});
                      }
                    });
                }
              }
              this.reloadLatest(3);
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
    const contacts = [];
    this.deal.contacts.forEach((e) => {
      if (e.cell_phone) {
        contacts.push(e);
      }
    });
    if (!contacts.length) {
      this.toast.error(
        '',
        `You can't message as any contacts of this deal don't have cell phone number.`
      );
      return;
    }
    if (!this.textDialog) {
      if (this.dealId) {
        this.draftSubscription && this.draftSubscription.unsubscribe();
        const draftData = {
          deal: this.dealId,
          type: 'deal_text'
        };
        this.draftSubscription = this.emailService
          .getDraft(draftData)
          .subscribe((res) => {
            if (res) {
              this.draftText = res;
            }
            this.textDialog = this.dialog.open(SendBulkTextComponent, {
              position: {
                bottom: '0px',
                right: '0px'
              },
              width: '96vw',
              maxWidth: '600px',
              panelClass: 'send-email',
              backdropClass: 'cdk-send-email',
              disableClose: false,
              data: {
                deal: this.dealId,
                contacts,
                draft_type: 'deal_text',
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
              if (response && response.draft) {
                this.saveTextDraft(response.draft);
                this.storeService.textDealDraft.next({});
              }
              if (response && response.send) {
                const sendText = response.send;
                if (sendText._id) {
                  this.emailService
                    .removeDraft(sendText._id)
                    .subscribe((result) => {
                      if (result) {
                        this.draftText = new Draft();
                        this.storeService.textDealDraft.next({});
                      }
                    });
                }
              }
              this.reloadLatest(3);
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

  openCall(): void {
    const contacts = [];
    this.deal.contacts.forEach((e) => {
      const contactObj = new Contact().deserialize(e);
      const contact = {
        contactId: contactObj._id,
        numbers: [contactObj.cell_phone],
        name: contactObj.fullName
      };
      contacts.push(contact);
    });
    if (!contacts.length) {
      this.toast.error('', `These deal contacts don't have cell phone.`);
      return;
    }
    this.handlerService.callCommand.next({
      contacts,
      type: 'bulk',
      deal: this.dealId
    });
  }

  openTaskDlg(): void {
    this.dialog
      .open(TaskCreateComponent, {
        ...DialogSettings.TASK,
        data: {
          contacts: this.deal.contacts,
          deal: this.dealId
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.reloadLatest(this.deal.contacts.length);
        }
      });
  }

  openNoteDlg(): void {
    this.dialog
      .open(NoteCreateComponent, {
        ...DialogSettings.NOTE,
        data: {
          deal: this.dealId,
          contacts: this.deal.contacts
        }
      })
      .afterClosed()
      .subscribe((status) => {
        if (status) {
          this.reloadLatest(2);
        }
      });
  }

  editDeal(): void {
    this.dealPanel = !this.dealPanel;
    this.dialog
      .open(DealEditComponent, {
        position: { top: '60px' },
        width: '100vw',
        maxWidth: '420px',
        disableClose: true,
        data: {
          type: 'deal',
          deal: this.deal.main
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.deal.main = { ...this.deal.main, ...res };
          this.selectedStageId = this.deal.main.deal_stage;
          this.changeSelectedStage();
        }
      });
  }

  moveDeal(stage): void {
    const data = {
      deal_id: this.dealId,
      position: stage.deals.length,
      deal_stage_id: stage._id
    };
    this.dealsService.moveDeal(data).subscribe((res) => {
      this.deal.main.deal_stage = stage._id;
      this.selectedStageId = stage._id;
      this.changeSelectedStage();
      this.reloadLatest(10);
    });
  }

  contactDetail(contact: any): void {
    this.router.navigate([`contacts/${contact._id}`]);
  }

  addContact(): void {
    this.contactsPanel = !this.contactsPanel;
    this.dialog
      .open(DealContactComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '500px',
        disableClose: true,
        data: {
          deal: this.dealId,
          exceedContacts: this.deal.contacts
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.data && res.data.length) {
          this.deal.contacts = _.unionWith(
            this.deal.contacts,
            res.data,
            _.isEqual
          );
          this.reloadLatest(res.data.length + 1);
        }
      });
  }

  removeContact(contact: Contact): void {
    this.dialog
      .open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Delete Contact',
          message: 'Are you sure you want to remove contact from this deal?',
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
                  .updateContact(this.dealId, 'remove', [contact._id])
                  .subscribe((status) => {
                    if (status) {
                      _.pullAllBy(
                        this.deal.contacts,
                        [{ _id: contact._id }],
                        '_id'
                      );
                      this.reloadLatest(2);
                    }
                  });
              }
              if (confirm === false) {
                this.dealsService
                  .updateContact(this.dealId, 'remove', [contact._id], false)
                  .subscribe((status) => {
                    if (status) {
                      _.pullAllBy(
                        this.deal.contacts,
                        [{ _id: contact._id }],
                        '_id'
                      );
                      this.reloadLatest(2);
                    }
                  });
              }
            });
          // this.dealsService
          //   .updateContact(this.dealId, 'remove', [contact._id])
          //   .subscribe((status) => {
          //     if (status) {
          //       _.pullAllBy(this.deal.contacts, [{ _id: contact._id }], '_id');
          //       this.reloadLatest(2);
          //     }
          //   });
        }
      });
  }

  removeDeal(): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Delete Deal',
          message: 'Are you sure to delete this deal?',
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
                  'Do you want to remove all the data and all the activities related this deal from contacts?',
                cancelLabel: 'No',
                confirmLabel: 'Yes'
              }
            })
            .afterClosed()
            .subscribe((confirm) => {
              if (confirm === true) {
                this.dealsService
                  .deleteDeal(this.dealId)
                  .subscribe((status) => {
                    if (status) {
                      this.backPage();
                    }
                  });
              }
              if (confirm === false) {
                this.dealsService
                  .deleteOnlyDeal(this.dealId)
                  .subscribe((status) => {
                    if (status) {
                      this.backPage();
                    }
                  });
              }
            });
          // this.dealsService.deleteDeal(this.dealId).subscribe((status) => {
          //   if (status) {
          //     this.backPage();
          //   }
          // });
        }
      });
  }

  changeTab(tab: TabItem): void {
    this.tab = tab;

    if (this.tab.id !== 'all') {
      this.showingDetails = [];
      if (tab.id === 'notes') {
        this.showingDetails = [...this.data.notes];
        return;
      }
      if (tab.id === 'appointments') {
        this.showingDetails = [...this.data.appointments];
        return;
      }
      if (tab.id === 'follow_ups') {
        this.changeSort(this.selectedTimeSort);
        return;
      }
      if (tab.id === 'emails') {
        this.activities.forEach((e) => {
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
      if (tab.id === 'texts') {
        this.activities.forEach((e) => {
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
                send_time: e.updated_at
              });
            }
          }
        });
        this.data.texts.forEach((e) => {
          this.showingDetails.push({
            ...e,
            data_type: 'texts',
            send_time: e.updated_at
          });
        });
        this.showingDetails.sort((a, b) =>
          a.send_time > b.send_time ? -1 : 1
        );
        return;
      }
    }
  }
  changeActivityTypes(tab: TabItem): void {
    this.activityType = tab;
  }
  changeSort(timeSort: any): void {
    this.showingDetails = [...this.data.tasks];
    this.selectedTimeSort = timeSort;

    let today;
    let weekDay;
    if (this.timezone.tz_name) {
      today = moment().tz(this.timezone.tz_name).startOf('day');
      weekDay = moment().tz(this.timezone.tz_name).startOf('week');
    } else {
      today = moment().utcOffset(this.timezone.zone).startOf('day');
      weekDay = moment().utcOffset(this.timezone.zone).startOf('week');
    }
    let start_date = today.clone();
    let end_date = today.clone();

    if (timeSort.id === 'all' || timeSort.id === 'future') {
      const last_recurrence = [];
      this.showingDetails = _.orderBy(
        this.showingDetails.filter((detail) => {
          if (detail.set_recurrence && !detail.due_date) {
            return false;
          }

          if (timeSort.id === 'future') {
            start_date = weekDay.clone().add(2, 'week');
            if (moment(detail.due_date).isBefore(start_date)) {
              return false;
            }
          }

          if (
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
        }),
        ['due_date', 'updated_at'],
        ['asc', 'asc']
      );
      return;
    }

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

  showDetail(event: any): void {
    const target: HTMLElement = event.target as HTMLElement;
    const parent: HTMLElement = target.closest(
      '.main-history-item'
    ) as HTMLElement;
    if (parent) {
      parent.classList.add('expanded');
    }
  }
  hideDetail(event: any): void {
    const target: HTMLElement = event.target as HTMLElement;
    const parent: HTMLElement = target.closest(
      '.main-history-item'
    ) as HTMLElement;
    if (parent) {
      parent.classList.remove('expanded');
    }
  }

  updateNote(activity: any): void {
    if (!activity || !activity.activity_detail) {
      return;
    }
    const data = {
      note: activity.activity_detail,
      type: 'deal',
      deal_name: this.deal.main.title
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
          activity.activity_detail = note;
          if (this.detailData && this.detailData[note._id]) {
            this.detailData[note._id].content = note.content;
          }
          this.changeTab(this.tab);
        }
      });
  }

  updateNoteDetail(detail: any): void {
    if (!detail) {
      return;
    }
    const data = {
      note: detail,
      type: 'deal',
      deal_name: this.deal.main.title
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
          this.activities.some((e) => {
            if (e.type !== 'notes') {
              return;
            }
            if (e.activity_detail && e.activity_detail._id === detail._id) {
              e.activity_detail.content = note.content;
              return true;
            }
          });
          this.arrangeActivity();
          if (this.detailData && this.detailData[note._id]) {
            this.detailData[note._id].content = note.content;
          }
          this.changeTab(this.tab);
        }
      });
  }

  deleteNote(activity: any): void {
    this.dialog
      .open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Delete Note',
          message: 'Are you sure to delete the note?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Delete'
        }
      })
      .afterClosed()
      .subscribe((confirm) => {
        if (confirm) {
          this.dealsService
            .removeNote({ note: activity.activity_detail._id })
            .subscribe((res) => {
              if (res) {
                delete this.detailData[activity.activity_detail._id];
                _.pullAllBy(
                  this.showingDetails,
                  { _id: activity.activity_detail._id },
                  '_id'
                );
                this.activities.forEach((e) => {
                  const detail = e.activity_detail;
                  if (detail && detail._id === activity.activity_detail._id) {
                    delete e.activity_detail;
                  }
                });
                this.arrangeActivity();
              }
            });
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
          confirmLabel: 'Delete'
        }
      })
      .afterClosed()
      .subscribe((confirm) => {
        if (confirm) {
          this.dealsService
            .removeNote({ note: detail._id })
            .subscribe((res) => {
              if (res) {
                this.activities.forEach((e) => {
                  if (e.type !== 'notes') {
                    return;
                  }
                  if (
                    e.activity_detail &&
                    e.activity_detail._id === detail._id
                  ) {
                    e.activity_detail = null;
                    return true;
                  }
                });
                this.mainTimelines.forEach((e, i) => {
                  if (e.notes == detail._id) {
                    this.mainTimelines.splice(i, 1);
                  }
                });
                this.arrangeActivity();
                delete this.detailData[detail._id];
                this.changeTab(this.tab);
              }
            });
        }
      });
  }

  editTask(task: any): void {
    const data = { ...task };

    this.dialog
      .open(TaskEditComponent, {
        width: '98vw',
        maxWidth: '394px',
        data: {
          type: 'deal',
          deal: this.deal.main._id,
          task: new TaskDetail().deserialize(data)
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.status == 'deleted') {
            const taskId = task._id;
            const parent_follow_up = this.dataObj.tasks[taskId]
              .parent_follow_up;
            let deleted;
            if (res.deleted_all && parent_follow_up) {
              deleted = _.remove(
                this.data.tasks,
                (e) =>
                  e.parent_follow_up === parent_follow_up &&
                  e.status === task.status
              );
            } else {
              deleted = _.remove(this.data.tasks, (e) => e._id === taskId);
            }

            deleted.forEach((e) => {
              delete this.dataObj.tasks[e._id];

              this.activities.forEach((ele) => {
                const detail = ele.activity_detail;
                if (detail && detail._id === e._id) {
                  delete ele.activity_detail;
                }
              });

              this.mainTimelines = _.pullAllBy(
                this.mainTimelines,
                [{ type: 'follow_ups', follow_ups: e._id }],
                'follow_ups'
              );
            });

            this.arrangeActivity();
            this.changeTab(this.tab);
          } else {
            this.loadActivity();
          }
        }
        // Update Activity
      });
  }

  completeTask(task: any): void {
    const data = {
      ...task
    };

    this.dialog
      .open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Complete Task',
          message: 'Are you sure to complete the task?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Complete'
        }
      })
      .afterClosed()
      .subscribe((confirm) => {
        if (confirm) {
          this.dealsService
            .completeFollowUp({
              followup: data._id,
              deal: this.deal.main._id,
              status: 1
            })
            .subscribe((status) => {
              if (status) {
                this.reloadLatest(2);
              }
            });
        }
      });
  }

  archiveTask(activity): void {
    const taskId = activity._id;
    if (
      activity.set_recurrence &&
      activity.status !== 1 &&
      (this.selectedTimeSort.id === 'all' || this.tab.id == 'all')
    ) {
      this.dialog
        .open(TaskRecurringDialogComponent, {
          disableClose: true,
          data: {
            title: 'Delete the recurring task.'
          }
        })
        .afterClosed()
        .subscribe((confirm) => {
          if (!confirm) {
            return;
          }
          const include_recurrence = confirm.type == 'all';

          this.dealsService
            .removeFollowUp({ followup: taskId, include_recurrence })
            .subscribe((status) => {
              if (status) {
                const parent_follow_up = this.dataObj.tasks[taskId]
                  .parent_follow_up;
                if (include_recurrence && parent_follow_up) {
                  const deleted = _.remove(
                    this.data.tasks,
                    (e) =>
                      e.parent_follow_up === parent_follow_up &&
                      e.status === activity.status
                  );
                  deleted.forEach((e) => {
                    delete this.dataObj.tasks[e._id];
                    this.activities = _.pullAllBy(
                      this.activities,
                      [{ type: 'follow_ups', follow_ups: e._id }],
                      'follow_ups'
                    );
                    this.mainTimelines = _.pullAllBy(
                      this.mainTimelines,
                      [{ type: 'follow_ups', follow_ups: e._id }],
                      'follow_ups'
                    );
                  });
                } else {
                  _.remove(this.data.tasks, (e) => e._id === taskId);
                  delete this.dataObj.tasks[taskId];
                  this.groupActivities();
                }

                this.arrangeActivity();
                this.changeTab(this.tab);
              }
            });
        });
    } else {
      this.dialog
        .open(ConfirmComponent, {
          ...DialogSettings.CONFIRM,
          data: {
            title: 'Delete Task',
            message: 'Are you sure to delete the task?',
            cancelLabel: 'Cancel',
            confirmLabel: 'Delete'
          }
        })
        .afterClosed()
        .subscribe((confirm) => {
          if (confirm) {
            this.dealsService
              .removeFollowUp({ followup: taskId })
              .subscribe((status) => {
                if (status) {
                  this.activities = _.pullAllBy(
                    this.activities,
                    [{ type: 'follow_ups', follow_ups: taskId }],
                    'follow_ups'
                  );
                  this.mainTimelines = _.pullAllBy(
                    this.mainTimelines,
                    [{ type: 'follow_ups', follow_ups: taskId }],
                    'follow_ups'
                  );
                  this.data.tasks = _.pullAllBy(
                    this.data.tasks,
                    [{ _id: taskId }],
                    '_id'
                  );
                  delete this.dataObj.tasks[taskId];
                  this.arrangeActivity();
                  this.changeTab(this.tab);
                }
              });
          }
        });
    }
  }

  editGroupCall(): void {}

  removeGroupCall(): void {}

  editAppointment(activity: any, isReal: boolean = false): void {
    let data;
    if (isReal) {
      data = {
        ...activity
      };
    } else {
      if (!activity || !activity.activity_detail) {
        return;
      }
      data = {
        ...activity.activity_detail
      };
    }

    const _formattedEvent = {
      appointment: data._id,
      title: data.title,
      start: new Date(data.due_start),
      end: new Date(data.due_end),
      meta: {
        contacts: data.contacts,
        calendar_id: data.calendar_id,
        description: data.description,
        location: data.location,
        type: data.type,
        guests: data.guests,
        event_id: data.event_id,
        recurrence: data.recurrence,
        recurrence_id: data.recurrence_id,
        is_organizer: data.is_organizer,
        organizer: data.organizer
      }
    };

    this.dialog
      .open(CalendarDialogComponent, {
        width: '98vw',
        maxWidth: '600px',
        data: {
          deal: this.deal.main._id,
          event: _formattedEvent
        }
      })
      .afterClosed()
      .subscribe((status) => {
        if (status) {
          this.reloadLatest(3);
        }
      });
  }

  removeAppointment(activity: any, isReal: boolean = false): void {
    let data;
    if (isReal) {
      data = {
        ...activity
      };
    } else {
      if (!activity || !activity.activity_detail) {
        return;
      }
      data = {
        ...activity.activity_detail
      };
    }

    const _formattedEvent = {
      appointment: data._id,
      title: data.title,
      start: new Date(data.due_start),
      end: new Date(data.due_end),
      meta: {
        contacts: data.contacts,
        calendar_id: data.calendar_id,
        description: data.description,
        location: data.location,
        type: data.type,
        guests: data.guests,
        event_id: data.event_id,
        recurrence: data.recurrence,
        recurrence_id: data.recurrence_id,
        is_organizer: data.is_organizer,
        organizer: data.organizer
      }
    };

    const calendars = this.appointmentService.subCalendars.getValue();
    const currentCalendar = calendars[_formattedEvent.meta.calendar_id];
    if (!currentCalendar) {
      // OPEN ALERT & CLOSE OVERLAY
      return;
    }
    const connected_email = currentCalendar.account;

    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Delete Appointment',
          message: 'Are you sure to delete the appointment?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Delete'
        }
      })
      .afterClosed()
      .subscribe((confirm) => {
        if (confirm) {
          this.dealsService
            .removeAppointment({
              connected_email,
              recurrence_id: _formattedEvent.meta.recurrence_id,
              event_id: _formattedEvent.meta.event_id,
              calendar_id: _formattedEvent.meta.calendar_id
            })
            .subscribe((status) => {});
        }
      });
  }

  arrangeActivity(): void {
    this.activityCounts = {
      all: 0,
      notes: 0,
      emails: 0,
      texts: 0,
      appointments: 0,
      group_calls: 0,
      follow_ups: 0
    };
    if (this.mainTimelines.length > 0) {
      this.mainTimelines.forEach((activity) => {
        if (activity.type == 'notes') {
          this.activityCounts.notes++;
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
          this.activityCounts.emails++;
          this.activityCounts.all++;
        }
        if (activity.type == 'texts') {
          this.activityCounts.texts++;
          this.activityCounts.all++;
        }
        if (activity.type == 'appointments') {
          this.activityCounts.appointments++;
          this.activityCounts.all++;
        }
        if (activity.type == 'team_calls') {
          this.activityCounts.group_calls++;
          this.activityCounts.all++;
        }
        if (activity.type == 'follow_ups') {
          this.activityCounts.follow_ups++;
          this.activityCounts.all++;
        }
        if (activity.type == 'deals') {
          this.activityCounts.all++;
        }
      });
    }
  }

  setLastActivity(): void {
    for (const activity of this.activities) {
      if (this.details[activity.type]) {
        const index = this.details[activity.type].findIndex(
          (item) => item._id === activity[activity.type]
        );
        if (index >= 0) {
          const trackerActivity = this.details[activity.type][index];
          const trackers = {};
          for (const key in trackerActivity) {
            if (key.indexOf('_tracker') >= 0) {
              trackers[key + 's'] = [trackerActivity[key]];
            }
          }
          if (Object.keys(trackers).length) {
            const detailActivities = this.generateMaterialActivity(trackers);
            if (this.groupActions[activity.group_id]) {
              this.groupActions[activity.group_id] = [
                ...detailActivities,
                ...this.groupActions[activity.group_id]
              ];

              const actions = this.groupActions[
                activity.group_id
              ].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));

              this.mainTimelines.find(
                (e) => e.group_id == activity.group_id
              ).updated_at = actions[0].updated_at;

              this.groups.find(
                (e) => e.group == activity.group_id
              ).latest_time = actions[0].updated_at;
            }
          }
        }
      }
    }

    this.mainTimelines.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
    this.groups.sort((a, b) => (a.latest_time < b.latest_time ? 1 : -1));
  }

  /**
   * Focus the cursor to the editor
   * @param formControl: Input Form Control
   */
  focusTitle(): void {
    this.titleEditable = true;
    this.dealTitle = this.deal.main.title;
    setTimeout(() => {
      if (this.element.nativeElement.querySelector('.title-input')) {
        this.element.nativeElement.querySelector('.title-input').focus();
      }
    }, 200);
  }
  checkAndSave(event): void {
    if (event.keyCode === 13) {
      if (this.deal.main.title === this.dealTitle) {
        this.titleEditable = false;
        return;
      }
      this.saving = true;
      this.saveSubscription && this.saveSubscription.unsubscribe();
      this.saveSubscription = this.dealsService
        .editDeal(this.dealId, {
          title: this.dealTitle,
          deal_stage: this.deal.main.deal_stage
        })
        .subscribe((res) => {
          this.saving = false;
          if (res) {
            this.deal.main.title = this.dealTitle;
            this.titleEditable = false;
          }
        });
    }
  }

  getPrevPage(): string {
    if (!this.handlerService.previousUrl) {
      return 'to Deals';
    }
    for (const route in ROUTE_PAGE) {
      if (this.handlerService.previousUrl === route) {
        return 'to ' + ROUTE_PAGE[route];
      }
    }
    return '';
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
    if (durationTime) {
      return durationTime[0].text;
    }
  }

  convertContent(content = ''): any {
    const htmlContent = content.split('<div>');
    let convertString = '';
    htmlContent.forEach((html) => {
      if (html.indexOf('material-object') !== -1) {
        convertString = convertString + html.match('<a(.*)a>')[0];
      }
    });
    return convertString;
  }

  editAdditional($event): void {
    if ($event) {
      $event.stopPropagation();
      $event.preventDefault();
    }
    this.dialog
      .open(AdditionalEditComponent, {
        width: '98vw',
        maxWidth: '600px',
        data: {
          type: 'deal',
          deal: {
            ...this.deal.main
          }
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          // this.toast.success('Successfully updated additional information.');
          this.deal.main.additional_field = {};
          for (const field of res) {
            this.deal.main.additional_field[field.name] = field.value;
          }
        }
      });
  }

  isEmptyObject(obj): boolean {
    if (obj) {
      return Object.keys(obj).length === 0;
    }
    return true;
  }

  addAdditionalFields(): void {
    this.dialog
      .open(AdditionalFieldsComponent, {
        maxWidth: '480px',
        width: '96vw',
        disableClose: true,
        data: {
          additional_field: { ...this.deal.main.additional_field }
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.deal.main.additional_field = { ...res };
          this.updateSubscription = this.dealsService
            .editDeal(this.deal.main._id, this.deal.main)
            .subscribe((deal) => {
              if (deal) {
              }
            });
        }
      });
  }

  removeActivity(activity): void {}

  reloadLatest(count = 20): void {
    this.loading = true;
    this.dGroups.splice(0);
    this.reloadSubscription && this.reloadSubscription.unsubscribe();
    this.reloadSubscription = this.dealsService
      .getActivity({
        deal: this.dealId,
        count: count || 20
      })
      .subscribe((res) => {
        this.loading = false;
        let activities = res['activity'].map((e) =>
          new DetailActivity().deserialize(e)
        );

        const activityDetails = res['details'];

        for (const activity of activities) {
          if (activity.type === 'notes') {
            const index = activityDetails['notes'].findIndex(
              (item) => item._id === activity['notes']
            );
            if (index >= 0) {
              const contacts =
                activityDetails['notes'][index]['assigned_contacts'];
              const assignedContacts = [];
              for (const contact of contacts) {
                const contactIndex = this.deal.contacts.findIndex(
                  (item) => item._id === contact
                );
                if (contactIndex >= 0) {
                  assignedContacts.push(this.deal.contacts[contactIndex]);
                }
              }
              activity['assigned_contacts'] = assignedContacts;
            }
          }
          if (activity.type === 'texts') {
            const index = activityDetails['texts'].findIndex(
              (item) => item._id === activity['texts']
            );
            if (index >= 0) {
              const contacts =
                activityDetails['texts'][index]['assigned_contacts'];
              const assignedContacts = [];
              for (const contact of contacts) {
                const contactIndex = this.deal.contacts.findIndex(
                  (item) => item._id === contact
                );
                if (contactIndex >= 0) {
                  assignedContacts.push(this.deal.contacts[contactIndex]);
                }
              }
              activity['assigned_contacts'] = assignedContacts;
            }
          }

          if (activity.type === 'emails') {
            const index = activityDetails['emails'].findIndex(
              (item) => item._id === activity['emails']
            );
            if (index >= 0) {
              const contacts =
                activityDetails['emails'][index]['assigned_contacts'];
              const assignedContacts = [];
              for (const contact of contacts) {
                const contactIndex = this.deal.contacts.findIndex(
                  (item) => item._id === contact
                );
                if (contactIndex >= 0) {
                  assignedContacts.push(this.deal.contacts[contactIndex]);
                }
              }
              activity['assigned_contacts'] = assignedContacts;
            }
          }

          if (activity.type === 'follow_ups') {
            const index = activityDetails['tasks'].findIndex(
              (item) => item._id === activity['follow_ups']
            );
            if (index >= 0) {
              const contacts =
                activityDetails['tasks'][index]['assigned_contacts'];
              const assignedContacts = [];
              for (const contact of contacts) {
                const contactIndex = this.deal.contacts.findIndex(
                  (item) => item._id === contact
                );
                if (contactIndex >= 0) {
                  assignedContacts.push(this.deal.contacts[contactIndex]);
                }
              }
              activity['assigned_contacts'] = assignedContacts;
            }
          }

          if (activity.type === 'phone_logs') {
            const index = activityDetails['phone_logs'].findIndex(
              (item) => item._id === activity['phone_logs']
            );
            if (index >= 0) {
              const contacts =
                activityDetails['phone_logs'][index]['assigned_contacts'];
              const assignedContacts = [];
              for (const contact of contacts) {
                const contactIndex = this.deal.contacts.findIndex(
                  (item) => item._id === contact
                );
                if (contactIndex >= 0) {
                  assignedContacts.push(this.deal.contacts[contactIndex]);
                }
              }
              activity['assigned_contacts'] = assignedContacts;
            }
          }
        }

        const details = res['details'];
        let materials = details['materials'] || [];
        let notes = details['notes'] || [];
        let emails = details['emails'] || [];
        let texts = details['texts'] || [];
        let appointments = details['appointments'] || [];
        let tasks = details['tasks'] || [];
        let phone_logs = details['phone_logs'] || [];

        this.details['materials'] = [...materials, ...this.data.materials];
        this.details['notes'] = [...notes, ...this.data.notes];
        this.details['emails'] = [...emails, ...this.data.emails];
        this.details['texts'] = [...texts, ...this.data.texts];
        this.details['appointments'] = [
          ...appointments,
          ...this.data.appointments
        ];
        this.details['tasks'] = [...tasks, ...this.data.tasks];
        this.details['phone_logs'] = [...phone_logs, ...this.data.phone_logs];

        if (tasks.length) {
          for (const task of tasks) {
            if (task.assigned_contacts && task.assigned_contacts.length > 0) {
              const assigned_contacts = [];
              for (const contact of task.assigned_contacts) {
                const index = this.deal.contacts.findIndex(
                  (item) => item._id === contact
                );
                if (index >= 0) {
                  assigned_contacts.push(this.deal.contacts[index]);
                }
              }
              task.assigned_contacts = assigned_contacts;
            }
          }
        }
        const trackers = details['trackers'] || {};
        activities = [...activities, ...this.activities];
        activities.sort((a, b) => (a.updated_at > b.updated_at ? 1 : -1));
        materials = [...materials, ...this.data.materials];
        notes = [...notes, ...this.data.notes];
        emails = [...emails, ...this.data.emails];
        texts = [...texts, ...this.data.texts];
        appointments = [...appointments, ...this.data.appointments];
        tasks = [...tasks, ...this.data.tasks];
        phone_logs = [...phone_logs, ...this.data.phone_logs];
        this.activities = _.uniqBy(activities, '_id');
        this.data.materials = _.uniqBy(materials, '_id');
        this.data.notes = _.uniqBy(notes, '_id');
        this.data.emails = _.uniqBy(emails, '_id');
        this.data.texts = _.uniqBy(texts, '_id');
        this.data.appointments = _.uniqBy(appointments, '_id');
        this.data.tasks = _.uniqBy(tasks, '_id');
        for (const key in trackers) {
          if (this.trackers[key]) {
            for (const field in trackers[key]) {
              let originalTrackers = this.trackers[key][field];
              const incomingTrackers = trackers[key][field];
              originalTrackers = [...incomingTrackers, ...originalTrackers];
              originalTrackers = _.uniqBy(originalTrackers, '_id');
              this.trackers[key][field] = originalTrackers;
            }
          } else {
            this.trackers[key] = trackers[key];
          }
        }
        this.groups = [];
        this.groupActivities();
        this.arrangeActivity();
        this.setLastActivity();
        this.getTimeLines();
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
              }
              this.dataObj[key][e._id] = e;
            });
          }
        }

        (this.details['sub_calls'] || []).forEach((call) => {
          const key = call.shared_log;
          if (!this.sub_calls[key] || !this.sub_calls[key].length) {
            this.sub_calls[key] = [call];
          } else {
            this.sub_calls[key].push(call);
          }
        });
        for (const key in this.sub_calls) {
          this.sub_calls[key] = _.uniqBy(this.sub_calls[key], '_id');
        }

        setTimeout(() => {
          this.changeTab(this.tab);
        }, 500);
      });
    this.mainTimelines.forEach((e) => (e.loadExpand = false));
  }

  isDisableTab(tabItem): boolean {
    const index = this.disableTabs.findIndex((item) => item.id === tabItem.id);
    return index >= 0;
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
            const draftData = this.storeService.emailDealDraft.getValue();
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
            const draftData = this.storeService.textDealDraft.getValue();
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

  saveEmailDraft(data): void {
    if (this.draftEmail && this.draftEmail.user) {
      if (!data.content && !data.subject) {
        this.removeEmailDraftSubscription && this.removeEmailDraftSubscription;
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
            this.updateEmailDraftSubscription;
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
        this.removeTextDraftSubscription && this.removeTextDraftSubscription;
        this.removeTextDraftSubscription = this.emailService
          .removeDraft(this.draftText._id)
          .subscribe((res) => {
            if (res) {
              this.draftText = null;
            }
          });
      } else {
        if (data.content !== this.draftText.content) {
          this.updateTextDraftSubscription && this.updateTextDraftSubscription;
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

  getActivityIcon(group_id, activity): string {
    if (this.groupActions[group_id] && this.groupActions[group_id].length > 0) {
      const type = this.groupActions[group_id][0].type;
      return type + ' ' + this.groupActions[group_id][0][type]?.type;
    }
    return activity.type + ' ' + activity[activity.type]?.type;
  }

  getActivityLabel(group_id, activity): string {
    if (this.groupActions[group_id] && this.groupActions[group_id].length > 0) {
      const type = this.groupActions[group_id][0].type;
      if (type) {
        if (this.groupActions[group_id][0][type].type) {
          return this.getActivityContent(
            type,
            this.groupActions[group_id][0][type]?.type
          );
        } else {
          return this.groupActions[group_id][0].content;
        }
      }
    }
    return activity.content;
  }

  getActivityFromDetail(detail): any {
    let type = '';
    for (const key in this.details) {
      if (this.details[key] && this.details[key].length > 0) {
        const index = this.details[key].findIndex(
          (item) => item._id === detail._id
        );
        if (index >= 0) {
          type = key;
          break;
        }
      }
    }
    const index = this.activities.findIndex(
      (item) => item[type] === detail._id
    );
    if (index >= 0) {
      return this.activities[index];
    }
    return detail;
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

  assignAutomation(): void {
    if (!this.selectedAutomation) {
      return;
    }
    const contactIds = [];
    for (const contact of this.deal.contacts) {
      contactIds.push(contact._id);
    }
    if (this.allDataSource.data.length) {
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
            this.assignSubscription && this.assignSubscription.unsubscribe();
            this.automationService
              .bulkAssign(this.selectedAutomation._id, null, [this.dealId])
              .subscribe((res) => {
                this.assigning = false;
                this.getTimeLines();
              });
          }
        });
    } else {
      this.assigning = true;
      this.assignSubscription && this.assignSubscription.unsubscribe();
      this.automationService
        .bulkAssign(this.selectedAutomation._id, null, [this.dealId])
        .subscribe((res) => {
          this.assigning = false;
          this.getTimeLines();
        });
    }
  }

  closeAutomation(): void {
    if (!this.allDataSource.data.length) {
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
          this.automationService.unAssignDeal(this.dealId).subscribe((res) => {
            this.canceling = false;
            if (res) {
              this.getTimeLines();
            }
          });
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

  showFullAutomation(): void {
    this.dialog.open(AutomationShowFullComponent, {
      position: { top: '100px' },
      width: '98vw',
      maxWidth: '700px',
      height: 'calc(65vh + 70px)',
      data: {
        id: this.automation._id,
        automation: this.automation,
        timelines: this.timeLines,
        type: 'deal'
      }
    });
  }

  getTimeLines(): void {
    this.dealsService.getTimeLines(this.dealId).subscribe((res) => {
      if (res) {
        this.timeLines = res['time_lines'];
        this.automation = res['automation'];
        this.timeLineArrangement();
      }
    });
  }

  remakeTimeLines(): void {
    if (this.timeLines && this.timeLines.length > 0) {
      for (const e of this.timeLines) {
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
    this.allDataSource = new MatTreeNestedDataSource<any>();
    if (!this.timeLines || this.timeLines.length == 0) {
      return;
    }

    this.remakeTimeLines();

    let rootNode = new Timeline();

    // get root node in timelines
    let rootNodeId = this.timeLines[0].parent_ref;
    if (rootNodeId !== 'a_10000') {
      while (true) {
        const rootIndex = this.timeLines.findIndex(
          (item) => item.ref === rootNodeId
        );
        if (rootIndex >= 0) {
          rootNodeId = this.timeLines[rootIndex].parent_ref;
        } else {
          break;
        }
      }
    }

    rootNode = Object.assign({}, this.timeLines[rootNodeId]);

    if (rootNodeId === 'a_10000') {
      // add root node.
      rootNode.ref = 'a_10000';
      rootNode.parent_ref = '0';
      rootNode.root = true;

      this.timeLines.unshift(rootNode);
      this.allDataSource.data = listToTree(
        this.timeLines,
        rootNode.parent_ref,
        'deal'
      );
    } else {
      this.allDataSource.data = listToTree(this.timeLines, rootNodeId, 'deal');
    }

    let root = null;
    if (this.allDataSource.data?.length == 0) {
      return;
    }
    // if (this.allDataSource.data[0]?.status == 'completed') {
    //   root = JSON.parse(JSON.stringify(this.allDataSource.data[0]));
    // } else {
    //   return;
    // }
    root = JSON.parse(JSON.stringify(this.allDataSource.data[0]));

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
      for (const firstChild of root.children)
        for (const secondChild of firstChild.children)
          secondChild.children = [];

      this.dataSource = new MatTreeNestedDataSource<any>();
      this.dataSource.data.push(root);
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

  activeActionsCount(): number {
    let count = 0;
    for (const timeline of this.timeLines) {
      if (timeline.status === 'active') {
        count++;
      }
    }
    return count;
  }

  isBranchNode(node): boolean {
    if (node && this.timeLines.length > 0) {
      const siblingNodes = [];
      for (const item of this.timeLines) {
        if (item.parent_ref === node.parent_ref) {
          siblingNodes.push(item);
        }
      }
      if (siblingNodes.length >= 2 && !node.condition) {
        return true;
      }
    }
    return false;
  }

  setPrimaryContact(contact): void {
    if (contact) {
      this.setPrimaryContactSubscription &&
        this.setPrimaryContactSubscription.unsubscribe();
      this.dealsService
        .setPrimaryContact(this.dealId, contact._id)
        .subscribe((res) => {
          if (res) {
            this.deal.primary_contact = contact._id;
          }
        });
    }
  }

  isPrimaryContact(contact): boolean {
    if (this.deal.primary_contact && contact) {
      if (this.deal.primary_contact === contact._id) {
        return true;
      }
    }
    return false;
  }

  ICONS = {
    follow_up: AUTOMATION_ICONS.FOLLOWUP,
    update_follow_up: AUTOMATION_ICONS.UPDATE_FOLLOWUP,
    note: AUTOMATION_ICONS.CREATE_NOTE,
    text: AUTOMATION_ICONS.SEND_TEXT,
    email: AUTOMATION_ICONS.SEND_EMAIL,
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
      let recurrences = this.data.tasks
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

  clickExpand() {
    this.showAll = !this.showAll;
    if (this.showAll) {
      this.showText = 'Show only 5 contacts';
      this.sliceNum = this.deal.contacts.length;
    } else {
      this.showText = 'Show all';
      this.sliceNum = 5;
    }
  }
}
