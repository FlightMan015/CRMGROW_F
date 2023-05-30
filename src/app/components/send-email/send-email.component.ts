import {
  AfterViewInit,
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { forkJoin, from } from 'rxjs';
import { MaterialService } from 'src/app/services/material.service';
import { HelperService } from 'src/app/services/helper.service';
import { ContactService } from 'src/app/services/contact.service';
import { Contact } from 'src/app/models/contact.model';
import { Template } from 'src/app/models/template.model';
import { MaterialAddComponent } from '../material-add/material-add.component';
import { HtmlEditorComponent } from 'src/app/components/html-editor/html-editor.component';
import { ScheduleSendComponent } from 'src/app/components/schedule-send/schedule-send.component';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import * as _ from 'lodash';
import { TIMES, CHUNK_SIZE, HOURS } from 'src/app/constants/variable.constants';
import * as moment from 'moment';
import { UserService } from 'src/app/services/user.service';
import { DealsService } from '../../services/deals.service';
import { HandlerService } from 'src/app/services/handler.service';
import { MaterialBrowserComponent } from '../material-browser/material-browser.component';
import { Subscription } from 'rxjs';
import { Garbage } from 'src/app/models/garbage.model';
import { ConnectService } from 'src/app/services/connect.service';
import { StripTagsPipe } from 'ngx-pipes';
import { ConfirmComponent } from '../confirm/confirm.component';
import { ToastrService } from 'ngx-toastr';
import { StoreService } from '../../services/store.service';
import { Draft } from '../../models/draft.model';
import { EmailService } from '../../services/email.service';
import { TemplatesService } from '../../services/templates.service';
import { TemplatePortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-send-email',
  templateUrl: './send-email.component.html',
  styleUrls: ['./send-email.component.scss'],
  providers: [StripTagsPipe]
})
export class SendEmailComponent implements OnInit, OnDestroy, AfterViewInit {
  emailSubmitted = false;
  emailSending = false;
  ccFlag = false;
  bccFlag = false;
  emailContacts: Contact[] = [];
  ccContacts: Contact[] = [];
  bccContacts: Contact[] = [];
  emailSubject = '';
  emailContent = '';
  selectedTemplate: Template = new Template();
  materials = [];
  allMaterials = [];
  schedule_date = {
    year: '',
    month: '',
    day: ''
  };
  scheduleData: any;
  scheduleDateTime: any;
  scheduleCheck = false;
  planned = false;
  selectedDateTime;
  minDate: any;
  schedule_time = '12:00:00.000';
  times = TIMES;
  attachments = [];
  type = '';
  dealId;
  mainContact;
  toFocus = false;
  subjectFocus = false;
  contentFocus = false;
  showCheck = 0;
  isCalendly = false;
  garbage: Garbage = new Garbage();
  garbageSubscription: Subscription;
  profileSubscription: Subscription;
  loadSubscription: Subscription;
  saveSubscription: Subscription;
  dialogType = '';
  isMinimizable = true;

  initEmailContent = '';
  initEmailSubject = '';
  initEmailContacts: Contact[] = [];
  initCcContacts: Contact[] = [];
  initBccContacts: Contact[] = [];
  userId = '';
  draftEmail = new Draft();
  set = 'twitter';
  templatePortal: TemplatePortal;
  @Input() subject: string = '';
  @Input() value: string = '';
  @ViewChild('subjectField') subjectField: ElementRef;
  @ViewChild('createNewContent') createNewContent: TemplateRef<unknown>;
  overlayRef: OverlayRef;

  @ViewChild('editor') htmlEditor: HtmlEditorComponent;

