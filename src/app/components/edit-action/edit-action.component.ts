import {
  Component,
  OnInit,
  Inject,
  ViewChild,
  AfterContentChecked,
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
  TIMES,
  ActionName,
  ACTION_CAT,
  CALENDAR_DURATION,
  AUTOMATION_ATTACH_SIZE,
  AUTOMATION_ICONS
} from 'src/app/constants/variable.constants';
import { MaterialService } from 'src/app/services/material.service';
import { Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { FileService } from 'src/app/services/file.service';
import { LabelService } from 'src/app/services/label.service';
import { UserService } from '../../services/user.service';
import { Task } from '../../models/task.model';
import { HtmlEditorComponent } from 'src/app/components/html-editor/html-editor.component';
import * as moment from 'moment';
import * as _ from 'lodash';
import { searchReg } from 'src/app/helper';
import { Template } from 'src/app/models/template.model';
import { StoreService } from 'src/app/services/store.service';
import { TemplatePortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatesService } from '../../services/templates.service';
import { ConnectService } from '../../services/connect.service';
import { ToastrService } from 'ngx-toastr';
import { DealsService } from '../../services/deals.service';
import { MaterialBrowserComponent } from '../material-browser/material-browser.component';
import { environment } from '../../../environments/environment';
import { HelperService } from '../../services/helper.service';
import { ConfirmComponent } from '../confirm/confirm.component';
import { AutomationService } from '../../services/automation.service';
import { AppointmentService } from '../../services/appointment.service';
import { Contact } from '../../models/contact.model';
import {DialerService} from "../../services/dialer.service";

@Component({
  selector: 'app-edit-action',
  templateUrl: './edit-action.component.html',
  styleUrls: ['./edit-action.component.scss']
})
export class EditActionComponent implements OnInit, AfterContentChecked {
  category;
  type = '';
  action;
  submitted = false;
  isCalendly = false;

  materials = [];
  materialsLoading = false;
  materialsError = ''; // Load Error
  materialError = ''; // Select Error

  templateLoadingSubscription: Subscription;
  dialerSubscription: Subscription;
  isProcessing = true;
  templates;
  templateLoadError = '';
  myControl = new FormControl();
  selectedTemplate: Template = new Template();

  due_date = {
    year: '',
    month: '',
    day: ''
  };
  due_time = '12:00:00.000';
  due_duration = 1;
  times = TIMES;
  followDueOption = 'date';

  // Contact Update
  contactUpdateOption = 'update_label';
  labels = [];
  labelsLoading = false;
  labelsLoadError = '';
  commandLabel = ''; // Label
  commandName = '';
  commandTags = []; // Tags
  selectedTags = [];
  pushCommandTags = [];
  pullCommandTags = [];

  mediaType = '';
  materialType = '';
  material;

  default = {
    sms: '',
    email: ''
  };

  periodOption = 'gap';
  parentId = false;

  plan_time = { day: 0, hour: 1, min: 0 };
  plan_time_delay = 1;

  attachmentLimit = AUTOMATION_ATTACH_SIZE;

  @ViewChild('editor') htmlEditor: HtmlEditorComponent;
  @ViewChild('searchInput') searchField: ElementRef;
  @ViewChild('subjectField') subjectField: ElementRef;
  currentUser;

  error = '';

  selectedFollow: any;
  followUpdateOption = 'update_follow_up';
  updateFollowDueOption = 'date';
  update_due_date = {
    year: '',
    month: '',
    day: ''
  };
  update_due_time = '12:00:00.000';
  selectedDate = '';
  update_due_duration = 0;
  task = new Task();

  searchStr = '';
  filterMaterials = [];

  loadSubscription: Subscription;
  profileSubscription: Subscription;

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
  smsContentCursorStart = 0;
  smsContentCursorEnd = 0;
  smsContent = '';
  subjectFocus = false;
  contentFocus = false;

  dealNameCursorStart = 0;
  dealNameCursorEnd = 0;
  dealNameFocus = false;

  nodes = [];
  edges = [];

  moveDealOption = 'next';
  automation_type = '';
  automation = null;
  selectedAutomation = null;

  calendar_durations = CALENDAR_DURATION;
  selectedCalendar;
  appointmentDueOption = 'delay';
  timeDelayType = 'hour';
  timeUntilType = 'hour';
  conditionHandler = '';
  isAvailableAssignAt = false;
  rvms = [];
  selectedVoiceMail = null;

  ActionName = ActionName;

  minDate;
  days = Array(29).fill(0);
  hours = Array(23).fill(0);

  @Output() onClose = new EventEmitter();
  data;

  selectedTimezone = moment.tz.guess();

  // Ringless VM variables
  newRinglessFile;
  newRinglessName = '';
  creatingRingless = false;

  constructor(
    private dialog: MatDialog,
    private materialService: MaterialService,
    private userService: UserService,
    private fileService: FileService,
    public templatesService: TemplatesService,
    private helperSerivce: HelperService,
    private _viewContainerRef: ViewContainerRef,
    public connectService: ConnectService,
    private toastr: ToastrService,
    private overlay: Overlay,
    private cdr: ChangeDetectorRef,
    private appRef: ApplicationRef,
    private dealsService: DealsService,
    public storeService: StoreService,
    public labelService: LabelService,
    private automationService: AutomationService,
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
    this.appointmentService.loadCalendars(false);
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.currentUser = res;
    });

    this.dialerSubscription && this.dialerSubscription.unsubscribe();
    this.dialerService.loadAudioMessages();
    this.dialerSubscription = this.dialerService.rvms$.subscribe((res) => {
      if (res['success']) {
        this.rvms = res['messages'];
      }
    });

    this.templatesService.loadAll(false);

    this.dealsService.getStage(true);
    this.dealsService.stages$.subscribe((res) => {
      this.stages = [...res];
    });

    this.authToken = this.userService.getToken();
    this.userId = this.userService.profile.getValue()._id;

    this.initVariables();
    this.storeService.actionInputData$.subscribe((res) => {
      if (res) {
        this.data = res;
        this.initDialog();
      }
    });
  }

  ngOnInit(): void {
    this.materialService.loadOwn(true);
    this.storeService.materials$.subscribe((materials) => {
      this.materials = materials;
    });
    this.storeService.actionInputData$.subscribe((res) => {
      if (res) {
        this.data = res;
        this.initDialog();
      }
    });
  }

  ngOnDestroy(): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
  }

  ngAfterContentChecked(): void {}

  removeError(): void {
    this.error = '';
  }
  remove(): void {
    this.commandLabel = '';
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
  toggleMaterial(material): void {
    if (this.material && this.material._id) {
      if (material) {
        if (material._id !== this.material._id) {
          this.material = material;
        }
      }
    }
  }

  updateAction(): void {
    let period = this.action['period'];
    if (!this.action['condition'] && this.action['period'] === 'custom_date') {
      if (this.timeDelayType === 'hour') {
        period = this.plan_time_delay;
      } else {
        period = this.plan_time_delay * 24;
      }

      if (!period && this.NoLimitActions.indexOf(this.type) < 0) {
        return;
      }
    }

    if (
      this.type === 'email' ||
      this.type === 'send_email_video' ||
      this.type === 'send_email_pdf' ||
      this.type === 'send_email_image' ||
      this.type === 'send_email_material'
    ) {
      this.action['videos'] = [];
      this.action['pdfs'] = [];
      this.action['images'] = [];
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
              this.action['videos'] = [insertedMaterials[0]._id];
            } else if (this.materials[index].material_type === 'pdf') {
              this.type = 'send_email_pdf';
              this.action['pdfs'] = [insertedMaterials[0]._id];
            } else if (this.materials[index].material_type === 'image') {
              this.type = 'send_email_image';
              this.action['images'] = [insertedMaterials[0]._id];
            }
            this.action['label'] = this.ActionName[this.type];
          }
        } else {
          this.type = 'send_email_material';
          this.action['label'] = this.ActionName[this.type];

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
        const data = {
          ...this.action,
          type: this.type,
          period
        };
        this.storeService.actionOutputData.next(data);
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   period
        // });
      } else {
        this.type = 'email';
        this.action['label'] = this.ActionName[this.type];
        const data = {
          ...this.action,
          type: this.type,
          period
        };
        this.storeService.actionOutputData.next(data);
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   period
        // });
      }
      return;
    }

    if (
      this.type === 'text' ||
      this.type === 'send_text_video' ||
      this.type === 'send_text_pdf' ||
      this.type === 'send_text_image' ||
      this.type === 'send_text_material'
    ) {
      this.action['videos'] = [];
      this.action['pdfs'] = [];
      this.action['images'] = [];
      const content = this.action['content'];

      const insertedMaterials = this.helperSerivce.getSMSMaterials(content);
      if (insertedMaterials && insertedMaterials.length > 0) {
        if (insertedMaterials && insertedMaterials.length === 1) {
          if (insertedMaterials[0].type === 'video') {
            this.type = 'send_text_video';
            this.action['videos'] = [insertedMaterials[0]._id];
          } else if (insertedMaterials[0].type === 'pdf') {
            this.type = 'send_text_pdf';
            this.action['pdf'] = [insertedMaterials[0]._id];
          } else if (insertedMaterials[0].type === 'image') {
            this.type = 'send_text_image';
            this.action['images'] = [insertedMaterials[0]._id];
          }
          this.action['label'] = this.ActionName[this.type];
        } else {
          this.type = 'send_text_material';
          this.action['label'] = this.ActionName[this.type];

          for (const material of insertedMaterials) {
            if (material.type === 'video') {
              if (Array.isArray(this.action['videos'])) {
                this.action['videos'] = [
                  ...this.action['videos'],
                  material._id
                ];
              } else {
                this.action['videos'] = [material._id];
              }
            } else if (material.type === 'pdf') {
              if (Array.isArray(this.action['pdfs'])) {
                this.action['pdfs'] = [...this.action['pdfs'], material._id];
              } else {
                this.action['pdfs'] = [material._id];
              }
            } else if (material.type === 'image') {
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
        const data = {
          ...this.action,
          type: this.type,
          period
        };
        this.storeService.actionOutputData.next(data);
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   period
        // });
      } else {
        this.type = 'text';
        this.action['label'] = this.ActionName[this.type];
        const data = {
          ...this.action,
          type: this.type,
          period
        };
        this.storeService.actionOutputData.next(data);
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   period
        // });
      }
      return;
    }

    if (this.type === 'follow_up') {
      if (this.followDueOption === 'date') {
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
            task_type: this.task.type,
            due_date: due_date,
            period,
            due_duration: undefined,
            timezone: this.selectedTimezone
          };
          this.storeService.actionOutputData.next(data);
          this.closeDrawer();
          // this.dialogRef.close({
          //   ...this.action,
          //   task_type: this.task.type,
          //   due_date: due_date,
          //   period,
          //   due_duration: undefined
          // });
        }
      } else {
        const data = {
          ...this.action,
          task_type: this.task.type,
          due_duration:
            this.timeUntilType === 'hour'
              ? this.due_duration
              : this.due_duration * 24,
          period,
          due_date: undefined
        };
        this.storeService.actionOutputData.next(data);
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   task_type: this.task.type,
        //   due_duration: this.due_duration,
        //   period,
        //   due_date: undefined
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
        console.log('Update', {
          ...this.action,
          type: this.type,
          period,
          commands,
          content
        });
        const data = {
          ...this.action,
          type: this.type,
          period,
          commands,
          content
        };
        this.storeService.actionOutputData.next(data);
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   period,
        //   command,
        //   content
        // });
        return;
      }
    }
    if (this.type === 'update_follow_up') {
      if (this.followUpdateOption === 'update_follow_up') {
        if (this.updateFollowDueOption === 'no_update') {
          const data = {
            ...this.action,
            type: this.type,
            task_type: this.task.type,
            due_duration: undefined,
            due_date: undefined,
            period,
            command: 'update_follow_up',
            ref_id: this.selectedFollow.id
          };
          this.storeService.actionOutputData.next(data);
          this.closeDrawer();
          // this.dialogRef.close({
          //   ...this.action,
          //   type: this.type,
          //   task_type: this.task.type,
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
              due_duration: undefined,
              due_date: due_date,
              period,
              command: 'update_follow_up',
              ref_id: this.selectedFollow.id
            };
            this.storeService.actionOutputData.next(data);
            this.closeDrawer();
            // this.dialogRef.close({
            //   ...this.action,
            //   type: this.type,
            //   task_type: this.task.type,
            //   due_duration: undefined,
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
            due_date: undefined,
            due_duration:
              this.timeUntilType === 'hour'
                ? this.update_due_duration || 0
                : this.update_due_duration * 24 || 0,
            period,
            command: 'update_follow_up',
            ref_id: this.selectedFollow.id
          };
          this.storeService.actionOutputData.next(data);
          this.closeDrawer();
          // this.dialogRef.close({
          //   ...this.action,
          //   type: this.type,
          //   task_type: this.task.type,
          //   due_date: undefined,
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
          period,
          command: 'complete_follow_up',
          ref_id: this.selectedFollow.id
        };
        this.storeService.actionOutputData.next(data);
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   task_type: this.task.type,
        //   period,
        //   command: 'complete_follow_up',
        //   ref_id: this.selectedFollow.id
        // });
      }
      return;
    }
    if (this.type === 'automation') {
      if (this.selectedAutomation) {
        this.action['automation_id'] = this.selectedAutomation._id;
        const data = {
          ...this.action,
          type: this.type,
          period
        };
        this.storeService.actionOutputData.next(data);
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   period
        // });
      }
      return;
    }
    if (this.type === 'appointment' || this.type === 'update_appointment') {
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
          const data = {
            ...this.action,
            due_date: due_date,
            period,
            due_duration: undefined
          };
          this.storeService.actionOutputData.next(data);
          this.closeDrawer();
          // this.dialogRef.close({
          //   ...this.action,
          //   due_date: due_date,
          //   period,
          //   due_duration: undefined
          // });
        }
      } else {
        const data = {
          ...this.action,
          due_duration:
            this.timeUntilType == 'hour'
              ? this.due_duration
              : this.due_duration * 24,
          period,
          due_date: undefined
        };
        this.storeService.actionOutputData.next(data);
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   due_duration: this.due_duration,
        //   period,
        //   due_date: undefined
        // });
      }
      return;
    }
    if (this.type === 'note') {
      if (!this.action['content']) {
        return;
      }
      const data = {
        ...this.action,
        type: this.type,
        period
      };
      this.storeService.actionOutputData.next(data);
      this.closeDrawer();
      return;
    }
    if (this.type === 'audio') {
      if (this.selectedVoiceMail) {
        const data = {
          ...this.action,
          type: this.type,
          category: this.category,
          period
        };
        this.storeService.actionOutputData.next(data);
        this.closeDrawer();
      } else {
        this.createRinglessVoiceMail();
      }
      return;
    } else {
      const data = {
        ...this.action,
        type: this.type,
        period
      };
      this.storeService.actionOutputData.next(data);
      this.closeDrawer();
      // this.dialogRef.close({
      //   ...this.action,
      //   type: this.type,
      //   period
      // });
    }
    return;
  }

  getConditionsById(parentId): any {
    const conditionNodes = [];
    const resultNodes = [];
    for (const node of this.nodes) {
      if (node.category === ACTION_CAT.CONDITION) {
        conditionNodes.push(node);
      }
    }
    for (const conditionNode of conditionNodes) {
      const index = this.edges.findIndex(
        (item) => item.target === conditionNode.id && item.source === parentId
      );
      if (index >= 0) {
        resultNodes.push(conditionNode);
      }
    }
    return resultNodes;
  }

  // getActionMaterials(node): any {
  //   let materials = [];
  //   if (node['videos']) {
  //     if (Array.isArray(node['videos'])) {
  //       materials = [...node['videos']];
  //     } else {
  //       materials = [node['videos']];
  //     }
  //   }
  //   if (node['pdfs']) {
  //     if (Array.isArray(node['pdfs'])) {
  //       materials = [...materials, ...node['pdfs']];
  //     } else {
  //       materials = [...materials, node['pdfs']];
  //     }
  //   }
  //   if (node['images']) {
  //     if (Array.isArray(node['images'])) {
  //       materials = [...materials, ...node['images']];
  //     } else {
  //       materials = [...materials, node['images']];
  //     }
  //   }
  //   return materials;
  // }

  displayFn(template): any {
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
    if (this.selectedFollow.due_duration) {
      this.update_due_duration = this.selectedFollow.due_duration;
      this.updateFollowDueOption = 'delay';
    } else if (this.selectedFollow.due_date) {
      this.updateFollowDueOption = 'date';
      let timezone = this.currentUser.time_zone;
      timezone.replace(':', '.');
      timezone = parseFloat(timezone);
      const date = new Date(this.selectedFollow.due_date);
      const utc = date.getTime() + date.getTimezoneOffset() * 60000;
      const nd = new Date(utc + 3600000 * timezone);
      this.update_due_date = {
        year: nd.getFullYear().toString(),
        month: (nd.getMonth() + 1).toString(),
        day: nd.getDate().toString()
      };
      const hour = nd.getHours();
      const min = nd.getMinutes();
      const hour_s = hour < 10 ? '0' + hour : hour;
      const min_s = min < 10 ? '0' + min : min;
      const time = `${hour_s}:${min_s}:00.000`;
      this.times.some((e) => {
        if (e.id === time) {
          this.update_due_time = e.id;
          return true;
        }
      });
    }
  }

  selectTemplate(event: Template): void {
    this.selectedTemplate = event;
    this.action['subject'] = this.selectedTemplate.subject;
    this.action['content'] = this.selectedTemplate.content;
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

  getSmsContentCursor(field): void {
    if (field.selectionStart || field.selectionStart === '0') {
      this.smsContentCursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      this.smsContentCursorEnd = field.selectionEnd;
    }
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

  insertDealNameValue(value, field): void {
    let dealName = this.action['deal_name'] || '';
    dealName =
      dealName.substr(0, this.dealNameCursorStart) +
      value +
      dealName.substr(
        this.dealNameCursorEnd,
        dealName.length - this.dealNameCursorEnd
      );
    this.action['deal_name'] = dealName;
    this.dealNameCursorStart = this.dealNameCursorStart + value.length;
    this.dealNameCursorEnd = this.dealNameCursorStart;
    field.focus();
  }

  insertSmsContentValue(value, field): void {
    let smsContent = this.action['content'];
    smsContent =
      smsContent.substr(0, this.smsContentCursorStart) +
      value +
      smsContent.substr(
        this.smsContentCursorEnd,
        smsContent.length - this.smsContentCursorEnd
      );
    this.smsContentCursorStart = this.smsContentCursorStart + value.length;
    this.smsContentCursorEnd = this.smsContentCursorStart;
    field.focus();
    this.action['content'] = smsContent;
    this.htmlEditor.setValue(this.action['content']);
  }

  NoLimitActions = [
    'note',
    'follow_up',
    'update_contact',
    'update_follow_up',
    'deal',
    'move_deal'
  ];

  numPad(num): any {
    if (num < 10) {
      return '0' + num;
    }
    return num + '';
  }

  getDateTime(): any {
    if (this.due_date && this.due_date['day'] !== '') {
      return (
        this.due_date['year'] +
        '-' +
        this.due_date['month'] +
        '-' +
        this.due_date['day']
      );
    }
  }

  setDateTime(): void {
    this.selectedDate = moment(this.getDateTime()).format('YYYY-MM-DD');
    close();
  }

  getUpdateDateTime(): any {
    if (this.update_due_date && this.update_due_date['day'] !== '') {
      return (
        this.update_due_date['year'] +
        '-' +
        this.update_due_date['month'] +
        '-' +
        this.update_due_date['day']
      );
    }
  }

  setUpdateDateTime(): void {
    this.selectedDate = moment(this.getUpdateDateTime()).format('YYYY-MM-DD');
    close();
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.filter();
  }

  filter(): void {
    this.filterMaterials = this.materials.filter((item) => {
      return searchReg(item.title, this.searchStr);
    });
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

  getMaterialType(material: any): string {
    if (material.type) {
      if (material.type === 'application/pdf') {
        return 'pdf';
      } else if (material.type.includes('image')) {
        return 'image';
      }
    }
    return 'video';
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

  onChangeTemplate(template: Template): void {
    this.action['subject'] = template.subject;
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

  isDisableEmailMaterial(): boolean {
    // if (this.materialType !== '' && this.hasEmailMaterial()) {
    //   return true;
    // }
    return false;
  }

  isDisableSMSMaterial(): boolean {
    // if (this.materialType !== '' && this.hasSMSMaterial()) {
    //   return true;
    // }
    return false;
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
        // material_type: this.materialType
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

  openEmailMaterialsDlg(): void {
    const content = this.action['content'];
    const materials = this.helperSerivce.getMaterials(content);
    const materialDialog = this.dialog.open(MaterialBrowserComponent, {
      width: '98vw',
      maxWidth: '940px',
      data: {
        hideMaterials: materials,
        title: 'Insert material',
        multiple: true
        // material_type: this.materialType
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

  selectSMSTemplate(template: Template): void {
    this.selectedTemplate = template;
    this.action['content'] = this.selectedTemplate.content;
    if (template.video_ids.length) {
      template.video_ids.forEach((video) => {
        this.action.content = this.action.content.replace(
          '{{' + video + '}}',
          environment.website + '/video?video=' + video
        );
      });
    }
    if (template.pdf_ids.length) {
      template.pdf_ids.forEach((pdf) => {
        this.action.content = this.action.content.replace(
          '{{' + pdf + '}}',
          environment.website + '/pdf?pdf=' + pdf
        );
      });
    }
    if (template.image_ids.length) {
      template.image_ids.forEach((image) => {
        this.action.content = this.action.content.replace(
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

  getTitle(title): string {
    if (title) {
      return title.replace('New', 'Edit');
    }
    return '';
  }

  selectAutomation($event): void {
    console.log('select automation ==========>', $event);
    this.selectedAutomation = $event;
  }

  handleAddressChange(evt: any): void {
    this.action.appointment.location = evt.formatted_address;
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
        (item) => item.id == this.action['voicemail']
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

  initVariables(): void {
    this.category = null;
    this.type = '';
    this.action = {};
    this.submitted = false;
    this.isCalendly = false;

    this.materials = [];
    this.materialsLoading = false;
    this.materialsError = ''; // Load Error
    this.materialError = ''; // Select Error

    this.isProcessing = true;
    this.templates = null;
    this.templateLoadError = '';
    this.myControl = new FormControl();
    this.selectedTemplate = new Template();

    this.due_date = {
      year: '',
      month: '',
      day: ''
    };
    this.due_time = '12:00:00.000';
    this.due_duration = 1;
    this.times = TIMES;
    this.followDueOption = 'date';

    // Contact Update
    this.contactUpdateOption = 'update_label';
    this.labels = [];
    this.labelsLoading = false;
    this.labelsLoadError = '';
    this.commandLabel = ''; // Label
    this.commandTags = []; // Tags
    this.selectedTags = [];

    this.mediaType = '';
    this.materialType = '';
    this.material = null;

    this.default = {
      sms: '',
      email: ''
    };

    this.periodOption = 'gap';
    this.parentId = false;

    this.plan_time = { day: 0, hour: 1, min: 0 };
    this.plan_time_delay = 1;

    this.attachmentLimit = AUTOMATION_ATTACH_SIZE;

    this.error = '';

    this.selectedFollow = null;
    this.followUpdateOption = 'update_follow_up';
    this.updateFollowDueOption = 'date';
    this.update_due_date = {
      year: '',
      month: '',
      day: ''
    };
    this.update_due_time = '12:00:00.000';
    this.selectedDate = '';

    const current = new Date();
    this.minDate = {
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      day: current.getDate()
    };

    this.due_date = { ...this.minDate };
    this.update_due_date = { ...this.minDate };

    this.update_due_duration = 0;
    this.task = new Task();

    this.searchStr = '';
    this.filterMaterials = [];

    this.set = 'twitter';
    this.templateSubject = '';
    this.templateValue = '';
    this.stages = [];
    this.deal_name = '';
    this.deal_stage = '';
    this.popup = null;

    this.authToken = '';
    this.userId = '';
    this.attachments = [];
    this.smsContentCursorStart = 0;
    this.smsContentCursorEnd = 0;
    this.smsContent = '';
    this.subjectFocus = false;
    this.contentFocus = false;

    this.dealNameCursorStart = 0;
    this.dealNameCursorEnd = 0;
    this.dealNameFocus = false;

    this.nodes = [];
    this.edges = [];

    this.moveDealOption = 'next';
    this.automation_type = '';
    this.automation = null;
    this.selectedAutomation = null;

    this.calendar_durations = CALENDAR_DURATION;
    this.selectedCalendar = null;
    this.appointmentDueOption = 'delay';
    this.timeDelayType = 'hour';
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
    });

    this.authToken = this.userService.getToken();
    this.userId = this.userService.profile.getValue()._id;

    if (this.data) {
      if (this.data.nodes) {
        this.nodes = this.data.nodes;
      }
      if (this.data.edges) {
        this.edges = this.data.edges;
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

      if (this.data.action) {
        if (this.data.action.type.indexOf('email') !== -1) {
          this.mediaType = 'email';
        } else {
          this.mediaType = 'text';
        }
        if (this.data.action.type.indexOf('video') !== -1) {
          this.materialType = 'video';
        }
        if (this.data.action.type.indexOf('pdf') !== -1) {
          this.materialType = 'pdf';
        }
        if (this.data.action.type.indexOf('image') !== -1) {
          this.materialType = 'image';
        }
        if (this.data.action.type.indexOf('material') !== -1) {
          this.materialType = '';
        }
        if (this.data.action.type === 'follow_up') {
          this.task.type = this.data.action.task_type;
          if (this.data.action.due_duration) {
            this.due_duration = this.data.action.due_duration;
            this.followDueOption = 'delay';
          } else if (this.data.action.due_date) {
            this.followDueOption = 'date';
            this.selectedTimezone = this.data.action.timezone;
            const due_date = moment.tz(
              this.data.action.due_date,
              this.selectedTimezone
            );
            this.due_date = {
              year: due_date.get('year').toString(),
              month: (due_date.get('month') + 1).toString(),
              day: due_date.get('date').toString()
            };
            this.setDateTime();
            const hour = due_date.get('hour');
            const min = due_date.get('minute');
            const hour_s = hour < 10 ? '0' + hour : hour;
            const min_s = min < 10 ? '0' + min : min;
            const time = `${hour_s}:${min_s}:00.000`;
            this.times.some((e) => {
              if (e.id === time) {
                this.due_time = e.id;
                return true;
              }
            });
          }
        }
        if (this.data.action.type === 'update_contact') {
          this.contactUpdateOption = this.data.action.commands[0];
          this.commandLabel = this.data.action.content[0];
          this.labelService.allLabels$.subscribe((res) => {
            this.labels = res;
          });
          const label = this.labels.find((e) => e._id === this.commandLabel);
          this.commandName = label.name;
          this.pushCommandTags = this.data.action.content[1];
          this.pullCommandTags = this.data.action.content[2];
        }

        if (this.data.action.type === 'update_follow_up') {
          this.task.type = this.data.action.task_type;
          if (this.data.action.due_date) {
            this.updateFollowDueOption = 'update_due_date';
            let timezone = this.currentUser.time_zone;
            timezone.replace(':', '.');
            timezone = parseFloat(timezone);
            const date = new Date(this.data.action.due_date);
            const utc = date.getTime() + date.getTimezoneOffset() * 60000;
            const nd = new Date(utc + 3600000 * timezone);
            this.update_due_date = {
              year: nd.getFullYear().toString(),
              month: (nd.getMonth() + 1).toString(),
              day: nd.getDate().toString()
            };
            this.setUpdateDateTime();
            const hour = nd.getHours();
            const min = nd.getMinutes();
            const hour_s = hour < 10 ? '0' + hour : hour;
            const min_s = min < 10 ? '0' + min : min;
            const time = `${hour_s}:${min_s}:00.000`;
            this.times.some((e) => {
              if (e.id === time) {
                this.update_due_time = e.id;
                return true;
              }
            });
          } else if (typeof this.data.action.due_duration === 'undefined') {
            this.updateFollowDueOption = 'no_update';
          } else {
            this.updateFollowDueOption = 'update_due_duration';
            this.update_due_duration = this.data.action.due_duration;
          }
          if (this.data.follows && this.data.follows.length) {
            this.data.follows.some((e) => {
              if (e.id === this.data.action.ref_id) {
                this.selectedFollow = e;
                return true;
              }
            });
          }
          this.followUpdateOption = this.data.action.command;
        }

        if (this.data.action.type === 'move_deal') {
          if (this.data.action['deal_stage']) {
            this.moveDealOption = 'other';
          }
        }

        if (this.data.action.type === 'automation') {
          if (this.data.action['automation']) {
            this.automationService.automations$.subscribe((res) => {
              if (res && res.length > 0) {
                const index = res.findIndex(
                  (item) => item._id === this.data.action['automation']
                );
                if (index >= 0) {
                  this.selectedAutomation = res[index];
                }
              }
            });
          }
        }

        if (this.data.action.type === 'audio') {
          console.log('edit action =======>', this.rvms, this.data.action);
          if (this.data.action['voicemail']) {
            const index = this.rvms.findIndex((item) => item.id === this.data.action['voicemail']);
            if (index >= 0) {
              this.selectedVoiceMail = this.rvms[index];
            } else {
              this.selectedVoiceMail = null;
            }
          }
        }

        if (
          this.data.action.type === 'appointment' ||
          this.data.action.type === 'update_appointment'
        ) {
          if (this.data.action.type === 'appointment') {
            this.selectedCalendar = {
              ...this.data.action.appointment.calendar
            };
          }
          for (
            let i = 0;
            i < this.data.action.appointment.contacts.length;
            i++
          ) {
            const contactObj = new Contact().deserialize(
              this.data.action.appointment.contacts[i]
            );
            this.data.action.appointment.contacts.splice(i, 1, contactObj);
          }
          if (this.data.action.due_duration) {
            this.due_duration = this.data.action.due_duration;
            this.appointmentDueOption = 'delay';
          } else if (this.data.action.due_date) {
            this.appointmentDueOption = 'date';
            let timezone = this.currentUser.time_zone;
            timezone.replace(':', '.');
            timezone = parseFloat(timezone);
            const date = new Date(this.data.action.due_date);
            const utc = date.getTime() + date.getTimezoneOffset() * 60000;
            const nd = new Date(utc + 3600000 * timezone);
            this.due_date = {
              year: nd.getFullYear().toString(),
              month: (nd.getMonth() + 1).toString(),
              day: nd.getDate().toString()
            };
            this.setDateTime();
            const hour = nd.getHours();
            const min = nd.getMinutes();
            const hour_s = hour < 10 ? '0' + hour : hour;
            const min_s = min < 10 ? '0' + min : min;
            const time = `${hour_s}:${min_s}:00.000`;
            this.times.some((e) => {
              if (e.id === time) {
                this.due_time = e.id;
                return true;
              }
            });
          }
        }

        if (this.data.action.type.indexOf('send_text') !== -1) {
          if (this.data.action.videos && this.data.action.videos.length) {
            this.data.action.videos.forEach((video) => {
              this.data.action.content = this.data.action.content.replace(
                '{{' + video + '}}',
                environment.website + '/video?video=' + video
              );
            });
          }
          if (this.data.action.pdfs && this.data.action.pdfs.length) {
            this.data.action.pdfs.forEach((pdf) => {
              this.data.action.content = this.data.action.content.replace(
                '{{' + pdf + '}}',
                environment.website + '/pdf?pdf=' + pdf
              );
            });
          }
          if (this.data.action.images && this.data.action.images.length) {
            this.data.action.images.forEach((image) => {
              this.data.action.content = this.data.action.content.replace(
                '{{' + image + '}}',
                environment.website + '/image?image=' + image
              );
            });
          }
        }

        this.isAvailableAssignAt = this.data.moveDeal;
        console.log('assign at ====>', this.isAvailableAssignAt);
        this.type = this.data.action.type;
        this.parentId = this.data.action.parent_id;
        this.action = { ...this.data.action };
        this.attachments = this.action['attachments'];

        if (
          !(
            this.action['period'] == '0.17' ||
            this.action['period'] == '0.5' ||
            this.action['period'] == '1' ||
            this.action['period'] == '6' ||
            this.action['period'] == '12' ||
            this.action['period'] == '24' ||
            this.action['period'] == '48' ||
            this.action['period'] == '72' ||
            this.action['period'] == '168' ||
            this.action['period'] == '336' ||
            this.action['period'] == '0'
          )
        ) {
          const period = this.action['period'];
          // this.plan_time['day'] = Math.floor(period / 24);
          // period = period % 24;
          const min = period - Math.floor(period);
          this.plan_time['min'] = parseFloat(min.toFixed(2));
          this.plan_time['hour'] = Math.floor(period);
          if (period >= 48) {
            this.timeDelayType = 'day';
            this.plan_time_delay = Math.floor(period / 24);
          } else {
            this.timeDelayType = 'hour';
            this.plan_time_delay = period;
          }
          this.action['period'] = 'custom_date';
        }

        if (this.action.due_duration) {
          const due_duration = this.action.due_duration || 0;
          if (due_duration >= 48 && due_duration % 24 == 0) {
            this.timeUntilType = 'day';
            this.due_duration = due_duration / 24;
          } else {
            this.timeUntilType = 'hour';
          }
        }

        // const _SELF = this;
        setTimeout(() => {
          if (this.htmlEditor && this.action.content) {
            this.htmlEditor.setValue(this.action.content);
          }
          if (this.searchField) {
            this.searchField.nativeElement.blur();
          }
          if (this.data.action && !this.data.action['group']) {
            this.action['group'] = '';
          }
        }, 300);

        this.loadSubscription = this.storeService.materials$.subscribe(
          (materials) => {
            if (materials.length > 0) {
              this.materialsLoading = false;
              if (this.materialType === '') {
                this.materials = [...materials];
                this.filterMaterials = [...materials];
              } else {
                const material = materials.filter(
                  (item) => item.material_type === this.materialType
                );
                this.materials = material;
                this.filterMaterials = material;
              }
            }
          }
        );
      }
    }
  }

  selectTimezone($event): void {
    this.selectedTimezone = $event?.tz_name;
  }

  ////////////////////////////////////////////////////////////////////////////////
  /////////////////////////  Ringless VoiceMail Handler //////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
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
          this.updateAction();
        }
      }
    });
  }
}
