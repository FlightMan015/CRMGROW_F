import {
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { FileSelectDirective } from 'ng2-file-upload';
import { forkJoin, from, interval, Subscription } from 'rxjs';
import { Contact } from 'src/app/models/contact.model';
import { Template } from 'src/app/models/template.model';
import { ContactService } from 'src/app/services/contact.service';
import { HandlerService } from 'src/app/services/handler.service';
import { MaterialService } from 'src/app/services/material.service';
import { SmsService } from 'src/app/services/sms.service';
import { TemplatesService } from 'src/app/services/templates.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';
import { MaterialBrowserComponent } from '../material-browser/material-browser.component';
import { StoreService } from '../../services/store.service';
import { Draft } from '../../models/draft.model';
import { TemplatePortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { DealsService } from '../../services/deals.service';
import { ToastrService } from 'ngx-toastr';
import { ConnectService } from 'src/app/services/connect.service';
import { Garbage } from 'src/app/models/garbage.model';
import { HOURS, RECORDING_POPUP } from 'src/app/constants/variable.constants';
import * as moment from 'moment';
import { TaskService } from 'src/app/services/task.service';
import { ScheduleSendComponent } from 'src/app/components/schedule-send/schedule-send.component';
import { ScheduleService } from 'src/app/services/schedule.service';
@Component({
  selector: 'app-send-text',
  templateUrl: './send-text.component.html',
  styleUrls: ['./send-text.component.scss']
})
export class SendTextComponent implements OnInit, OnDestroy {
  type = '';
  garbage: Garbage = new Garbage();
  contact: Contact;
  textContacts: any[] = [];
  message: string = '';
  conversation: any;
  userId: string = '';
  messages: any[] = [];
  set = 'twitter';
  toFocus = false;
  popup;
  recordUrl = RECORDING_POPUP;
  authToken = '';
  loading = false;
  isCalendly = false;
  loadSubscription: Subscription;
  sending = false;
  sendSubscription: Subscription;
  updateTimer: Subscription;
  conversationLoadSubscription: Subscription;
  garbageSubscription: Subscription;
  showCheck = 0;
  dialogType = '';
  isMinimizable = true;
  draftText = new Draft();

  dealId = '';
  schedule_date = {
    year: '',
    month: '',
    day: ''
  };
  scheduleData: any;
  scheduleDateTime: any;
  scheduleCheck = false;

  templatePortal: TemplatePortal;
  overlayRef: OverlayRef;
  @ViewChild('messageText') messageText: ElementRef;
  @ViewChild('createNewContent') createNewContent: TemplateRef<unknown>;

  // Business Hour Setting
  isEnableSend = false;
  startTime;
  endTime;

  constructor(
    private dialogRef: MatDialogRef<SendTextComponent>,
    private dialog: MatDialog,
    public templateService: TemplatesService,
    private materialService: MaterialService,
    private contactService: ContactService,
    public userService: UserService,
    public smsService: SmsService,
    private dealService: DealsService,
    public connectService: ConnectService,
    private handlerService: HandlerService,
    private toast: ToastrService,
    public storeService: StoreService,
    private _viewContainerRef: ViewContainerRef,
    private appRef: ApplicationRef,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
    private overlay: Overlay,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public scheduleService: ScheduleService
  ) {
    if (this.data && this.data.type) {
      this.type = this.data.type;
      if (this.type == 'single') {
        this.contact = new Contact().deserialize(this.data.contact);
        this.conversationLoadSubscription = this.contactService.contactConversation$.subscribe(
          (conversation) => {
            if (conversation && conversation.contact === this.contact._id) {
              this.messages = conversation.messages;
              if (this.messages.length) {
                this.loading = false;
              }
            }
            if (!this.messages || !this.messages.length) {
              this.load();
            }
          }
        );
      } else {
        this.messages = [];
      }
      if (this.data.due_date) {
        this.textContacts = [...this.data.contacts];
        this.message = this.data.subject;
        this.scheduleCheck = true;
      }
    }
    if (this.data && this.data.deal) {
      this.dealId = this.data.deal;
      this.textContacts = [...this.data.contacts];
      this.message = this.data.subject;
      this.scheduleCheck = true;
    }
    if (this.data && this.data.draft_type) {
      this.dialogType = this.data.draft_type;
    }
    if (this.data && this.data.draft) {
      this.draftText = this.data.draft;
    }
    this.userId = this.userService.profile.getValue()._id;
    this.templateService.loadAll(false);
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
    this.connectService.loadCalendlyAll(false);
    this.connectService.loadCalendlyAll(false);
    this.authToken = this.userService.getToken();

    this.scheduleService.getEventTypes(false);
  }

  ngOnInit(): void {
    if (this.data && this.data.due_date) {
      this.scheduleData = this.data;
      this.scheduleDateTime = this.data.due_date;
    }
    const defaultSms = this.userService.sms.getValue();
    if (this.draftText && this.draftText.content) {
      this.message = this.draftText.content;
    } else {
      if (defaultSms) {
        setTimeout(() => {
          this.selectTemplate(defaultSms);
        }, 300);
      }
    }
    this.updateTimer = interval(3 * 1000).subscribe(() => {
      this.update();
    });
  }

  ngOnDestroy(): void {
    if (this.dialogType === 'contact_text') {
      const data = {
        contact: this.contact._id,
        content: this.message,
        user: this.userId,
        type: 'contact_text'
      };
      if (this.data.draft) {
        data['_id'] = this.data.draft._id;
      }
      this.storeService.textContactDraft.next(data);
    } else if (this.dialogType === 'deal_text') {
      const data = {
        user: this.userId,
        type: 'deal_text',
        content: this.message,
        deal: this.dealId
      };
      if (this.data.draft) {
        data['_id'] = this.data.draft._id;
      }
      this.storeService.textDealDraft.next(data);
    } else if (this.dialogType === 'global_text') {
      const data = {
        content: this.message
      };
      this.storeService.textGlobalDraft.next(data);
    }

    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.updateTimer && this.updateTimer.unsubscribe();
    this.conversationLoadSubscription &&
      this.conversationLoadSubscription.unsubscribe();
    if (this.type == 'single') {
      this.contactService.contactConversation.next({
        contact: this.contact._id,
        messages: this.messages || []
      });
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
  load(): void {
    this.loading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.smsService
      .getMessage(this.contact)
      .subscribe((messages) => {
        this.loading = false;
        this.messages = messages;
        this.markAsRead(messages);
      });
  }

  markAsRead(messages): void {
    if (
      messages[messages.length - 1] &&
      messages[messages.length - 1].type == 1 &&
      messages[messages.length - 1].status == 0
    ) {
      this.smsService
        .markRead(messages[messages.length - 1]._id, this.contact._id)
        .subscribe((res) => {
          if (res && res['status']) {
            this.contact.unread = false;
            this.handlerService.readMessageContact.next({
              _id: this.contact._id
            });
          }
        });
    } else {
      let hasUnread = false;
      let unreadMessageId;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].type === 1 && messages[i].status === 0) {
          hasUnread = true;
          unreadMessageId = messages[i]._id;
          break;
        }
      }
      if (hasUnread) {
        this.smsService
          .markRead(unreadMessageId, this.contact._id)
          .subscribe((res) => {
            if (res && res['status']) {
              this.contact.unread = false;
              this.handlerService.readMessageContact.next({
                _id: this.contact._id
              });
            }
          });
      }
    }
  }

  update(): void {
    if (this.type == 'single') {
      this.loadSubscription && this.loadSubscription.unsubscribe();
      this.loadSubscription = this.smsService
        .getMessage(this.contact)
        .subscribe((messages) => {
          this.messages = messages;
        });
    } else {
      this.messages = [];
    }
  }

  setFocus(): void {
    this.toFocus = true;
  }

  isFocus(): any {
    return this.toFocus;
  }

  openMaterialsDlg(): void {
    const { videoIds, imageIds, pdfIds } = this.getMaterials();
    const selectedMaterials = [...videoIds, ...imageIds, ...pdfIds].map((e) => {
      return { _id: e };
    });
    const materialDialog = this.dialog.open(MaterialBrowserComponent, {
      width: '98vw',
      maxWidth: '940px',
      data: {
        multiple: true,
        hideMaterials: selectedMaterials
      }
    });
    materialDialog['_overlayRef']['_host'].classList.add('top-dialog');
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
            (!this.message || this.message.slice(-1) === '\n')
          ) {
            this.message = this.message + '\n' + url;
            return;
          }
          if (index === 0) {
            this.message = this.message + '\n\n' + url;
            return;
          }
          // middle element insert
          this.message = this.message + '\n' + url;

          if (index === res.materials.length - 1) {
            this.message += '\n';
          }
        });
      }
    });
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

    let matches = this.message.match(videoReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const videoId = e.replace(environment.website + '/video?video=', '');
        videoIds.push(videoId);
      });
    }
    matches = this.message.match(pdfReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const pdfId = e.replace(environment.website + '/pdf?pdf=', '');
        pdfIds.push(pdfId);
      });
    }
    matches = this.message.match(imageReg);
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

  send(): void {
    if (this.sending) {
      return;
    }
    if (this.message === '' || this.message.replace(/\s/g, '').length == 0) {
      return;
    }
    const { videoIds, imageIds, pdfIds } = this.getMaterials();

    let contentToSend = this.message;
    videoIds.forEach((video) => {
      contentToSend = contentToSend.replace(
        environment.website + '/video?video=' + video,
        '{{' + video + '}}'
      );
    });
    pdfIds.forEach((pdf) => {
      contentToSend = contentToSend.replace(
        environment.website + '/pdf?pdf=' + pdf,
        '{{' + pdf + '}}'
      );
    });
    imageIds.forEach((image) => {
      contentToSend = contentToSend.replace(
        environment.website + '/image?image=' + image,
        '{{' + image + '}}'
      );
    });

    this.sending = true;
    const contacts = [];
    const newContacts = [];
    if (this.type == 'single') {
      contacts.push(this.contact._id);
    } else {
      this.textContacts.forEach((e) => {
        if (e._id) contacts.push(e._id);
        else newContacts.push(e);
      });
    }
    let send_data;
    if (this.scheduleData) {
      send_data = {
        type: 'send_text',
        action: {
          video_ids: videoIds,
          pdf_ids: pdfIds,
          image_ids: imageIds,
          content: contentToSend
        },
        ...this.scheduleData,
        due_date: this.scheduleDateTime
      };
    } else {
      send_data = {
        type: 'send_text',
        action: {
          video_ids: videoIds,
          pdf_ids: pdfIds,
          image_ids: imageIds,
          content: contentToSend
        },
        due_date: this.scheduleDateTime,
        recurrence_mode: this.data.recurrence_mode,
        set_recurrence: this.data.set_recurrence
      };
    }

    if (newContacts.length > 0) {
      this.sending = true;
      this.contactService.bulkCreate(newContacts).subscribe((res) => {
        if (res) {
          const addedContacts = res['succeed'];
          addedContacts.forEach((e) => contacts.push(e._id));
        }
        if (contacts.length > 0) {
          if (this.scheduleCheck) {
            this.sendSchedule(send_data, contacts);
            return;
          }
          this.fireSendMessage(
            contentToSend,
            contacts,
            videoIds,
            imageIds,
            pdfIds
          );
        } else {
          // nothing to send email
          this.sending = false;
          this.toast.warning(
            `${this.textContacts.length} texts are failed.`,
            'Text Sent'
          );
        }
      });
    } else {
      if (this.scheduleCheck) {
        this.sendSchedule(send_data, contacts);
        return;
      }
      this.fireSendMessage(contentToSend, contacts, videoIds, imageIds, pdfIds);
    }
  }

  fireSendMessage(
    contentToSend: string,
    contacts: Contact[],
    videoIds: string[],
    imageIds: string[],
    pdfIds: string[]
  ): void {
    this.sendSubscription && this.sendSubscription.unsubscribe();
    this.sendSubscription = this.materialService
      .sendMessage({
        video_ids: videoIds,
        pdf_ids: pdfIds,
        image_ids: imageIds,
        content: contentToSend,
        contacts: contacts
      })
      .subscribe((res) => {
        this.sending = false;
        this.message = '';
        this.update();
        const count = videoIds.length + pdfIds.length + imageIds.length + 1;
        this.contactService.addLatestActivity(count + 2);
        this.dialogRef.close({ send: this.draftText });
        // this.dialogRef.close({
        //   status: true,
        //   count: videoIds.length + pdfIds.length + imageIds.length + 1
        // });
      });
  }
  sendSchedule(data: any, contacts: any): void {
    const send_data = { contacts: contacts, data };
    const followup_data = {
      contacts,
      type: 'text',
      content: data.action.content,
      due_date: this.scheduleDateTime,
      set_recurrence: data.set_recurrence,
      recurrence_mode: data.recurrence_mode
    };
    this.loading = true;
    if (this.data.deal) {
      const deal_data = { ...followup_data, deal: this.data.deal };
      send_data['data']['deals'] = [this.data.deal];
      forkJoin({
        followup: from(this.dealService.addFollowUp(deal_data)),
        task: from(this.taskService.scheduleSendCreate(send_data))
      }).subscribe({
        next: (response) => {
          this.loading = false;
          const task = response.task;
          if (response.followup && task['status']) {
            if (task['message'] === 'all_queue') {
              this.toast.info(
                'Your text requests are queued. The text queue progressing would be displayed in the header.',
                'Text Queue',
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
      forkJoin({
        followup: from(this.taskService.bulkCreate(followup_data)),
        task: from(this.taskService.scheduleSendCreate(send_data))
      }).subscribe({
        next: (response) => {
          this.loading = false;
          const task = response.task;
          if (response.followup && task['status']) {
            if (task['message'] === 'all_queue') {
              this.toast.info(
                'Your text requests are queued. The text queue progressing would be displayed in the header.',
                'Text Queue',
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
          this.dialogRef.close({ status: true });
        }
      });
    }
  }
  selectTemplate(template: Template): void {
    this.messageText.nativeElement.focus();
    const field = this.messageText.nativeElement;
    if (template.video_ids.length) {
      template.video_ids.forEach((video) => {
        template.content = template.content.replace(
          '{{' + video + '}}',
          environment.website + '/video?video=' + video
        );
      });
    }
    if (template.pdf_ids.length) {
      template.pdf_ids.forEach((pdf) => {
        template.content = template.content.replace(
          '{{' + pdf + '}}',
          environment.website + '/pdf?pdf=' + pdf
        );
      });
    }
    if (template.image_ids.length) {
      template.image_ids.forEach((image) => {
        template.content = template.content.replace(
          '{{' + image + '}}',
          environment.website + '/image?image=' + image
        );
      });
    }
    if (!this.message.replace(/(\r\n|\n|\r|\s)/gm, '')) {
      field.select();
      document.execCommand('insertText', false, template.content);
      return;
    }
    if (field.selectionEnd || field.selectionEnd === 0) {
      if (this.message[field.selectionEnd - 1] === '\n') {
        document.execCommand('insertText', false, template.content);
      } else {
        document.execCommand('insertText', false, '\n' + template.content);
      }
    } else {
      if (this.message.slice(-1) === '\n') {
        document.execCommand('insertText', false, template.content);
      } else {
        document.execCommand('insertText', false, '\n' + template.content);
      }
    }
  }

  selectCalendly(url: string): void {
    this.messageText.nativeElement.focus();
    const field = this.messageText.nativeElement;
    if (!this.message.replace(/(\r\n|\n|\r|\s)/gm, '')) {
      field.select();
      document.execCommand('insertText', false, url);
      return;
    }
    if (field.selectionEnd || field.selectionEnd === 0) {
      if (this.message[field.selectionEnd - 1] === '\n') {
        document.execCommand('insertText', false, url);
      } else {
        document.execCommand('insertText', false, '\n' + url);
      }
    } else {
      if (this.message.slice(-1) === '\n') {
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
            this.messageText.nativeElement.focus();
            const field = this.messageText.nativeElement;
            if (!this.message.replace(/(\r\n|\n|\r|\s)/gm, '')) {
              field.select();
              document.execCommand('insertText', false, url);
              return;
            }
            if (field.selectionEnd || field.selectionEnd === 0) {
              if (this.message[field.selectionEnd - 1] === '\n') {
                document.execCommand('insertText', false, url);
              } else {
                document.execCommand('insertText', false, '\n' + url);
              }
            } else {
              if (this.message.slice(-1) === '\n') {
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

  insertTextContentValue(value: string): void {
    const field = this.messageText.nativeElement;
    field.focus();
    let cursorStart = this.message.length;
    let cursorEnd = this.message.length;
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

  keyTrigger(event): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (event.ctrlKey || event.altKey || event.shiftKey) {
        if (event.shiftKey && !event.ctrlKey && !event.altKey) {
          this.send();
        }
        return;
      } else {
        document.execCommand('insertText', false, '\n');
      }
    }
  }

  calcDate(date: any): number {
    const currentDate = new Date();
    const dateSent = new Date(date);
    return Math.floor(
      (Date.UTC(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      ) -
        Date.UTC(
          dateSent.getFullYear(),
          dateSent.getMonth(),
          dateSent.getDate()
        )) /
        (1000 * 60 * 60 * 24)
    );
  }

  parseContent(content: string): any {
    return content.replace(/(https?:\/\/[^\s]+)/g, function (url) {
      return '<a href="' + url + '" target="_blank">' + url + '</a>';
    });
  }

  minimizeDialog(): void {
    if (this.dialogType === 'global_text') {
      const windowType = this.storeService.textWindowType.getValue();
      this.storeService.textWindowType.next(!windowType);
    } else {
      this.isMinimizable = !this.isMinimizable;
    }
  }
  showSchedule() {
    this.showCheck++;
    if (this.showCheck == 1) {
      const materialDialog = this.dialog.open(ScheduleSendComponent, {
        width: '100vw',
        maxWidth: '350px',
        data: {
          type: 'text'
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
    if (this.dialogType === 'contact_text') {
      const data = {
        contact: this.contact._id,
        content: this.message,
        user: this.userId,
        type: 'contact_text'
      };
      this.dialogRef.close({ draft: data });
    } else if (this.dialogType === 'deal_text') {
      const data = {
        user: this.userId,
        type: 'deal_text',
        content: this.message,
        deal: this.dealId
      };
      this.dialogRef.close({ draft: data });
    } else if (this.dialogType === 'global_text') {
      const data = {
        content: this.message
      };
      this.dialogRef.close({ draft: data });
    } else {
      this.dialogRef.close();
    }
  }
}