  // Business Hour Setting
  isEnableSend = false;
  startTime;
  endTime;

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<SendEmailComponent>,
    private helperSerivce: HelperService,
    private contactService: ContactService,
    private materialService: MaterialService,
    private userService: UserService,
    private handlerService: HandlerService,
    private dealService: DealsService,
    private connectService: ConnectService,
    private toast: ToastrService,
    private taskService: TaskService,
    private stripTags: StripTagsPipe,
    public templateService: TemplatesService,
    public storeService: StoreService,
    private emailService: EmailService,
    private _viewContainerRef: ViewContainerRef,
    private overlay: Overlay,
    private appRef: ApplicationRef,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    if (this.data && this.data.deal) {
      this.dealId = this.data.deal;
      this.type = 'deal';
      for (const contact of this.data.contacts) {
        this.emailContacts.push(contact);
      }
      if (this.data.due_date) {
        this.scheduleCheck = true;
        this.emailSubject = this.data.subject;
      }
    } else {
      if (this.data && this.data.contact) {
        this.emailContacts = [this.data.contact];
        this.mainContact = this.data.contact;
      }
      if (this.data && this.data.contacts && !this.data.due_date) {
        this.emailContacts = [...this.data.contacts];
        this.emailSubject = this.data.subject;
      }
      if (this.data && this.data.contacts && this.data.due_date) {
        this.emailContacts = [...this.data.contacts];
        this.emailSubject = this.data.subject;
        this.scheduleCheck = true;
      }
    }
    if (this.data && this.data.type) {
      this.dialogType = this.data.type;
    }
    if (this.data && this.data.draft) {
      this.draftEmail = this.data.draft;
    }
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = res;
      if (this.garbage?.calendly) {
        this.isCalendly = true;
      } else {
        this.isCalendly = false;
      }

