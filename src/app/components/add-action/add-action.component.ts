import {
  Component,
  OnInit,
  Inject,
  ViewChild,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  ChangeDetectorRef,
  ApplicationRef,
  Output,
  EventEmitter
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import {
  ACTION_CAT,
  TIMES,
  DefaultMessage,
  AUTOMATION_ICONS,
  STATUS,
  CALENDAR_DURATION,
  AUTOMATION_ATTACH_SIZE
} from 'src/app/constants/variable.constants';
import { MaterialService } from 'src/app/services/material.service';
import { Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { FileService } from 'src/app/services/file.service';
import { TabItem } from '../../utils/data.types';
import { Task } from '../../models/task.model';
import { HtmlEditorComponent } from 'src/app/components/html-editor/html-editor.component';
import * as moment from 'moment';
import 'moment-timezone';
import { Template } from 'src/app/models/template.model';
import { searchReg } from 'src/app/helper';
import { StoreService } from 'src/app/services/store.service';
import { TemplatesService } from '../../services/templates.service';
import { ConnectService } from '../../services/connect.service';
import { TemplatePortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ToastrService } from 'ngx-toastr';
import { DealsService } from '../../services/deals.service';
import { MaterialBrowserComponent } from '../material-browser/material-browser.component';
import { environment } from '../../../environments/environment';
import { HelperService } from '../../services/helper.service';
import * as _ from 'lodash';
import { ConfirmComponent } from '../confirm/confirm.component';
import { CaseMaterialConfirmComponent } from '../case-material-confirm/case-material-confirm.component';
import { CaseConfirmPercentComponent } from '../case-confirm-percent/case-confirm-percent.component';
import { AppointmentService } from '../../services/appointment.service';
import { LabelService } from 'src/app/services/label.service';
import { DialerService } from '../../services/dialer.service';
@Component({
  selector: 'app-add-action',
  templateUrl: './add-action.component.html',
  styleUrls: ['./add-action.component.scss']
})
export class AddActionComponent implements OnInit {
  minDate;

  stepIndex = 1; // ACTION DEFINE STEP | 1: Action List View, 2: Action Detail Setting
  type = ''; // ACTION TYPE
  category; // ACTION CATEGORY
  action = {}; // ACTION CONTENT
  submitted = false; // SUBMITTING FALSE
  conditionAction = []; // Condition Case Action corresponds the prev action
  material_type = '';
  STATUS = STATUS;
  isCalendly = false;

  videos = [];
  videosLoading = false;

  pdfs = [];
  pdfsLoading = false;

  images = [];
  imagesLoading = false;

  materialError = '';
  templateLoadingSubscription: Subscription;
  isProcessing = true;
  templates;
  templateLoadError = '';
  myControl = new FormControl();
  selectedTemplate: Template = new Template();
  // Follow Create
  due_date = {
    year: '',
    month: '',
    day: ''
  };
  due_time = '12:00:00.000';
  due_duration = 1;
  times = TIMES;
  followDueOption = 'delay';
  plan_time = { day: 0, hour: 1, min: 0 };
  plan_time_delay = 1;
  // Contact Update
  contactUpdateOption = 'update_label';
  labels = [];
  labelsLoading = false;
  labelsLoadError = '';
  commandLabel = ''; // Label
  pushCommandTags = [];
  pullCommandTags = [];
  actionData;
  mediaType = '';
  materialType = '';

  default = {
    sms: '',
    email: ''
  };

  // periodOption = 'gap'
  // condPeriodOption = 'limit';

  currentUser;
  task = new Task();
  attachLimit = AUTOMATION_ATTACH_SIZE;

  selectedTimezone = moment.tz.guess();

  @ViewChild('editor') htmlEditor: HtmlEditorComponent;
  @ViewChild('searchInput') searchField: ElementRef;
  @ViewChild('subjectField') subjectField: ElementRef;
  error = '';

  selectedFollow: any;
  followUpdateOption = 'no_update';
  updateFollowDueOption = 'date';
  update_due_date = {
    year: '',
    month: '',
    day: ''
  };
  update_due_time = '12:00:00.000';
  update_due_duration = 0;
  selectedDate = '';

  searchStr = '';
  filterVideos = [];
  filterPdfs = [];
  filterImages = [];
  commandName;
  loadSubscription: Subscription;
  profileSubscription: Subscription;
  dialerSubscription: Subscription;

  @ViewChild('smsContentField') textAreaEl: ElementRef;

  set = 'twitter';
  templatePortal: TemplatePortal;
  @ViewChild('createNewSMSContent') createNewSMSContent: TemplateRef<unknown>;
  @ViewChild('createNewEmailContent') createNewEmailContent: TemplateRef<
    unknown
  >;
  overlayRef: OverlayRef;
  templateSubject = '';
  templateValue = '';
  stages: any[] = [];
  deal_name = '';
  deal_stage = '';
  popup;
  recordUrl = 'https://crmgrow-record.s3-us-west-1.amazonaws.com';
  authToken = '';
  userId: string = '';
  attachments = [];
  materials = [];
  rvms = [];

  smsContentCursorStart = 0;
  smsContentCursorEnd = 0;
  smsContent = '';
  subjectFocus = false;
  contentFocus = false;

  dealNameCursorStart = 0;
  dealNameCursorEnd = 0;
  dealNameFocus = false;

  parentAction = {};

  moveDealOption = 'next';
  automation_type = 'contact';
  selectedAutomation = null;
  automation = null;
  isAvailableAssignAt: false;

  calendar_durations = CALENDAR_DURATION;
  appointmentEvent = {
    title: '',
    duration: 0.5,
    contacts: [],
    calendar: null,
    location: '',
    description: ''
  };
  appointmentDueOption = 'delay';
  timeDelayType = 'hour';
  timeUntilType = 'hour';
  selectedVoiceMail = null;

  @Output() onClose = new EventEmitter();
  @Output() onOpen = new EventEmitter();
  data;
  actionInputSubscription: Subscription;

  // Ringless Voicemail
  newRinglessFile;
  newRinglessName = '';
  creatingRingless = false;

  constructor(
    private dialog: MatDialog,
    public materialService: MaterialService,
    private userService: UserService,
    private fileService: FileService,
    public templatesService: TemplatesService,
    private _viewContainerRef: ViewContainerRef,
    public connectService: ConnectService,
    private toastr: ToastrService,
    private overlay: Overlay,
    private cdr: ChangeDetectorRef,
    private appRef: ApplicationRef,
    private dealsService: DealsService,
    private helperSerivce: HelperService,
    public labelService: LabelService,
    public storeService: StoreService,
    private appointmentService: AppointmentService,
    private dialerService: DialerService
  ) {
    this.userService.garbage$.subscribe((res) => {
      const garbage = res;
      const cannedTemplate = garbage && garbage.canned_message;
      this.default.email = cannedTemplate && cannedTemplate.email;
      this.default.sms = cannedTemplate && cannedTemplate.sms;

      const current = new Date();
      this.minDate = {
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        day: current.getDate()
      };
      if (garbage?.calendly) {
        this.isCalendly = true;
      } else {
        this.isCalendly = false;
      }
    });
    this.labelService.allLabels$.subscribe((res) => {
      this.labels = res;
    });
    this.appointmentService.loadCalendars(false);
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.currentUser = res;
    });

    this.templatesService.loadAll(false);

    this.dealsService.getStage(true);
    this.dealsService.stages$.subscribe((res) => {
      this.stages = [...res];
      this.deal_stage = this.stages[0]?._id;
    });

    this.dialerService.loadAudioMessages();
    this.dialerSubscription && this.dialerSubscription.unsubscribe();
    this.dialerSubscription = this.dialerService.rvms$.subscribe((res) => {
      if (res['success']) {
        this.rvms = res['messages'];
      }
    });

    this.authToken = this.userService.getToken();
    this.userId = this.userService.profile.getValue()._id;

    this.storeService.actionInputData$.subscribe((res) => {
      if (res) {
        this.initVariables();
        this.data = res;
        this.initDialog();
      }
    });
  }

  ngOnInit(): void {
    // Enable the corresponding the condition option
    this.materialService.loadOwn(true);
    this.storeService.materials$.subscribe((materials) => {
      this.materials = materials;
    });
    this.videosLoading = true;
    this.pdfsLoading = true;
    this.imagesLoading = true;

    this.action['period'] = 0;
    this.action['group'] = undefined;
    this.due_date = { ...this.minDate };
    this.update_due_date = { ...this.minDate };

    if (this.data) {
      if (this.data.currentAction === 'email') {
        this.conditionAction = ['opened_email'];
      }
      if (
        this.data.currentAction === 'send_text_video' ||
        this.data.currentAction === 'send_email_video'
      ) {
        this.conditionAction = ['watched_material'];
      }
      if (
        this.data.currentAction === 'send_text_pdf' ||
        this.data.currentAction === 'send_email_pdf'
      ) {
        this.conditionAction = ['watched_material'];
      }
      if (
        this.data.currentAction === 'send_text_image' ||
        this.data.currentAction === 'send_email_image'
      ) {
        this.conditionAction = ['watched_material'];
      }
      if (
        this.data.currentAction === 'send_text_material' ||
        this.data.currentAction === 'send_email_material'
      ) {
        this.conditionAction = ['watched_material'];
      }

      //set time delay to 1 day for no case
      if (
        this.data.conditionHandler &&
        this.data.conditionHandler == 'falseCase'
      ) {
        this.action['period'] = 24;
      }
    }

    const _SELF = this;
    setTimeout(() => {
      if (_SELF.searchField) {
        _SELF.searchField.nativeElement.blur();
      }
    }, 300);
  }

  isConditionAction(type): boolean {
    if (this.conditionAction.length > 0) {
      if (this.conditionAction.indexOf(type) >= 0) {
        return true;
      }
    }
    return false;
  }

  removeError(): void {
    this.error = '';
  }

  fillContent(action): void {
    this.stepIndex++;
    if (this.type !== action.type) {
      this.submitted = false;
      this.type = action.type;
      this.category = action.category;

      if (this.type.indexOf('deal') < 0) {
        this.action['content'] = '';
        this.action['videos'] = {};
        this.action['pdfs'] = {};
        this.action['images'] = {};
        this.action['subject'] = '';
      }
    }
    if (this.type === 'update_follow_up') {
      this.selectedFollow = undefined;
      this.followUpdateOption = 'update_follow_up';
      this.updateFollowDueOption = 'no_update';
      this.update_due_time = '12:00:00.000';
      this.update_due_duration = 0;
      this.setUpdateDateTime();
      if (this.data.follows && this.data.follows.length > 0) {
        this.selectedFollow = this.data.follows[0];
      }
    }
    if (
      (action.type === 'send_text_material' ||
        action.type === 'send_email_material') &&
      !this.videos.length &&
      !this.pdfs.length &&
      !this.images.length
    ) {
      if (action.type === 'send_text_material') {
        this.type = 'send_text_video';
        this.material_type = 'text';
      } else {
        this.type = 'send_email_video';
        this.material_type = 'email';
      }
    }
    if (action.type === 'audio') {
      this.action['voicemail'] = 'voicemailcreate';
    }

    this.loadSubscription = this.storeService.materials$.subscribe(
      (materials) => {
        if (materials.length > 0) {
          this.videosLoading = false;
          this.pdfsLoading = false;
          this.imagesLoading = false;

          const video = materials.filter(
            (item) => item.material_type === 'video'
          );
          this.videos = video;
          this.filterVideos = video;

          const pdf = materials.filter((item) => item.material_type === 'pdf');
          this.pdfs = pdf;
          this.filterPdfs = pdf;

          const image = materials.filter(
            (item) => item.material_type === 'image'
          );
          this.images = image;
          this.filterImages = image;
        }
      }
    );
    this.loadTemplates();
  }

  toggleVideo(video): void {
    this.action['videos'] = video;
    this.action['pdfs'] = null;
    this.action['images'] = null;
    this.materialError = '';
  }

  togglePdf(pdf): void {
    this.action['pdfs'] = pdf;
    this.action['videos'] = null;
    this.action['images'] = null;
    this.materialError = '';
  }

  toggleImage(image): void {
    this.action['images'] = image;
    this.action['videos'] = null;
    this.action['pdfs'] = null;
    this.materialError = '';
  }

  prevStep(): void {
    this.stepIndex--;
    this.materialError = '';
  }
  decideCaseAction(action_type): void {
    if (
      this.parentAction &&
      this.parentAction['id'] &&
      action_type.type !== 'opened_email'
    ) {
      const content = this.parentAction['content'];
      let materials;
      if (
        this.parentAction['type'] === 'send_text_video' ||
        this.parentAction['type'] === 'send_text_pdf' ||
        this.parentAction['type'] === 'send_text_image' ||
        this.parentAction['type'] === 'send_text_material' ||
        this.parentAction['type'] === 'text'
      ) {
        materials = this.helperSerivce.getSMSMaterials(content);
      } else if (
        this.parentAction['type'] === 'send_email_pdf' ||
        this.parentAction['type'] === 'send_email_video' ||
        this.parentAction['type'] === 'send_email_image' ||
        this.parentAction['type'] === 'send_email_material' ||
        this.parentAction['type'] === 'email'
      ) {
        materials = this.helperSerivce.getMaterials(content);
      }

      if (materials) {
        if (materials.length > 1) {
          const confirmDialog = this.dialog.open(CaseMaterialConfirmComponent, {
            width: '90vw',
            maxWidth: '500px',
            disableClose: true,
            data: { materials }
          });
          this.closeDrawer();
          confirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              if (res.review === 0) {
                const data = {
                  category: ACTION_CAT.CONDITION,
                  ...action_type,
                  multipleReview: true
                };
                this.actionData = data;
              } else if (res.review === 1) {
                const data = {
                  category: ACTION_CAT.CONDITION,
                  ...action_type,
                  multipleReview: false
                };
                this.actionData = data;
              } else if (res.review === 2) {
                const data = {
                  category: ACTION_CAT.CONDITION,
                  ...action_type,
                  multipleReview: false,
                  primary: res.primary
                };
                this.actionData = data;
              }
              const videos = materials.filter((item) => item.type === 'video')
                .length;
              let selectedMaterial = null;
              if (res.review === 2 && res.primary) {
                const index = materials.findIndex(
                  (item) => item._id === res.primary
                );
                if (index >= 0) {
                  selectedMaterial = materials[index];
                }
              }
              if (
                (res.review !== 2 && videos === 1) ||
                (res.review === 2 && selectedMaterial?.type === 'video')
              ) {
                const confirmDialog = this.dialog.open(
                  CaseConfirmPercentComponent,
                  {
                    width: '90vw',
                    maxWidth: '500px'
                  }
                );
                this.closeDrawer();
                confirmDialog.afterClosed().subscribe((res) => {
                  if (res['status'] === true) {
                    const data = {
                      ...this.actionData,
                      percent: res['percent']
                    };
                    this.storeService.actionOutputData.next(data);
                    this.close();
                    this.openDrawer();
                  } else if (res['status'] === false) {
                    if (res['setPercent']) {
                      this.close();
                      this.openDrawer();
                    } else {
                      this.storeService.actionOutputData.next(this.actionData);
                      this.close();
                      this.openDrawer();
                    }
                  }
                });
              } else {
                this.storeService.actionOutputData.next(this.actionData);
              }
            } else {
              this.close();
              this.openDrawer();
            }
          });
        } else {
          const material = materials[0];
          if (material.material_type === 'video') {
            const confirmDialog = this.dialog.open(
              CaseConfirmPercentComponent,
              {
                width: '90vw',
                maxWidth: '500px'
              }
            );
            this.closeDrawer();
            confirmDialog.afterClosed().subscribe((res) => {
              if (res['status'] === true) {
                const data = {
                  category: ACTION_CAT.CONDITION,
                  ...action_type,
                  multipleReview: false,
                  percent: res['percent']
                };
                this.storeService.actionOutputData.next(data);
                this.close();
                this.openDrawer();
              } else if (res['status'] === false) {
                if (res['setPercent']) {
                  this.close();
                  this.openDrawer();
                } else {
                  const data = {
                    category: ACTION_CAT.CONDITION,
                    ...action_type,
                    multipleReview: false
                  };
                  this.storeService.actionOutputData.next(data);
                  this.close();
                  this.openDrawer();
                }
              }
            });
          } else {
            const data = {
              category: ACTION_CAT.CONDITION,
              ...action_type,
              multipleReview: false
            };
            this.storeService.actionOutputData.next(data);
          }
        }
      } else {
        const data = {
          category: ACTION_CAT.CONDITION,
          ...action_type,
          multipleReview: false
        };
        this.storeService.actionOutputData.next(data);
        this.close();
      }
    } else {
      const data = {
        category: ACTION_CAT.CONDITION,
        ...action_type
      };
      this.storeService.actionOutputData.next(data);
      this.close();
      // this.dialogRef.close({ category: ACTION_CAT.CONDITION, ...action_type });
    }
  }

  decideAction(): void {
    let period = this.action['period'] || 0;
    if (this.action['period'] == 'custom_date') {
      if (this.timeDelayType === 'hour') {
        period = this.plan_time_delay;
      } else {
        period = this.plan_time_delay * 24;
      }

      if (!period) {
        return;
      }
    }
    if (this.type === 'email') {
      const content = this.action['content'];
      const insertedMaterials = this.helperSerivce.getMaterials(content);
      if (insertedMaterials && insertedMaterials.length > 0) {
        if (insertedMaterials && insertedMaterials.length === 1) {
          const index = this.materials.findIndex(
            (item) => item._id === insertedMaterials[0]._id
          );
          if (index >= 0) {
            if (this.materials[index].material_type === 'video') {
              this.type = 'send_email_video';
            } else if (this.materials[index].material_type === 'pdf') {
              this.type = 'send_email_pdf';
            } else if (this.materials[index].material_type === 'image') {
              this.type = 'send_email_image';
            }
          }
        } else {
          this.type = 'send_email_material';
        }

        for (const material of insertedMaterials) {
          const index = this.materials.findIndex(
            (item) => item._id === material._id
          );
          if (index >= 0) {
            if (this.materials[index].material_type === 'video') {
              if (this.action['videos']) {
                if (Array.isArray(this.action['videos'])) {
                  this.action['videos'] = [
                    ...this.action['videos'],
                    material._id
                  ];
                } else {
                  this.action['videos'] = [material._id];
                }
              } else {
                this.action['videos'] = [];
              }
            } else if (this.materials[index].material_type === 'pdf') {
              if (this.action['pdfs']) {
                if (Array.isArray(this.action['pdfs'])) {
                  this.action['pdfs'] = [...this.action['pdfs'], material._id];
                } else {
                  this.action['pdfs'] = [material._id];
                }
              } else {
                this.action['pdfs'] = [];
              }
            } else if (this.materials[index].material_type === 'image') {
              if (this.action['images']) {
                if (Array.isArray(this.action['images'])) {
                  this.action['images'] = [
                    ...this.action['images'],
                    material._id
                  ];
                } else {
                  this.action['images'] = [material._id];
                }
              } else {
                this.action['images'] = [];
              }
            }
          }
        }
      }
    }
    if (this.type === 'text') {
      const content = this.action['content'];
      const insertedMaterials = this.helperSerivce.getSMSMaterials(content);
      if (insertedMaterials && insertedMaterials.length > 0) {
        if (insertedMaterials && insertedMaterials.length === 1) {
          const index = this.materials.findIndex(
            (item) => item._id === insertedMaterials[0]._id
          );
          if (index >= 0) {
            if (this.materials[index].material_type === 'video') {
              this.type = 'send_text_video';
            } else if (this.materials[index].material_type === 'pdf') {
              this.type = 'send_text_pdf';
            } else if (this.materials[index].material_type === 'image') {
              this.type = 'send_text_image';
            }
          }
        } else {
          this.type = 'send_text_material';
        }

        for (const material of insertedMaterials) {
          const index = this.materials.findIndex(
            (item) => item._id === material._id
          );
          if (index >= 0) {
            if (this.materials[index].material_type === 'video') {
              if (Array.isArray(this.action['videos'])) {
                this.action['videos'] = [
                  ...this.action['videos'],
                  material._id
                ];
              } else {
                this.action['videos'] = [material._id];
              }
            } else if (this.materials[index].material_type === 'pdf') {
              if (Array.isArray(this.action['pdfs'])) {
                this.action['pdfs'] = [...this.action['pdfs'], material._id];
              } else {
                this.action['pdfs'] = [material._id];
              }
            } else if (this.materials[index].material_type === 'image') {
              if (Array.isArray(this.action['images'])) {
                this.action['images'] = [
                  ...this.action['images'],
                  material._id
                ];
              } else {
                this.action['images'] = [material._id];
              }
            }
          }
        }
      }
    }
    if (this.type === 'follow_up') {
      if (this.followDueOption === 'date') {
        if (!this.selectedTimezone) {
          return;
        }

        if (
          this.due_date.year !== '' &&
          this.due_date.month !== '' &&
          this.due_date.day !== ''
        ) {
          const due_date = moment.tz(
            `${this.due_date['year']}-${this.numPad(
              this.due_date['month']
            )}-${this.numPad(this.due_date['day'])} ${this.due_time}`,
            this.selectedTimezone
          );

          const data = {
            ...this.action,
            type: this.type,
            task_type: this.task.type,
            category: this.category,
            due_date: due_date,
            period,
            timezone: this.selectedTimezone
          };
          this.storeService.actionOutputData.next(data);
          this.close();
          // this.dialogRef.close({
          //   ...this.action,
          //   type: this.type,
          //   task_type: this.task.type,
          //   category: this.category,
          //   due_date: due_date,
          //   period
          // });
        }
      } else {
        const data = {
          ...this.action,
          type: this.type,
          task_type: this.task.type,
          category: this.category,
          due_duration:
            this.timeUntilType === 'hour'
              ? this.due_duration
              : this.due_duration * 24,
          period
        };
        this.storeService.actionOutputData.next(data);
        this.close();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   task_type: this.task.type,
        //   category: this.category,
        //   due_duration: this.due_duration,
        //   period
        // });
      }
      return;
    }
    if (this.type === 'update_contact') {
      const commands = ['update_label', 'push_tag', 'pull_tag'];
      const content = [
        this.commandLabel,
        this.pushCommandTags,
        this.pullCommandTags
      ];
      if (this.contactUpdateOption === 'update_label') {
        if (!this.commandLabel) {
          this.error = 'Please select the label for contact.';
        }
      }
      if (this.contactUpdateOption === 'push_tag') {
        if (!this.pushCommandTags.length) {
          this.error = 'Please select the tags to insert.';
        }
      }
      if (this.contactUpdateOption === 'pull_tag') {
        if (!this.pullCommandTags.length) {
          this.error = 'Please select the tags to remove.';
        }
      }
      if (this.error) {
        return;
      } else {
        const data = {
          type: this.type,
          category: this.category,
          period,
          commands,
          content
        };
        this.storeService.actionOutputData.next(data);
        this.close();
        // this.dialogRef.close({
        //   type: this.type,
        //   category: this.category,
        //   period,
        //   command,
        //   content
        // });
        return;
      }
    }
    if (this.type === 'deal') {
      this.action['deal_name'] = this.deal_name;
      this.action['deal_stage'] = this.deal_stage;
      const data = {
        ...this.action,
        type: this.type,
        category: this.category,
        period
      };
      this.storeService.actionOutputData.next(data);
      this.close();
      return;
      // this.dialogRef.close({
      //   ...this.action,
      //   type: this.type,
      //   category: this.category,
      //   period
      // });
    }
    if (this.type === 'move_deal') {
      if (this.moveDealOption === 'other') {
        this.action['deal_stage'] = this.deal_stage;
      }
      const data = {
        ...this.action,
        type: this.type,
        category: this.category,
        period
      };
      this.storeService.actionOutputData.next(data);
      this.close();
      return;
      // this.dialogRef.close({
      //   ...this.action,
      //   type: this.type,
      //   category: this.category,
      //   period
      // });
    }
    if (this.type === 'update_follow_up') {
      if (this.followUpdateOption === 'update_follow_up') {
        if (this.updateFollowDueOption === 'no_update') {
          const data = {
            ...this.action,
            type: this.type,
            task_type: this.task.type,
            category: this.category,
            due_duration: undefined,
            due_date: undefined,
            period,
            command: 'update_follow_up',
            ref_id: this.selectedFollow.id
          };
          this.storeService.actionOutputData.next(data);
          this.close();
          // this.dialogRef.close({
          //   ...this.action,
          //   type: this.type,
          //   task_type: this.task.type,
          //   category: this.category,
          //   due_duration: undefined,
          //   due_date: undefined,
          //   period,
          //   command: 'update_follow_up',
          //   ref_id: this.selectedFollow.id
          // });
        } else if (this.updateFollowDueOption === 'update_due_date') {
          const time_zone = this.currentUser.time_zone;
          if (
            this.update_due_date.year !== '' &&
            this.update_due_date.month !== '' &&
            this.update_due_date.day !== ''
          ) {
            const due_date = new Date(
              `${this.update_due_date['year']}-${this.numPad(
                this.update_due_date['month']
              )}-${this.numPad(this.update_due_date['day'])}T${
                this.update_due_time
              }${time_zone}`
            );
            const data = {
              ...this.action,
              type: this.type,
              task_type: this.task.type,
              category: this.category,
              due_date: due_date,
              period,
              command: 'update_follow_up',
              ref_id: this.selectedFollow.id
            };
            this.storeService.actionOutputData.next(data);
            this.close();
            // this.dialogRef.close({
            //   ...this.action,
            //   type: this.type,
            //   task_type: this.task.type,
            //   category: this.category,
            //   due_date: due_date,
            //   period,
            //   command: 'update_follow_up',
            //   ref_id: this.selectedFollow.id
            // });
          }
        } else {
          const data = {
            ...this.action,
            type: this.type,
            task_type: this.task.type,
            category: this.category,
            due_duration:
              this.timeUntilType === 'hour'
                ? this.update_due_duration || 0
                : this.update_due_duration * 24 || 0,
            period,
            command: 'update_follow_up',
            ref_id: this.selectedFollow.id
          };
          this.storeService.actionOutputData.next(data);
          this.close();
          // this.dialogRef.close({
          //   ...this.action,
          //   type: this.type,
          //   task_type: this.task.type,
          //   category: this.category,
          //   due_duration: this.update_due_duration || 0,
          //   period,
          //   command: 'update_follow_up',
          //   ref_id: this.selectedFollow.id
          // });
        }
      } else {
        const data = {
          ...this.action,
          type: this.type,
          task_type: this.task.type,
          category: this.category,
          period,
          command: 'complete_follow_up',
          ref_id: this.selectedFollow.id
        };
        this.storeService.actionOutputData.next(data);
        this.close();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   task_type: this.task.type,
        //   category: this.category,
        //   period,
        //   command: 'complete_follow_up',
        //   ref_id: this.selectedFollow.id
        // });
      }
      return;
    } else if (this.type === 'note') {
      if (this.action['content'] === '') {
        return;
      } else {
        const data = {
          ...this.action,
          type: this.type,
          category: this.category,
          period
        };
        this.storeService.actionOutputData.next(data);
        this.close();
        return;
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   category: this.category,
        //   period
        // });
      }
    } else if (this.type === 'automation') {
      if (this.selectedAutomation) {
        this.action['automation_id'] = this.selectedAutomation._id;
        const data = {
          ...this.action,
          type: this.type,
          category: this.category,
          period
        };
        this.storeService.actionOutputData.next(data);
        this.close();
        return;
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   category: this.category,
        //   period
        // });
      } else {
        return;
      }
    } else if (
      this.type === 'appointment' ||
      this.type === 'update_appointment'
    ) {
      if (this.appointmentDueOption === 'date') {
        const time_zone = this.currentUser.time_zone;

        if (
          this.due_date.year !== '' &&
          this.due_date.month !== '' &&
          this.due_date.day !== ''
        ) {
          const due_date = new Date(
            `${this.due_date['year']}-${this.numPad(
              this.due_date['month']
            )}-${this.numPad(this.due_date['day'])}T${
              this.due_time
            }${time_zone}`
          );
          this.action['appointment'] = this.appointmentEvent;
          const data = {
            ...this.action,
            type: this.type,
            category: this.category,
            due_date: due_date,
            period
          };
          this.storeService.actionOutputData.next(data);
          this.close();
          // this.dialogRef.close({
          //   ...this.action,
          //   type: this.type,
          //   category: this.category,
          //   due_date: due_date,
          //   period
          // });
        }
      } else {
        this.action['appointment'] = this.appointmentEvent;
        const data = {
          ...this.action,
          type: this.type,
          category: this.category,
          due_duration:
            this.timeUntilType === 'hour'
              ? this.due_duration
              : this.due_duration * 24,
          period
        };
        this.storeService.actionOutputData.next(data);
        this.close();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   category: this.category,
        //   due_duration: this.due_duration,
        //   period
        // });
      }
      return;
    } else if (this.type === 'audio') {
      if (this.selectedVoiceMail) {
        const data = {
          ...this.action,
          type: this.type,
          category: this.category,
          period
        };
        this.storeService.actionOutputData.next(data);
        this.close();
      } else {
        this.createRinglessVoiceMail();
      }
    } else {
      const data = {
        ...this.action,
        type: this.type,
        category: this.category,
        period
      };
      this.storeService.actionOutputData.next(data);
      this.close();
      // this.dialogRef.close({
      //   ...this.action,
      //   type: this.type,
      //   category: this.category,
      //   period
      // });
    }
  }

  loadTemplates(): any {
    switch (this.type) {
      case 'send_text_video':
        this.mediaType = 'text';
        this.materialType = 'video';
        break;
      case 'send_email_video':
        this.mediaType = 'email';
        this.materialType = 'video';
        break;
      case 'send_text_pdf':
        this.mediaType = 'text';
        this.materialType = 'pdf';
        break;
      case 'send_email_pdf':
        this.mediaType = 'email';
        this.materialType = 'pdf';
        break;
      case 'send_text_image':
        this.mediaType = 'text';
        this.materialType = 'image';
        break;
      case 'send_email_image':
        this.mediaType = 'email';
        this.materialType = 'image';
        break;
      case 'send_email':
        this.mediaType = 'email';
        this.materialType = '';
        break;
      default:
        this.mediaType = '';
        this.materialType = '';
        break;
    }
  }

  displayFn(template): string {
    if (template) {
      if (!template._id) {
        return '';
      }
      return template.title;
    }

    return '';
  }

  selectFollow(event): void {
    this.action['content'] = this.selectedFollow.content;
    this.updateFollowDueOption = 'no_update';
  }

  initMessage(): any {
    if (
      this.mediaType === 'email' &&
      (this.selectedTemplate.subject || this.selectedTemplate.content)
    ) {
      this.setMessage();
      return;
    }
    if (
      this.mediaType === 'text' &&
      (this.selectedTemplate.subject || this.selectedTemplate.content)
    ) {
      this.setMessage();
      return;
    }
    if (this.materialType) {
      if (this.mediaType === 'email') {
        // Set the subject and content
        if (this.materialType === 'video') {
          this.action['subject'] = 'Video: {video_title}';
          this.action['content'] = this.autoFill(
            DefaultMessage.AUTO_VIDEO_EMAIL
          );
        } else if (this.materialType === 'pdf') {
          this.action['subject'] = 'PDF: {pdf_title}';
          this.action['content'] = this.autoFill(DefaultMessage.AUTO_PDF_EMAIL);
        } else if (this.materialType === 'image') {
          this.action['subject'] = 'Image: {image_title}';
          this.action['content'] = this.autoFill(
            DefaultMessage.AUTO_IMAGES_EMAIL
          );
        }
      } else {
        // Set only content
        if (this.materialType === 'video') {
          this.action['content'] = this.autoFill(
            DefaultMessage.AUTO_VIDEO_TEXT1
          );
        } else if (this.materialType === 'pdf') {
          this.action['content'] = this.autoFill(DefaultMessage.AUTO_PDF_TEXT1);
        } else if (this.materialType === 'image') {
          this.action['content'] = this.autoFill(
            DefaultMessage.AUTO_IMAGE_TEXT1
          );
        }
      }
    }
  }
  autoFill(text): void {
    let result = text;
    const user_name = this.currentUser.user_name;
    const user_phone = this.currentUser.cell_phone;
    const user_email = this.currentUser.email;
    result = result.replace(/{user_name}/g, user_name || '');
    result = result.replace(/{user_phone}/g, user_phone || '');
    result = result.replace(/{user_email}/g, user_email || '');

    return result;
  }

  setMessage(): void {
    this.action['subject'] = this.selectedTemplate.subject;
    this.action['content'] = this.selectedTemplate.content;
  }

  selectSMSTemplate(template: Template): void {
    this.selectedTemplate = template;
    this.action['content'] = this.selectedTemplate.content;
    if (template.video_ids.length) {
      template.video_ids.forEach((video) => {
        this.action['content'] = this.action['content'].replace(
          '{{' + video + '}}',
          environment.website + '/video?video=' + video
        );
      });
    }
    if (template.pdf_ids.length) {
      template.pdf_ids.forEach((pdf) => {
        this.action['content'] = this.action['content'].replace(
          '{{' + pdf + '}}',
          environment.website + '/pdf?pdf=' + pdf
        );
      });
    }
    if (template.image_ids.length) {
      template.image_ids.forEach((image) => {
        this.action['content'] = this.action['content'].replace(
          '{{' + image + '}}',
          environment.website + '/image?image=' + image
        );
      });
    }
  }

  selectEmailTemplate(template: Template): void {
    this.selectedTemplate = template;
    this.htmlEditor.selectTemplate(template);
    this.action['subject'] = template.subject;
    if (template.attachments.length) {
      template.attachments.forEach((e) => {
        this.attachments.push(e);
      });
    }
    this.action['attachments'] = this.attachments;
  }

  /**=======================================================
   *
   * Subject Field
   *
   ========================================================*/
  subjectCursorStart = 0;
  subjectCursorEnd = 0;
  subject = '';
  /**
   *
   * @param field : Input text field of the subject
   */
  getSubjectCursorPost(field): void {
    if (field.selectionStart || field.selectionStart === '0') {
      this.subjectCursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      this.subjectCursorEnd = field.selectionEnd;
    }
    this.subjectFocus = true;
    this.contentFocus = false;
  }

  getSmsContentCursor(field): void {
    if (field.selectionStart || field.selectionStart === '0') {
      this.smsContentCursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      this.smsContentCursorEnd = field.selectionEnd;
    }
  }

  /**=======================================================
   *
   * Deal Name Field
   *
   ========================================================*/
  /**
   *
   * @param field : Input text field of the subject
   */
  getDealNameCursorPost(field): void {
    if (field.selectionStart || field.selectionStart === '0') {
      this.dealNameCursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      this.dealNameCursorEnd = field.selectionEnd;
    }
    this.dealNameFocus = true;
  }

  setContentFocus(): void {
    this.subjectFocus = false;
    this.contentFocus = true;
  }

  insertSmsContentValue(value, field): void {
    let smsContent = this.action['content'] || '';
    smsContent =
      smsContent.substr(0, this.smsContentCursorStart) +
      value +
      smsContent.substr(
        this.smsContentCursorEnd,
        smsContent.length - this.smsContentCursorEnd
      );
    this.action['content'] = smsContent;
    this.smsContentCursorStart = this.smsContentCursorStart + value.length;
    this.smsContentCursorEnd = this.smsContentCursorStart;
    field.focus();
  }

  insertDealNameValue(value, field): void {
    let dealName = this.deal_name || '';
    dealName =
      dealName.substr(0, this.dealNameCursorStart) +
      value +
      dealName.substr(
        this.dealNameCursorEnd,
        dealName.length - this.dealNameCursorEnd
      );
    this.deal_name = dealName;
    this.dealNameCursorStart = this.dealNameCursorStart + value.length;
    this.dealNameCursorEnd = this.dealNameCursorStart;
    field.focus();
  }

  insertEmailContentValue(value: string): void {
    if (this.contentFocus) {
      this.htmlEditor.insertEmailContentValue(value);
    } else if (this.subjectFocus) {
      const field = this.subjectField.nativeElement;
      field.focus();
      let subject = this.action['subject'] || '';
      subject =
        subject.substr(0, this.subjectCursorStart) +
        value +
        subject.substr(
          this.subjectCursorEnd,
          subject.length - this.subjectCursorEnd
        );
      this.action['subject'] = subject;
      this.subjectCursorStart = this.subjectCursorStart + value.length;
      this.subjectCursorEnd = this.subjectCursorStart;
    }

    return;
  }

  isMaterialSetting(): any {
    if (
      this.type === 'send_email_video' ||
      this.type === 'send_text_video' ||
      this.type === 'send_email_pdf' ||
      this.type === 'send_text_pdf' ||
      this.type === 'send_email_image' ||
      this.type === 'send_text_image'
    ) {
      return true;
    } else {
      return false;
    }
  }

  numPad(num): any {
    if (num < 10) {
      return '0' + num;
    }
    return num + '';
  }

  getUpdateDateTime(): any {
    if (this.update_due_date.day !== '') {
      return (
        this.update_due_date.year +
        '-' +
        this.update_due_date.month +
        '-' +
        this.update_due_date.day
      );
    }
  }

  setUpdateDateTime(): void {
    this.selectedDate = moment(this.getUpdateDateTime()).format('YYYY-MM-DD');
    close();
  }

  changeCommandLabel($event): void {
    this.commandLabel = $event;
    const label = this.labels.find((e) => e._id === $event);
    this.commandName = label.name;
    this.error = '';
  }
  remove(): void {
    this.commandLabel = '';
  }
  changeCommandPullTags($event): void {
    this.pullCommandTags = $event;
  }
  changeCommandPushTags($event): void {
    this.pushCommandTags = $event;
  }
  clearSearchStr(): void {
    this.searchStr = '';
    this.filter();
  }
  removePullItem(item): void {
    const index = this.pullCommandTags.indexOf(item);
    if (index > -1) {
      this.pullCommandTags.splice(index, 1);
    }
  }
  removePushItem(item): void {
    const index = this.pushCommandTags.indexOf(item);
    if (index > -1) {
      this.pushCommandTags.splice(index, 1);
    }
  }
  filter(): void {
    this.filterVideos = this.videos.filter((video) => {
      return searchReg(video.title, this.searchStr);
    });
    this.filterPdfs = this.pdfs.filter((pdf) => {
      return searchReg(pdf.title, this.searchStr);
    });
    this.filterImages = this.images.filter((image) => {
      return searchReg(image.title, this.searchStr);
    });
  }

  onChangeTemplate(template: Template): void {
    this.action['subject'] = template.subject;
  }

  createSMSTemplate(): void {
    this.templatePortal = new TemplatePortal(
      this.createNewSMSContent,
      this._viewContainerRef
    );
    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
        return;
      } else {
        this.overlayRef.attach(this.templatePortal);
        return;
      }
    } else {
      this.overlayRef = this.overlay.create({
        hasBackdrop: true,
        backdropClass: 'template-backdrop',
        panelClass: 'template-panel',
        width: '96vw',
        maxWidth: '480px'
      });
      this.overlayRef.outsidePointerEvents().subscribe((event) => {
        this.overlayRef.detach();
        return;
      });
      this.overlayRef.attach(this.templatePortal);
    }
  }

  createEmailTemplate(): void {
    this.templatePortal = new TemplatePortal(
      this.createNewEmailContent,
      this._viewContainerRef
    );
    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
        return;
      } else {
        this.overlayRef.attach(this.templatePortal);
        return;
      }
    } else {
      this.overlayRef = this.overlay.create({
        hasBackdrop: true,
        backdropClass: 'template-backdrop',
        panelClass: 'template-panel',
        width: '96vw',
        maxWidth: '480px'
      });
      this.overlayRef.outsidePointerEvents().subscribe((event) => {
        this.overlayRef.detach();
        return;
      });
      this.overlayRef.attach(this.templatePortal);
    }
  }

  closeOverlay(flag: boolean): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.detachBackdrop();
    }
    if (flag) {
      // this.toastr.success('', 'New template is created successfully.', {
      //   closeButton: true
      // });
      setTimeout(() => {
        this.appRef.tick();
      }, 1);
    }
    this.cdr.detectChanges();
  }

  selectTextTemplate(template: Template): void {
    this.textAreaEl.nativeElement.focus();
    const field = this.textAreaEl.nativeElement;
    if (!this.action['content'].replace(/(\r\n|\n|\r|\s)/gm, '')) {
      field.select();
      document.execCommand('insertText', false, template.content);
      return;
    }
    if (field.selectionEnd || field.selectionEnd === 0) {
      if (this.action['content'][field.selectionEnd - 1] === '\n') {
        document.execCommand('insertText', false, template.content);
      } else {
        document.execCommand('insertText', false, '\n' + template.content);
      }
    } else {
      if (this.action['content'].slice(-1) === '\n') {
        document.execCommand('insertText', false, template.content);
      } else {
        document.execCommand('insertText', false, '\n' + template.content);
      }
    }
  }

  selectCalendly(url: string): void {
    this.textAreaEl.nativeElement.focus();
    const field = this.textAreaEl.nativeElement;
    if (!this.action['content'].replace(/(\r\n|\n|\r|\s)/gm, '')) {
      field.select();
      document.execCommand('insertText', false, url);
      return;
    }
    if (field.selectionEnd || field.selectionEnd === 0) {
      if (this.action['content'][field.selectionEnd - 1] === '\n') {
        document.execCommand('insertText', false, url);
      } else {
        document.execCommand('insertText', false, '\n' + url);
      }
    } else {
      if (this.action['content'].slice(-1) === '\n') {
        document.execCommand('insertText', false, url);
      } else {
        document.execCommand('insertText', false, '\n' + url);
      }
    }
  }

  record(): void {
    const w = 750;
    const h = 450;
    const dualScreenLeft =
      window.screenLeft !== undefined ? window.screenLeft : window.screenX;
    const dualScreenTop =
      window.screenTop !== undefined ? window.screenTop : window.screenY;

    const width = window.innerWidth
      ? window.innerWidth
      : document.documentElement.clientWidth
      ? document.documentElement.clientWidth
      : screen.width;
    const height = window.innerHeight
      ? window.innerHeight
      : document.documentElement.clientHeight
      ? document.documentElement.clientHeight
      : screen.height;

    const systemZoom = width / window.screen.availWidth;
    const left = (width - w) / 2 / systemZoom + dualScreenLeft;
    const top = (height - h) / 2 / systemZoom + dualScreenTop;
    const option = `width=${w}, height=${h}, top=${top}, left=${left}`;
    const ref = window.location.href;
    if (!this.popup || this.popup.closed) {
      this.popup = window.open(
        this.recordUrl +
          '/index.html?token=' +
          this.authToken +
          '&method=website&userId=' +
          this.userId +
          '&prev=' +
          encodeURIComponent(ref),
        'record',
        option
      );
      window.addEventListener('message', (e) => {
        if (e && e.data) {
          try {
            const url = `${environment.website}/video?video=${e.data._id}`;
            this.textAreaEl.nativeElement.focus();
            const field = this.textAreaEl.nativeElement;
            if (!this.action['content'].replace(/(\r\n|\n|\r|\s)/gm, '')) {
              field.select();
              document.execCommand('insertText', false, url);
              return;
            }
            if (field.selectionEnd || field.selectionEnd === 0) {
              if (this.action['content'][field.selectionEnd - 1] === '\n') {
                document.execCommand('insertText', false, url);
              } else {
                document.execCommand('insertText', false, '\n' + url);
              }
            } else {
              if (this.action['content'].slice(-1) === '\n') {
                document.execCommand('insertText', false, url);
              } else {
                document.execCommand('insertText', false, '\n' + url);
              }
            }
          } catch (err) {
            console.log('Insert Material is failed', err);
          }
        }
        return;
      });
    } else {
      this.popup.focus();
    }
  }

  getMaterials(): any {
    const videoIds = [];
    const pdfIds = [];
    const imageIds = [];

    const videoReg = new RegExp(
      environment.website + '/video[?]video=\\w+',
      'g'
    );
    const pdfReg = new RegExp(environment.website + '/pdf[?]pdf=\\w+', 'g');
    const imageReg = new RegExp(
      environment.website + '/image[?]image=\\w+',
      'g'
    );

    let matches = this.action['content'].match(videoReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const videoId = e.replace(environment.website + '/video?video=', '');
        videoIds.push(videoId);
      });
    }
    matches = this.action['content'].match(pdfReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const pdfId = e.replace(environment.website + '/pdf?pdf=', '');
        pdfIds.push(pdfId);
      });
    }
    matches = this.action['content'].match(imageReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const imageId = e.replace(environment.website + '/image?image=', '');
        imageIds.push(imageId);
      });
    }

    return {
      videoIds,
      imageIds,
      pdfIds
    };
  }

  openSMSMaterialsDlg(): void {
    const content = this.action['content'];
    const materials = this.helperSerivce.getSMSMaterials(content);
    const materialDialog = this.dialog.open(MaterialBrowserComponent, {
      width: '98vw',
      maxWidth: '940px',
      data: {
        multiple: true,
        title: 'Insert material',
        hideMaterials: materials
      }
    });
    materialDialog.afterClosed().subscribe((res) => {
      if (res && res.materials && res.materials.length) {
        res.materials.forEach((e, index) => {
          let url;
          switch (e.material_type) {
            case 'video':
              url = `${environment.website}/video?video=${e._id}`;
              break;
            case 'pdf':
              url = `${environment.website}/pdf?pdf=${e._id}`;
              break;
            case 'image':
              url = `${environment.website}/image?image=${e._id}`;
              break;
          }
          // first element insert
          if (
            index === 0 &&
            (!this.action['content'] ||
              this.action['content'].slice(-1) === '\n')
          ) {
            this.action['content'] = this.action['content'] + '\n' + url;
            return;
          }
          if (index === 0) {
            this.action['content'] = this.action['content'] + '\n\n' + url;
            return;
          }
          // middle element insert
          this.action['content'] = this.action['content'] + '\n' + url;

          if (index === res.materials.length - 1) {
            this.action['content'] += '\n';
          }
        });
      }
    });
  }

  hasEmailMaterial(): boolean {
    const content = this.action['content'];
    const materials = this.helperSerivce.getMaterials(content);
    if (materials && materials.length > 0) {
      return true;
    }
    return false;
  }

  hasSMSMaterial(): boolean {
    const content = this.action['content'];
    const materials = this.helperSerivce.getSMSMaterials(content);
    if (materials && materials.length > 0) {
      return true;
    }
    return false;
  }

  openEmailMaterialsDlg(): void {
    const content = this.action['content'];
    const materials = this.helperSerivce.getMaterials(content);
    const materialDialog = this.dialog.open(MaterialBrowserComponent, {
      width: '98vw',
      maxWidth: '940px',
      data: {
        hideMaterials: materials,
        title: 'Insert material',
        multiple: true,
        onlyMine: false
      }
    });
    materialDialog.afterClosed().subscribe((res) => {
      if (res && res.materials) {
        this.materials = _.intersectionBy(this.materials, materials, '_id');
        this.materials = [...this.materials, ...res.materials];
        this.htmlEditor.insertBeforeMaterials();
        for (let i = 0; i < res.materials.length; i++) {
          const material = res.materials[i];
          this.htmlEditor.insertMaterials(material);
        }
        // this.htmlEditor.insertAfterMaterials();
      }
    });
  }

  onAttachmentChange(attachments: any[]): void {
    this.attachments = attachments;
    this.action['attachments'] = this.attachments;
  }

  onRecordCompleted($event): void {
    this.materials.push($event);
  }

  getFollowDuration(follow): string {
    if (follow.due_duration) {
      if (follow.due_duration >= 48) {
        const day = Math.floor(follow.due_duration / 24);
        if (day * 24 == follow.due_duration) {
          return day + ' Days';
        } else {
          return follow.due_duration + ' Hours';
        }
      } else {
        return follow.due_duration + ' Hours';
      }
    } else {
      return 'Immediately';
    }
  }

  isShowTimeDelay(): boolean {
    if (this.parentAction && this.parentAction['condition']) {
      if (!this.parentAction['condition'].answer) {
        return true;
      }
    }
    if (
      this.type === 'note' ||
      this.type === 'follow_up' ||
      this.type === 'update_follow_up' ||
      this.type === 'deal' ||
      this.type === 'move_deal'
    ) {
      return false;
    }
    return true;
  }

  selectAutomation($event): void {
    this.selectedAutomation = $event;
  }

  handleAddressChange(evt: any): void {
    this.appointmentEvent.location = evt.formatted_address;
  }

  changeTimeDelayType(value): void {
    this.timeDelayType = value;
  }

  changeTimeUntilType(value): void {
    this.timeUntilType = value;
  }

  selectVoiceMail(): any {
    if (this.action['voicemail']) {
      const index = this.rvms.findIndex(
        (item) => item.id === this.action['voicemail']
      );
      if (index >= 0) {
        this.selectedVoiceMail = this.rvms[index];
      } else {
        this.selectedVoiceMail = null;
      }
    }
  }

  closeDrawer(): void {
    this.onClose.emit();
  }
  openDrawer(): void {
    this.onOpen.emit();
  }

  close(): void {
    setTimeout(() => {
      this.actionInputSubscription &&
        this.actionInputSubscription.unsubscribe();
      this.actionInputSubscription = this.storeService.actionInputData$.subscribe(
        (res) => {
          if (res) {
            this.initVariables();
            this.data = res;
            this.initDialog();
          }
        }
      );
    }, 300);
    // this.onClose.emit();
  }

  back(): void {
    if (this.stepIndex === 1) {
      this.onClose.emit();
    } else {
      this.actionInputSubscription &&
        this.actionInputSubscription.unsubscribe();
      this.actionInputSubscription = this.storeService.actionInputData$.subscribe(
        (res) => {
          if (res) {
            this.initVariables();
            this.data = res;
            this.initDialog();
          }
        }
      );
    }
  }

  initVariables(): void {
    this.stepIndex = 1; // ACTION DEFINE STEP | 1: Action List View, 2: Action Detail Setting
    this.type = ''; // ACTION TYPE
    this.category = null; // ACTION CATEGORY
    this.action = {}; // ACTION CONTENT
    this.submitted = false; // SUBMITTING FALSE
    this.conditionAction = []; // Condition Case Action corresponds the prev action
    this.material_type = '';
    this.STATUS = STATUS;
    this.isCalendly = false;
    this.pushCommandTags = [];
    this.pullCommandTags = [];
    this.videos = [];
    this.videosLoading = false;

    this.pdfs = [];
    this.pdfsLoading = false;

    this.images = [];
    this.imagesLoading = false;

    this.materialError = '';
    this.isProcessing = true;
    this.myControl = new FormControl();
    this.selectedTemplate = new Template();

    // Follow Create
    this.due_date = {
      year: '',
      month: '',
      day: ''
    };
    this.due_time = '12:00:00.000';
    this.due_duration = 1;
    this.times = TIMES;
    this.followDueOption = 'delay';
    this.plan_time = { day: 0, hour: 1, min: 0 };
    this.plan_time_delay = 1;
    // Contact Update
    this.contactUpdateOption = 'update_label';
    this.labelsLoading = false;
    this.labelsLoadError = '';
    this.commandLabel = ''; // Label
    this.mediaType = '';
    this.materialType = '';

    this.default = {
      sms: '',
      email: ''
    };

    // periodOption = 'gap'
    // condPeriodOption = 'limit';

    this.task = new Task();
    this.attachLimit = AUTOMATION_ATTACH_SIZE;

    this.selectedFollow = null;
    this.followUpdateOption = 'no_update';
    this.updateFollowDueOption = 'date';
    this.update_due_date = {
      year: '',
      month: '',
      day: ''
    };
    this.update_due_time = '12:00:00.000';
    this.update_due_duration = 0;
    this.selectedDate = '';

    this.searchStr = '';
    this.filterVideos = [];
    this.filterPdfs = [];
    this.filterImages = [];
    this.set = 'twitter';
    this.templateSubject = '';
    this.templateValue = '';
    this.deal_name = '';
    this.deal_stage = '';
    this.popup = null;
    this.authToken = '';
    this.userId = '';
    this.attachments = [];
    this.materials = [];

    this.smsContentCursorStart = 0;
    this.smsContentCursorEnd = 0;
    this.smsContent = '';
    this.subjectFocus = false;
    this.contentFocus = false;

    this.dealNameCursorStart = 0;
    this.dealNameCursorEnd = 0;
    this.dealNameFocus = false;

    this.parentAction = {};

    this.moveDealOption = 'next';
    this.automation_type = 'contact';
    this.selectedAutomation = null;
    this.automation = null;

    this.calendar_durations = CALENDAR_DURATION;
    this.appointmentEvent = {
      title: '',
      duration: 0.5,
      contacts: [],
      calendar: null,
      location: '',
      description: ''
    };
    this.appointmentDueOption = 'delay';
    this.timeDelayType = 'hour';
    this.data = null;

    this.DisplayActions = [
      {
        type: 'follow_up',
        title: 'New Task',
        description:
          'Remind yourself or someone in your team to do a phone call, send an email, etc. ',
        icon: AUTOMATION_ICONS.FOLLOWUP,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'update_follow_up',
        title: 'Edit Task',
        description:
          'Based on your contact behaviour you can edit or set a task as completed.',
        icon: AUTOMATION_ICONS.UPDATE_FOLLOWUP,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'note',
        title: 'New Note',
        description: 'Add a detail or something important about your client.',
        icon: AUTOMATION_ICONS.CREATE_NOTE,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'text',
        title: 'New Text',
        description: 'Create a text message to be sent to your client.',
        icon: AUTOMATION_ICONS.SEND_TEXT,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'audio',
        title: 'New Ringless VM',
        description: 'Create a audio message to be sent to your client.',
        icon: AUTOMATION_ICONS.SEND_AUDIO,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'email',
        title: 'New Email',
        description: 'Trigger an email to send to your contacts.',
        icon: AUTOMATION_ICONS.SEND_EMAIL,
        category: ACTION_CAT.NORMAL
      },
      // {
      //   type: 'appointment',
      //   title: 'Appointment',
      //   description: '',
      //   icon: AUTOMATION_ICONS.APPOINTMENT,
      //   category: ACTION_CAT.NORMAL
      // },
      // {
      //   type: 'update_appointment',
      //   title: 'Update Automation',
      //   description: '',
      //   icon: AUTOMATION_ICONS.APPOINTMENT,
      //   category: ACTION_CAT.NORMAL
      // },
      // {
      //   type: 'send_email_material',
      //   title: 'Send Material Email',
      //   description: '',
      //   icon: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
      //   category: ACTION_CAT.NORMAL
      // },
      // {
      //   type: 'send_text_material',
      //   title: 'Send Material Text',
      //   description: '',
      //   icon: AUTOMATION_ICONS.SEND_VIDEO_TEXT,
      //   category: ACTION_CAT.NORMAL
      // },
      {
        type: 'deal',
        title: 'New Deal',
        description: 'Associate a new deal to one of your contacts.',
        icon: AUTOMATION_ICONS.NEW_DEAL,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'move_deal',
        title: 'Move Deal',
        description: 'Automatically move a Deal to a different stage.',
        icon: AUTOMATION_ICONS.MOVE_DEAL,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'update_contact',
        title: 'Contact Update',
        description:
          'Automatically update your contact activity with a label or tag.',
        icon: AUTOMATION_ICONS.UPDATE_CONTACT,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'automation',
        title: 'Automation',
        description:
          'Connect your current Automation to another one you might have on your list. ',
        icon: AUTOMATION_ICONS.AUTOMATION,
        category: ACTION_CAT.NORMAL
      }
    ];
  }

  initDialog(): void {
    this.userService.garbage$.subscribe((res) => {
      const garbage = res;
      const cannedTemplate = garbage && garbage.canned_message;
      this.default.email = cannedTemplate && cannedTemplate.email;
      this.default.sms = cannedTemplate && cannedTemplate.sms;

      const current = new Date();
      this.minDate = {
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        day: current.getDate()
      };
      if (garbage?.calendly) {
        this.isCalendly = true;
      } else {
        this.isCalendly = false;
      }
    });

    this.appointmentService.loadCalendars(false);
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.currentUser = res;
    });

    this.templatesService.loadAll(false);

    this.stages = [];
    this.dealsService.stages$.subscribe((res) => {
      this.stages = [...this.stages, ...res];
      this.deal_stage = this.stages[0]?._id;
    });

    this.authToken = this.userService.getToken();
    this.userId = this.userService.profile.getValue()._id;

    this.storeService.materials$.subscribe((materials) => {
      this.materials = materials;
    });

    this.action['period'] = 0;
    this.action['group'] = undefined;
    this.due_date = { ...this.minDate };
    this.update_due_date = { ...this.minDate };

    if (this.data) {
      if (this.data.parentAction) {
        this.parentAction = this.data.parentAction;
      }
      if (this.data.hasNewDeal) {
        const index = this.DisplayActions.findIndex(
          (item) => item.type === 'deal'
        );
        if (index >= 0) {
          this.DisplayActions.splice(index, 1);
        }
      }
      if (!this.data.moveDeal) {
        const index = this.DisplayActions.findIndex(
          (item) => item.type === 'move_deal'
        );
        if (index >= 0) {
          this.DisplayActions.splice(index, 1);
        }
      }
      if (this.data.automation_type) {
        if (this.data.hasNewDeal) {
          this.automation_type = 'deal';
        } else {
          this.automation_type = this.data.automation_type;
        }
      }
      if (this.data.automation) {
        this.automation = this.data.automation;
      }
      if (this.data.appointments) {
        if (this.data.appointments.length === 0) {
          const index = this.DisplayActions.findIndex(
            (item) => item.type === 'update_appointment'
          );
          if (index >= 0) {
            this.DisplayActions.splice(index, 1);
          }
        }
      }
      if (this.data.currentAction === 'email') {
        this.conditionAction = ['opened_email'];
      }
      if (
        this.data.currentAction === 'send_text_video' ||
        this.data.currentAction === 'send_email_video'
      ) {
        this.conditionAction = ['watched_material'];
      }
      if (
        this.data.currentAction === 'send_text_pdf' ||
        this.data.currentAction === 'send_email_pdf'
      ) {
        this.conditionAction = ['watched_material'];
      }
      if (
        this.data.currentAction === 'send_text_image' ||
        this.data.currentAction === 'send_email_image'
      ) {
        this.conditionAction = ['watched_material'];
      }
      if (
        this.data.currentAction === 'send_text_material' ||
        this.data.currentAction === 'send_email_material'
      ) {
        this.conditionAction = ['watched_material'];
      }

      this.isAvailableAssignAt = this.data.moveDeal;
      if (this.isAvailableAssignAt) {
        this.action['group'] = '';
      }
      //set time delay to 1 day for no case
      if (
        this.data.conditionHandler &&
        this.data.conditionHandler == 'falseCase'
      ) {
        this.action['period'] = 24;
      }
    }

    setTimeout(() => {
      if (this.searchField) {
        this.searchField.nativeElement.blur();
      }
    }, 300);
  }

  selectTimezone($event): void {
    this.selectedTimezone = $event?.tz_name;
  }

  ////////////////////////////////////////////////////////////////////////
  /////////////////////////// Ringless Voicemail Handler /////////////////
  ////////////////////////////////////////////////////////////////////////
  /**
   * Set the audio file as new ringless file
   * @param $event: { file, url, content }
   */
  setRinglessFile($event: any): void {
    if ($event.file) {
      this.newRinglessFile = $event.file;
    }
  }

  /**
   * Clear the ringless file
   */
  unsetRinglessFile(): void {
    this.newRinglessFile = null;
  }

  /**
   * Create New Ringless Voicemail
   */
  createRinglessVoiceMail(): void {
    if (!this.newRinglessName || !this.newRinglessFile) {
      this.toastr.error('Please input the name and audio.');
      return;
    }
    const formData = new FormData();
    if (this.newRinglessFile) {
      const file = new File([this.newRinglessFile], 'audio.wav');
      formData.append('file', file);
    }
    formData.append('name', this.newRinglessName);
    this.creatingRingless = true;
    this.dialerService.createAudioMessage(formData).subscribe((_res) => {
      this.creatingRingless = false;
      if (_res.data) {
        let data = {};
        try {
          data = JSON.parse(_res.data);
        } catch (err) {}
        if (data['id']) {
          this.selectedVoiceMail = {
            id: data['id'],
            name: this.newRinglessName,
            createdAt: new Date()
          };
          this.action['voicemail'] = data['id'];
          this.decideAction();
        }
      }
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Constant Variables /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  DisplayActions = [
    {
      type: 'follow_up',
      title: 'New Task',
      description:
        'Remind yourself or someone in your team to do a phone call, send an email, etc. ',
      icon: AUTOMATION_ICONS.FOLLOWUP,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'update_follow_up',
      title: 'Edit Task',
      description:
        'Based on your contact behaviour you can edit or set a task as completed.',
      icon: AUTOMATION_ICONS.UPDATE_FOLLOWUP,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'note',
      title: 'New Note',
      description: 'Add a detail or something important about your client.',
      icon: AUTOMATION_ICONS.CREATE_NOTE,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'text',
      title: 'New Text',
      description: 'Create a text message to be sent to your client.',
      icon: AUTOMATION_ICONS.SEND_TEXT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'audio',
      title: 'New Ringless VM',
      description: 'Create a audio message to be sent to your client.',
      icon: AUTOMATION_ICONS.SEND_AUDIO,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'email',
      title: 'New Email',
      description: 'Trigger an email to send to your contacts.',
      icon: AUTOMATION_ICONS.SEND_EMAIL,
      category: ACTION_CAT.NORMAL
    },
    // {
    //   type: 'appointment',
    //   title: 'Appointment',
    //   description: '',
    //   icon: AUTOMATION_ICONS.APPOINTMENT,
    //   category: ACTION_CAT.NORMAL
    // },
    // {
    //   type: 'update_appointment',
    //   title: 'Update Automation',
    //   description: '',
    //   icon: AUTOMATION_ICONS.APPOINTMENT,
    //   category: ACTION_CAT.NORMAL
    // },
    // {
    //   type: 'send_email_material',
    //   title: 'Send Material Email',
    //   description: '',
    //   icon: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    //   category: ACTION_CAT.NORMAL
    // },
    // {
    //   type: 'send_text_material',
    //   title: 'Send Material Text',
    //   description: '',
    //   icon: AUTOMATION_ICONS.SEND_VIDEO_TEXT,
    //   category: ACTION_CAT.NORMAL
    // },
    {
      type: 'deal',
      title: 'New Deal',
      description: 'Associate a new deal to one of your contacts.',
      icon: AUTOMATION_ICONS.NEW_DEAL,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'move_deal',
      title: 'Move Deal',
      description: 'Automatically move a Deal to a different stage.',
      icon: AUTOMATION_ICONS.MOVE_DEAL,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'update_contact',
      title: 'Contact Update',
      description:
        'Automatically update your contact activity with a label or tag.',
      icon: AUTOMATION_ICONS.UPDATE_CONTACT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'automation',
      title: 'Automation',
      description:
        'Connect your current Automation to another one you might have on your list. ',
      icon: AUTOMATION_ICONS.AUTOMATION,
      category: ACTION_CAT.NORMAL
    }
  ];

  ActionTypes = [
    {
      type: 'follow_up',
      title: 'Follow Up',
      description: '',
      icon: AUTOMATION_ICONS.FOLLOWUP,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'update_follow_up',
      title: 'Update Follow up',
      description: '',
      icon: AUTOMATION_ICONS.UPDATE_FOLLOWUP,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'note',
      title: 'Create Note',
      description: '',
      icon: AUTOMATION_ICONS.CREATE_NOTE,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'text',
      title: 'Send Text',
      description: '',
      icon: AUTOMATION_ICONS.SEND_TEXT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'audio',
      title: 'New Ringless VM',
      description: '',
      icon: AUTOMATION_ICONS.SEND_AUDIO,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'email',
      title: 'Send Email',
      description: '',
      icon: AUTOMATION_ICONS.SEND_EMAIL,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'send_email_video',
      title: 'Send Video Email',
      description: '',
      icon: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'send_text_video',
      title: 'Send Video Text',
      description: '',
      icon: AUTOMATION_ICONS.SEND_VIDEO_TEXT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'send_email_pdf',
      title: 'Send PDF Email',
      description: '',
      icon: AUTOMATION_ICONS.SEND_PDF_EMAIL,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'send_text_pdf',
      title: 'Send PDF Text',
      description: '',
      icon: AUTOMATION_ICONS.SEND_PDF_TEXT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'send_email_image',
      title: 'Send Image Email',
      description: '',
      icon: AUTOMATION_ICONS.SEND_IMAGE_EMAIL,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'send_text_image',
      title: 'Send Image Text',
      description: '',
      icon: AUTOMATION_ICONS.SEND_IMAGE_TEXT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'deal',
      title: 'New Deal',
      description: '',
      icon: AUTOMATION_ICONS.NEW_DEAL,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'update_contact',
      title: 'Contact Update',
      description: '',
      icon: AUTOMATION_ICONS.UPDATE_CONTACT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'automation',
      title: 'Automation',
      description: '',
      icon: AUTOMATION_ICONS.AUTOMATION,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'appointment',
      title: 'Meeting',
      description: '',
      icon: AUTOMATION_ICONS.APPOINTMENT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'update_appointment',
      title: 'Update Meeting',
      description: '',
      icon: AUTOMATION_ICONS.APPOINTMENT,
      category: ACTION_CAT.NORMAL
    }
  ];

  ConditionActionTypes = [
    {
      type: 'watched_video',
      title: 'Material Review Check',
      description:
        'Get to know if your contact has already seen a Material you’ve sent.',
      icon: AUTOMATION_ICONS.WATCHED_VIDEO,
      category: ACTION_CAT.CONDITION
    },
    {
      type: 'watched_pdf',
      title: 'Material Review Check',
      description:
        'Get to know if your contact has already seen a Material you’ve sent.',
      icon: AUTOMATION_ICONS.WATCHED_PDF,
      category: ACTION_CAT.CONDITION
    },
    {
      type: 'watched_image',
      title: 'Material Review Check',
      description:
        'Get to know if your contact has already seen a Material you’ve sent.',
      icon: AUTOMATION_ICONS.WATCHED_IMAGE,
      category: ACTION_CAT.CONDITION
    },
    {
      type: 'opened_email',
      title: 'Email Open Check',
      description: 'Get to know if your contact opens the email you’ve sent.',
      icon: AUTOMATION_ICONS.OPENED_EMAIL,
      category: ACTION_CAT.CONDITION
    },
    // {
    //   type: 'replied_text',
    //   title: 'Replied Text Check',
    //   description: '',
    //   icon: AUTOMATION_ICONS.OPENED_EMAIL,
    //   category: ACTION_CAT.CONDITION
    // },
    {
      type: 'watched_material',
      title: 'Material Review Check',
      description:
        'Get to know if your contact has already seen a Material you’ve sent.',
      icon: AUTOMATION_ICONS.WATCHED_VIDEO,
      category: ACTION_CAT.CONDITION
    }
  ];

  ActivityName = {
    note: 'New Note',
    follow_up: 'New Task',
    text: 'New Text',
    audio: 'New Ringless VM',
    email: 'New Email',
    send_email_video: 'New Video Email',
    send_text_video: 'New Video Text',
    send_email_pdf: 'New PDF Email',
    send_text_pdf: 'New PDF Text',
    send_email_image: 'New Image Email',
    send_text_image: 'New Image Text',
    watched_video: 'Video Watching',
    watched_image: 'Image Watching',
    watched_pdf: 'PDF Watching',
    deal: 'New Deal',
    update_contact: 'Contact update activity',
    update_follow_up: 'Edit Task',
    replied_text: 'Text Reply',
    watched_material: 'Material Watching',
    move_deal: 'Move Deal',
    automation: 'Automation',
    appointment: 'New Appointment',
    update_appointment: 'Update Appointment'
  };

  NoLimitActions = [
    'note',
    'follow_up',
    'update_contact',
    'update_follow_up',
    'deal',
    'move_deal'
  ];
}
