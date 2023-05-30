import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { forkJoin, from } from 'rxjs';
import { Contact } from 'src/app/models/contact.model';
import { Template } from 'src/app/models/template.model';
import { DealsService } from 'src/app/services/deals.service';
import { HandlerService } from 'src/app/services/handler.service';
import { TemplatesService } from 'src/app/services/templates.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';
import { MaterialBrowserComponent } from '../material-browser/material-browser.component';
import { ScheduleSendComponent } from 'src/app/components/schedule-send/schedule-send.component';
import { StoreService } from '../../services/store.service';
import { Draft } from '../../models/draft.model';
import { ConnectService } from 'src/app/services/connect.service';
import { TaskService } from 'src/app/services/task.service';

@Component({
  selector: 'app-send-bulk-text',
  templateUrl: './send-bulk-text.component.html',
  styleUrls: ['./send-bulk-text.component.scss']
})
export class SendBulkTextComponent implements OnInit, OnDestroy {
  dealId: string = '';
  contacts: Contact[] = [];
  message: string = '';
  userId: string = '';
  set = 'twitter';

  sending = false;
  sendSubscription: Subscription;
  scheduleData: any;
  scheduleDateTime: any;
  scheduleCheck = false;
  showCheck = 0;
  dialogType = '';
  isMinimizable = true;
  draftText = new Draft();
  toFocus = false;

  @ViewChild('messageText') messageText: ElementRef;

  constructor(
    private dialogRef: MatDialogRef<SendBulkTextComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private toast: ToastrService,
    public templateService: TemplatesService,
    private dealService: DealsService,
    public connectService: ConnectService,
    public userService: UserService,
    public storeService: StoreService,
    private handlerService: HandlerService,
    private taskService: TaskService
  ) {
    if (this.data && this.data.draft_type) {
      this.dialogType = this.data.draft_type;
    }
    if (this.data && this.data.draft) {
      this.draftText = this.data.draft;
    }
    this.userId = this.userService.profile.getValue()._id;
    this.connectService.loadCalendlyAll(false);
  }

  ngOnInit(): void {
    if (this.data) {
      if (this.data.contacts.length) {
        this.data.contacts.forEach((e) => {
          const contact = new Contact().deserialize(e);
          this.contacts.push(contact);
        });
      }
      if (this.data.deal) {
        this.dealId = this.data.deal;
      }
    }
    if (this.data && this.data.due_date) {
      this.scheduleDateTime = this.data.due_date;
    }
    if (this.draftText && this.draftText.content) {
      this.message = this.draftText.content;
    }
    this.templateService.loadAll(false);
  }

  ngOnDestroy(): void {
    if (this.dialogType === 'deal_text') {
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
    }
  }
  ngAfterViewInit(): void {
    this.taskService.scheduleData$.subscribe((data) => {
      if (data.due_date) {
        this.scheduleData = data;
        this.scheduleCheck = true;
        this.scheduleDateTime = data.due_date;
      }
    });
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

  setFocus(): void {
    this.toFocus = true;
  }

  isFocus(): any {
    return this.toFocus;
  }

  blueAll(): void {
    this.toFocus = false;
  }

  send(): void {
    if (this.contacts.length > 10) {
      this.toast.error(
        "More than 10 contacts are selected. Please select less than 10 contacts.",
        'Exceed The Number of Contacts'
      );
      return;
    }
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

    const contacts = [];
    this.contacts.forEach((e) => {
      contacts.push(e._id);
    });
    this.sending = true;

    const send_data = {
      type: 'send_text',
      deals: [this.dealId],
      action: {
        video_ids: videoIds,
        pdf_ids: pdfIds,
        image_ids: imageIds,
        content: contentToSend
      },
      ...this.scheduleData,
      due_date: this.scheduleDateTime
    };
    if (this.scheduleCheck) {
      this.sendSchedule(send_data, contacts);
      return;
    }
    this.sendSubscription && this.sendSubscription.unsubscribe();
    this.sendSubscription = this.dealService
      .sendText({
        video_ids: videoIds,
        pdf_ids: pdfIds,
        image_ids: imageIds,
        content: contentToSend,
        contacts: contacts,
        deal: this.dealId
      })
      .subscribe((res) => {
        this.sending = false;
        if (res['status']) {
          if (contacts.length > 1) {
            this.toast.success(
              'Your texts would be delivered. You can see all delivering status in header within 5 mins',
              'Text Sent',
              {
                //disableTimeOut: true
              }
            );
          } else {
            // this.toast.success(
            //   'Your text is delivered successfully.',
            //   'Text Sent',
            //   {
            //     //disableTimeOut: true
            //   }
            // );
          }
        }
        if (contacts.length > 1) {
          this.handlerService.updateQueueTasks();
        }
        this.dialogRef.close({
          status: true,
          count: videoIds.length + pdfIds.length + imageIds.length + 1,
          send: this.draftText
        });
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
      recurrence_mode: data.recurrence_mode,
      deal: this.dealId
    };
      forkJoin({
        followup: from(this.dealService.addFollowUp(followup_data)),
        task: from(this.taskService.scheduleSendCreate(send_data))
      }).subscribe({
        next: (response) => {
          this.sending = false;
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

  keyTrigger(event): void {
    if (event.key === 'Enter') {
      if (event.ctrlKey || event.altKey) {
        return;
      }
      if (!event.shiftKey) {
        event.preventDefault();
        this.send();
      }
    }
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

  minimizeDialog(): void {
    if (this.dialogType === 'global_text') {
      const windowType = this.storeService.textWindowType.getValue();
      this.storeService.textWindowType.next(!windowType);
    } else {
      this.isMinimizable = !this.isMinimizable;
    }
  }
  showSchedule()
  { this.showCheck++;
    if (this.showCheck == 1) {
      const materialDialog = this.dialog.open(ScheduleSendComponent, {
        width: '100vw',
        maxWidth: '350px',
          data: {}
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
    if (this.dialogType === 'deal_text') {
      const data = {
        user: this.userId,
        type: 'deal_text',
        content: this.message,
        deal: this.dealId
      };
      this.dialogRef.close({ draft: data });
    } else {
      this.dialogRef.close();
    }
  }
}