      // Business Hour Setting
      const businessHour = this.garbage.email_time;
      if (!businessHour.is_enabled) {
        this.isEnableSend = true;
      } else {
        const businessTZ = moment.tz.guess(); //businessHour.timezone
        const businessDays = [0, 1, 2, 3, 4, 5, 6]; //businessHour.enabled_days || []
        const businessStartTime = businessHour.start_time;
        const businessEndTime = businessHour.end_time;
        this.startTime = HOURS.find((e) => e.id === businessStartTime);
        this.endTime = HOURS.find((e) => e.id === businessEndTime);
        const now = moment().tz(businessTZ);
        const nowTime = now.format('HH:mm:[00.000]');
        const nowDay = now.day();
        if (
          businessDays.includes(nowDay) &&
          nowTime > businessStartTime &&
          nowTime < businessEndTime
        ) {
          this.isEnableSend = true;
        } else {
          this.isEnableSend = false;
        }
      }
    });
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile) {
          this.userId = profile._id;
        }
      }
    );
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.storeService.materials$.subscribe(
      (materials) => {
        this.allMaterials = materials;
        this.allMaterials = _.uniqBy(this.allMaterials, '_id');
      }
    );
  }

  ngOnInit(): void {
    const defaultEmail = this.userService.email.getValue();
    if (
      this.draftEmail &&
      (this.draftEmail.subject || this.draftEmail.content)
    ) {
      this.emailSubject = this.draftEmail.subject;
      this.emailContent = this.draftEmail.content;
    } else {
      if (defaultEmail) {
        setTimeout(() => {
          this.selectTemplate(defaultEmail);
        }, 300);
      }
      this.saveInitValue();
    }
    if (this.data && this.data.due_date) {
      this.scheduleData = this.data;
      this.scheduleDateTime = this.data.due_date;
    }
    this.templateService.loadOwn(true);
  }
  ngOnDestroy(): void {
    if (this.dialogType === 'contact_email') {
      const data = {
        contact: this.mainContact._id,
        subject: this.emailSubject,
        content: this.emailContent,
        user: this.userId,
        type: 'contact_email'
      };
      if (this.data.draft) {
        data['_id'] = this.data.draft._id;
      }
      this.storeService.emailContactDraft.next(data);
    } else if (this.dialogType === 'deal_email') {
      const data = {
        user: this.userId,
        type: 'deal_email',
        subject: this.emailSubject,
        content: this.emailContent,
        deal: this.dealId
      };
      if (this.data.draft) {
        data['_id'] = this.data.draft._id;
      }
      this.storeService.emailDealDraft.next(data);
    } else if (this.dialogType === 'global_email') {
      const data = {
        subject: this.emailSubject,
        content: this.emailContent
      };
      this.storeService.emailGlobalDraft.next(data);
    }
  }

  ngAfterViewInit(): void {
    this.taskService.scheduleData$.subscribe((data) => {
      if (data.due_date) {
        this.scheduleData = data;
        this.scheduleDateTime = data.due_date;
        this.scheduleCheck = true;
      }
    });
  }
  sendEmail(): void {
    if (this.isEmpty(this.emailContent)) {
      return;
    }
    if (this.emailContacts.length) {
      // email api call
      const contacts = [];
      const newContacts = [];
      const cc = [];
      const bcc = [];
      const video_ids = [];
      const pdf_ids = [];
      const image_ids = [];
      const content = this.emailContent;
      const subject = this.emailSubject;
      this.emailContacts.forEach((e) => {
        if (e._id) contacts.push(e._id);
        else newContacts.push(e);
      });
      this.ccContacts.forEach((e) => cc.push(e.email));
      this.bccContacts.forEach((e) => bcc.push(e.email));
      const materials = this.helperSerivce.getMaterials(this.emailContent);
      // this.materials = _.intersectionBy(this.allMaterials, materials, '_id');
      materials.forEach((e) => {
        const type = this.helperSerivce.getMaterialType(e);
        switch (type) {
          case 'PDF':
          case 'pdf':
            pdf_ids.push(e._id);
            break;
          case 'Image':
          case 'image':
            image_ids.push(e._id);
            break;
          case 'Video':
          case 'video':
            video_ids.push(e._id);
            break;
        }
      });
      const data = {
        contacts,
        cc,
        bcc,
        video_ids,
        pdf_ids,
        image_ids,
        subject,
        content,
        attachments: this.attachments
      };
      if (!data.video_ids) {
        delete data.video_ids;
      }
      if (!data.pdf_ids) {
        delete data.pdf_ids;
      }
      if (!data.image_ids) {
        delete data.image_ids;
      }
      let send_data;
      if (this.scheduleData) {
        send_data = {
          type: 'send_email',
          action: {
            cc,
            bcc,
            video_ids,
            pdf_ids,
            image_ids,
            subject,
            content,
            attachments: this.attachments
          },
          ...this.scheduleData,
          due_date: this.scheduleDateTime
        };
      } else {
        send_data = {
          type: 'send_email',
          action: {
            cc,
            bcc,
            video_ids,
            pdf_ids,
            image_ids,
            subject,
            content,
            attachments: this.attachments
          },
          due_date: this.scheduleDateTime,
          recurrence_mode: this.data.recurrence_mode,
          set_recurrence: this.data.set_recurrence
        };
      }
      if (!send_data.action.video_ids) {
        delete send_data.action.video_ids;
      }
      if (!send_data.action.pdf_ids) {
        delete send_data.pdf_ids;
      }
      if (!send_data.action.image_ids) {
        delete send_data.action.image_ids;
      }
      if (newContacts.length > 0) {
        this.emailSending = true;
        this.contactService.bulkCreate(newContacts).subscribe((res) => {
          if (res) {
            const addedContacts = res['succeed'];
            addedContacts.forEach((e) => data.contacts.push(e._id));
          }
          if (data.contacts.length > 0) {
            if (this.scheduleCheck) {
              this.sendSchedule(send_data, data.contacts);
              return;
            }
            this.fireSendEmail(data);
          } else {
            // nothing to send email
            this.emailSending = false;
            this.toast.warning(
              `${this.emailContacts.length} emails are failed.`,
              'Email Sent'
            );
          }
        });
      } else {
        if (this.scheduleCheck) {
          this.sendSchedule(send_data, data.contacts);
          return;
        }
        this.fireSendEmail(data);
      }
    }
  }

  fireSendEmail(data: any): void {
    if (data) {
      if (this.type === 'deal') {
        this.emailSending = true;
        this.dealService
          .sendEmail({
            deal: this.dealId,
            ...data
          })
          .subscribe((res) => {
            this.emailSending = false;
            if (res['status']) {
              if (res['message'] === 'all_queue') {
                // toastr display, call status setting update
                this.toast.info(
                  'Your email requests are queued. The email queue progressing would be displayed in the header.',
                  'Email Queue'
                );
              } else {
                if (res.data?.queue) {
                  const queueCount = res['data']['queue'];
                  const sentCount = data.contacts.length - queueCount;
                  this.toast.success(
                    `${sentCount} emails are sent successfully. ${queueCount} emails are queued. The email queue progressing would be displayed in the header.`,
                    'Email Sent'
                  );
                }
              }
            } else if (res.statusCode === 405) {
              let failed = res.error && res.error.length;
              failed += res.notExecuted && res.notExecuted.length;
              if (failed < data.contacts.length) {
                const sentCount = res.sent || 0;
                const queueCount = res.queue || 0;
                let message = '';
                if (queueCount) {
                  message = `${failed} emails are failed. ${sentCount} are succeed. Rest email requests are queued. The email queue progressing would be displayed in the header.`;
                } else {
                  message = `${failed} emails are failed. ${sentCount} are succeed.`;
                }
                this.toast.warning(message, 'Email Sent');
              }
            }
            const length =
              (data.video_ids ? data.video_ids.length : 0) +
              (data.pdf_ids ? data.pdf_ids.length : 0) +
              (data.image_ids ? data.image_ids.length : 0) +
              1;
            this.handlerService.addLatestActivities$(length);
            if (data.contacts.length > CHUNK_SIZE) {
              this.handlerService.updateQueueTasks();
            }
            if (res['status']) {
              this.dialogRef.close({ send: this.draftEmail });
            } else {
              this.dialogRef.close();
            }
          });
      } else {
        this.emailSending = true;
        this.materialService
          .sendMaterials({
            ...data
          })
          .subscribe((res) => {
            this.emailSending = false;
            if (res['status']) {
              if (res['message'] === 'all_queue') {
                // toastr display, call status setting update
                this.toast.info(
                  'Your email requests are queued. The email queue progressing would be displayed in the header.',
                  'Email Queue',
                  {
                    // disableTimeOut: true
                  }
                );
              } else {
                if (res['data']['queue']) {
                  const queueCount = res['data']['queue'];
                  const sentCount = data.contacts.length - queueCount;
                  this.toast.success(
                    `${sentCount} emails are sent successfully. ${queueCount} emails are queued. The email queue progressing would be displayed in the header.`,
                    'Email Sent'
                  );
                }
              }
            } else if (res.statusCode === 405) {
              let failed = res.error && res.error.length;
              failed += res.notExecuted && res.notExecuted.length;
              if (failed < data.contacts.length) {
                const sentCount = res.sent || 0;
                const queueCount = res.queue || 0;
                let message = '';
                if (queueCount) {
                  message = `${failed} emails are failed. ${sentCount} are succeed. Rest email requests are queued. The email queue progressing would be displayed in the header.`;
                } else {
                  message = `${failed} emails are failed. ${sentCount} are succeed.`;
                }
                this.toast.warning(message, 'Email Sent');
              }
            }
            const length =
              (data.video_ids ? data.video_ids.length : 0) +
              (data.pdf_ids ? data.pdf_ids.length : 0) +
              (data.image_ids ? data.image_ids.length : 0) +
              1;
            this.handlerService.addLatestActivities$(length);
            if (res['status']) {
              this.dialogRef.close({ send: this.draftEmail });
            }
          });
      }
    }
  }

  /**
   * Open the Material Select Dialog
   */
  sendSchedule(data: any, contacts: any): void {
    const send_data = { contacts: contacts, data };
    const followup_data = {
      contacts,
      type: 'email',
      content: data.action.subject,
      due_date: data.due_date,
      set_recurrence: data.set_recurrence,
      recurrence_mode: data.recurrence_mode
    };
    this.emailSending = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();
    if (this.data.deal) {
      const deal_data = { ...followup_data, deal: this.data.deal };
      send_data['data']['deals'] = [this.data.deal];
      forkJoin({
        followup: from(this.dealService.addFollowUp(deal_data)),
        task: from(this.taskService.scheduleSendCreate(send_data))
      }).subscribe({
        next: (response) => {
          this.emailSending = false;
          const task = response.task;
          if (response.followup && task['status']) {
            if (task['message'] === 'all_queue') {
              this.toast.info(
                'Your email requests are queued. The email queue progressing would be displayed in the header.',
                'Email Queue',
                {}
              );
            } else {
              this.toast.error('Schedules sending is failed.', 'Schedule Sent');
            }
            this.taskService.scheduleData.next({});
            this.dialogRef.close({ status: true });
          }
        }
      });
    } else {
      this.taskService.scheduleSendCreate(send_data).subscribe((response) => {
        this.emailSending = false;
        if (response['status']) {
          if (response['message'] === 'all_queue') {
            this.toast.info(
              'Your email requests are queued. The email queue progressing would be displayed in the header.',
              'Email Queue',
              {}
            );
          } else {
            this.toast.error('Schedules sending is failed.', 'Schedule Sent');
          }
          this.taskService.scheduleData.next({});
          this.handlerService.activityAdd$(contacts, 'task');
          this.handlerService.reload$('tasks');
          this.dialogRef.close({ status: true });
        }
      })
    }
  }

  openMaterialsDlg(): void {
    const content = this.emailContent;
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
    materialDialog['_overlayRef']['_host'].classList.add('top-dialog');
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

  onRecordCompleted($event): void {
    this.materials.push($event);
  }

  onChangeTemplate(template: Template): void {
    this.emailSubject = template.subject;
  }

  getScheduleDateTime(): any {
    if (this.schedule_date.day != '' && this.schedule_time != '') {
      return moment(
        this.schedule_date.year +
          '-' +
          this.schedule_date.month +
          '-' +
          this.schedule_date.day +
          ' ' +
          this.schedule_time
      ).format();
    }
  }

  setScheduleDateTime(): void {
    this.scheduleDateTime = moment(
      this.schedule_date.year +
        '-' +
        this.schedule_date.month +
        '-' +
        this.schedule_date.day +
        ' ' +
        this.schedule_time
    ).format();
    this.planned = true;
  }

  removeSchedule(): void {
    this.planned == false;
    this.scheduleDateTime = '';
  }

  onAttachmentChange(attachments: any[]): void {
    this.attachments = attachments;
  }

  removeContact(contact: Contact): void {
    if (this.mainContact) {
      if (this.mainContact._id === contact._id) {
        this.emailContacts.unshift(this.mainContact);
      }
    }
  }

  checkDuplication(field: string): void {
    let newContact;
    let isChecked = false;
    switch (field) {
      case 'to':
        newContact = this.emailContacts.slice(-1)[0];
        // cc && bcc check
        this.ccContacts.some((e) => {
          if (e.email === newContact.email) {
            this.emailContacts.splice(-1);
            isChecked = true;
            return true;
          }
        });
        if (!isChecked) {
          this.bccContacts.some((e) => {
            if (e.email === newContact.email) {
              this.emailContacts.splice(-1);
              return true;
            }
          });
        }
        break;
      case 'cc':
        newContact = this.ccContacts.slice(-1)[0];
        // cc && bcc check
        this.emailContacts.some((e) => {
          if (e.email === newContact.email) {
            this.ccContacts.splice(-1);
            isChecked = true;
            return true;
          }
        });
        if (!isChecked) {
          this.bccContacts.some((e) => {
            if (e.email === newContact.email) {
              this.ccContacts.splice(-1);
              return true;
            }
          });
        }
        break;
      case 'bcc':
        newContact = this.bccContacts.slice(-1)[0];
        // cc && bcc check
        this.emailContacts.some((e) => {
          if (e.email === newContact.email) {
            this.bccContacts.splice(-1);
            isChecked = true;
            return true;
          }
        });
        if (!isChecked) {
          this.ccContacts.some((e) => {
            if (e.email === newContact.email) {
              this.bccContacts.splice(-1);
              return true;
            }
          });
        }
        break;
    }
  }

  blueAll(): void {
    this.toFocus = false;
  }

  subjectFoucs(): void {
    this.toFocus = false;
    this.subjectFocus = true;
    this.contentFocus = false;
  }

  contentFoucs(): void {
    this.toFocus = false;
    this.subjectFocus = false;
    this.contentFocus = true;
  }

  setFocus(): void {
    this.toFocus = true;
  }

  isFocus(): any {
    return this.toFocus;
  }

  minimizeDialog(): void {
    if (this.dialogType === 'global_email') {
      const windowType = this.storeService.emailWindowType.getValue();
      this.storeService.emailWindowType.next(!windowType);
    } else {
      this.isMinimizable = !this.isMinimizable;
    }
  }

  saveInitValue(): void {
    this.initEmailContent = this.emailContent;
    this.initEmailSubject = this.emailSubject;
    this.initEmailContacts = [...this.emailContacts];
    this.initCcContacts = [...this.ccContacts];
    this.initBccContacts = [...this.bccContacts];
  }

  checkModified(): boolean {
    if (this.initEmailContent !== this.emailContent) {
      if (this.emailContent !== null) {
        return true;
      }
    }
    if (this.initEmailSubject !== this.emailSubject) {
      if (this.emailSubject !== null) {
        return true;
      }
    }
    if (this.initEmailContacts.length !== this.emailContacts.length) {
      return true;
    } else {
      if (
        !_.differenceWith(this.initEmailContacts, this.emailContacts, _.isEqual)
      ) {
        return true;
      }
    }
    if (this.initCcContacts.length !== this.ccContacts.length) {
      return true;
    } else {
      if (!_.differenceWith(this.initCcContacts, this.ccContacts, _.isEqual)) {
        return true;
      }
    }
    if (this.initBccContacts.length !== this.bccContacts.length) {
      return true;
    } else {
      if (
        !_.differenceWith(this.initBccContacts, this.bccContacts, _.isEqual)
      ) {
        return true;
      }
    }
    return false;
  }
  showSchedule() {
    this.showCheck++;
    if (this.showCheck == 1) {
      const materialDialog = this.dialog.open(ScheduleSendComponent, {
        width: '100vw',
        maxWidth: '350px',
        data: {
          type: 'email'
        }
      });
      materialDialog['_overlayRef']['_host'].classList.add('top-dialog');
      materialDialog.afterClosed().subscribe((res) => {
        if (res) {
          this.dialogRef.close();
        }
        this.showCheck = 0;
      });
    }
  }
  closeDialog(): void {
    this.taskService.scheduleData.next({});
    if (this.dialogType === 'contact_email') {
      const data = {
        contact: this.mainContact._id,
        subject: this.emailSubject,
        content: this.emailContent,
        user: this.userId,
        type: 'contact_email'
      };
      this.dialogRef.close({ draft: data });
    } else if (this.dialogType === 'deal_email') {
      const data = {
        user: this.userId,
        type: 'deal_email',
        subject: this.emailSubject,
        content: this.emailContent,
        deal: this.dealId
      };
      this.dialogRef.close({ draft: data });
    } else if (this.dialogType === 'global_email') {
      const data = {
        subject: this.emailSubject,
        content: this.emailContent
      };
      this.dialogRef.close({ draft: data });
    } else {
      this.dialogRef.close();
    }
  }

  selectTemplate(template: Template): void {
    this.htmlEditor.selectTemplate(template);
    this.emailSubject = template.subject;
    if (template.attachments.length) {
      template.attachments.forEach((e) => {
        this.attachments.push(e);
      });
    }
  }

  insertTextContentValue(value: string): void {
    if (this.contentFocus) {
      this.htmlEditor.insertEmailContentValue(value);
    }
    if (this.subjectFocus) {
      const field = this.subjectField.nativeElement;
      field.focus();
      let cursorStart = this.emailSubject.length;
      let cursorEnd = this.emailSubject.length;
      if (field.selectionStart || field.selectionStart === '0') {
        cursorStart = field.selectionStart;
      }
      if (field.selectionEnd || field.selectionEnd === '0') {
        cursorEnd = field.selectionEnd;
      }
      field.setSelectionRange(cursorStart, cursorEnd);
      document.execCommand('insertText', false, value);
      cursorStart += value.length;
      cursorEnd = cursorStart;
      field.setSelectionRange(cursorStart, cursorEnd);
    }
  }

  insertEmojiContentvalue(value: string): void {
    this.htmlEditor.insertEmailContentValue(value);
  }

  createNewTemplate(): void {
    this.templatePortal = new TemplatePortal(
      this.createNewContent,
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
      this.overlayRef.overlayElement.classList.add('top-dialog');
      this.overlayRef.attach(this.templatePortal);
    }
  }

  closeOverlay(flag: boolean): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.detachBackdrop();
    }
    if (flag) {
      // this.toast.success('', 'New template is created successfully.', {
      //   closeButton: true
      // });
      setTimeout(() => {
        this.appRef.tick();
      }, 1);
    }
    this.cdr.detectChanges();
  }

  isEmpty(content: string): boolean {
    const hasEmpty = !(this.stripTags.transform(content || '') || '').trim();
    if (hasEmpty) {
      if (content && content.indexOf('<img') !== -1) {
        return false;
      }
      return true;
    } else {
      return false;
    }
  }
}
