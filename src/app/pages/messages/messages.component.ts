import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { forkJoin, from, interval } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment';
import { TemplatesService } from 'src/app/services/templates.service';
import { UserService } from 'src/app/services/user.service';
import { SmsService } from 'src/app/services/sms.service';
import { MaterialService } from 'src/app/services/material.service';
import { Template } from 'src/app/models/template.model';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';
import { Contact } from 'src/app/models/contact.model';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
import { HOURS, STATUS } from 'src/app/constants/variable.constants';
import { MaterialBrowserComponent } from 'src/app/components/material-browser/material-browser.component';
import { ScheduleSendComponent } from 'src/app/components/schedule-send/schedule-send.component';
import { ContactService } from 'src/app/services/contact.service';
import { HandlerService } from 'src/app/services/handler.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ConnectService } from 'src/app/services/connect.service';
import { TaskService } from '../../services/task.service';
import { Garbage } from 'src/app/models/garbage.model';
import { SocketService } from 'src/app/services/socket.service';
import { Message } from 'src/app/models/message.model';
import { ScheduleService } from 'src/app/services/schedule.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit, OnDestroy {
  inited: boolean = false;
  garbage: Garbage = new Garbage();
  isCalendly = false;
  isScheduler = false;
  STATUS = STATUS;
  PanelView = {
    Contacts: 'contacts',
    Messages: 'messages',
    Files: 'files'
  };
  panel = this.PanelView.Contacts; // Panel View for Mobile
  message = ''; // Message
  // Loading Contacts
  contacts = [];
  selectedContact: Contact = new Contact();
  defaultContactId = '';
  loading: boolean = false;
  loadingMore: boolean = false;
  refreshing: boolean = false;

  // Loading Individual Contact messages
  loadingMessage = false;
  messages = [];
  conversationDetails = {};
  loadingFiles = false;
  fileDetails = {};
  // contacts and sending status
  isNew = false;
  isSend = false;
  newContacts = [];
  //schedule time
  scheduleData: any;
  scheduleDateTime: any;
  scheduleCheck = false;
  spaceReg = /(\r\n|\n|\r|\s)/g; // Space Reg (If message contains the tab or space only, it will disabled)
  set = 'twitter'; // Emoji type
  searchStr: string = ''; // contact search keyword
  skipNum = 0;
  count = 50;
  hasMore: boolean = true;

  messageLoadSubscription: Subscription;
  garbageSubscription: Subscription;
  notificationCommandSubscription: Subscription;

  // UI Elements
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  @ViewChild('messageText') messageText: ElementRef;

  // Business Hour Setting
  isEnableSend = false;
  businessHourChecker: Subscription;
  startTime;
  endTime;

  constructor(
    private dialog: MatDialog,
    private taskService: TaskService,
    public templateService: TemplatesService,
    private materialService: MaterialService,
    public smsService: SmsService,
    public userService: UserService,
    private toast: ToastrService,
    private contactService: ContactService,
    private handlerService: HandlerService,
    public connectService: ConnectService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private socketService: SocketService,
    public scheduleService: ScheduleService
  ) {
    this.templateService.loadAll(false);
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = res;
      if (this.garbage?.calendly) {
        this.isCalendly = true;
        this.connectService.loadCalendlyAll(false);
      } else {
        this.isCalendly = false;
      }

      // Business Hour Setting
      const businessHour = this.garbage.text_time;
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
      this.businessHourChecker = interval(1000).subscribe(() => {
        this.checkBusinessHour();
      });
    });

    this.notificationCommandSubscription &&
      this.notificationCommandSubscription.unsubscribe();
    this.notificationCommandSubscription = this.socketService.command$.subscribe(
      (res) => {
        if (res) {
          this.executeRealtimeCommand(res);
        }
      }
    );
    this.scheduleService.getEventTypes(false);
  }

  ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.preload();
    this.load();

    this.route.params.subscribe((params) => {
      if (params && params.contact) {
        const contactDoc = this.contacts.find((e) => e._id === params.contact);
        if (contactDoc) {
          this.selectContact(contactDoc);
        } else {
          //  Load Contact detail data
          this.contactService.readImpl(params.contact).subscribe((_contact) => {
            this.selectContact(_contact);
          });
        }
        this.location.replaceState('/messages');
      }
    });
  }

  ngAfterViewInit(): void {
    this.taskService.scheduleData$.subscribe((data) => {
      if (data.due_date) {
        this.scheduleData = data;
        this.scheduleCheck = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.notificationCommandSubscription &&
      this.notificationCommandSubscription.unsubscribe();
    this.smsService.conversations.next(this.contacts.slice(0, this.count));
    this.businessHourChecker && this.businessHourChecker.unsubscribe();
  }

  checkBusinessHour(): void {
    // Business Hour Setting
    const businessHour = this.garbage.text_time;
    if (!businessHour.is_enabled) {
      this.isEnableSend = true;
    } else {
      const businessTZ = moment.tz.guess(); //businessHour.timezone
      const businessDays = [0, 1, 2, 3, 4, 5, 6]; //businessHour.enabled_days || []
      const businessStartTime = businessHour.start_time;
      const businessEndTime = businessHour.end_time;
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
  }

  executeRealtimeCommand(_c): void {
    if (_c.command === 'receive_text') {
      this.loadLatest();
    }
  }

  preload(): void {
    const conversations = this.smsService.conversations.getValue();
    this.contacts = [...conversations];
  }

  load(): void {
    const payload = {
      count: this.count,
      skip: 0,
      searchStr: this.searchStr
    };
    this.hasMore = true;
    this.loading = true;
    this.messageLoadSubscription && this.messageLoadSubscription.unsubscribe();
    this.messageLoadSubscription = this.smsService
      .loadImplCount(payload)
      .subscribe((messages) => {
        this.loading = false;
        if (messages.length < this.count) {
          this.hasMore = false;
        }
        this.initConversations(messages); // init loaded messages
      });
  }

  loadMore(): void {
    const payload = {
      count: this.count,
      skip: this.contacts.length,
      searchStr: this.searchStr
    };
    this.loadingMore = true;
    this.smsService.loadImplCount(payload).subscribe((messages) => {
      this.loadingMore = false;
      if (!messages.length) {
        this.hasMore = false;
      } else {
        this.hasMore = true;
      }
      this.mergeConversations(messages); // merge loaded messages
    });
  }

  loadLatest(count: number = 5, selectLatest: boolean = false): void {
    const payload = {
      count: count,
      skip: 0,
      searchStr: this.searchStr
    };
    this.smsService.loadImplCount(payload).subscribe((messages) => {
      this.mergeConversations(messages, selectLatest); // Merge loaded messages
    });
  }

  changeSearchStr(): void {
    this.load();
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.load();
  }

  initConversations(messages: Message[]): void {
    this.contacts = messages.map((message) => {
      const messageInfo = {
        unread: false,
        lastest_message: message.content,
        lastest_at: message.created_at
      };
      if (message.type === 1 && message.status === 0) {
        messageInfo['unread'] = true;
      }
      return new Contact().deserialize({ ...message.contacts, ...messageInfo });
    });
  }

  mergeConversations(messages: Message[], selectLatest: boolean = false): void {
    const latestContacts = messages.map((message) => {
      const messageInfo = {
        unread: false,
        lastest_message: message.content,
        lastest_at: message.created_at
      };
      if (message.type === 1 && message.status === 0) {
        messageInfo['unread'] = true;
      }
      return new Contact().deserialize({ ...message.contacts, ...messageInfo });
    });
    const contacts = [...latestContacts, ...this.contacts];
    this.contacts = _.uniqBy(contacts, (e) => e._id);
    this.contacts = this.contacts.sort(
      (a, b) =>
        (new Date(a.lastest_at + '').getTime() -
          new Date(b.lastest_at + '').getTime()) *
        -1
    );
    if (selectLatest) {
      const latestContact = this.contacts[this.contacts.length - 1];
      if (latestContact?._id !== this.selectedContact?._id) {
        this.selectContact(latestContact);
      }
    }
  }

  /**
   * When select the contact in the left sidebar,
   * the conversation detail panel update.
   * @param contact : Contact Data
   */
  selectContact(contact: any): void {
    this.selectedContact = contact;
    this.isNew = false;
    this.newContacts = [];
    this.panel = this.PanelView.Messages;
    this.loadingMessage = true;
    this.smsService.getMessage(this.selectedContact).subscribe((res) => {
      if (res) {
        const contactId = this.selectedContact._id;
        res.forEach((e) => {
          if (e.send_status && e.send_status[contactId]?.status) {
            e.status = e.send_status[contactId]?.status;
            delete e.send_status;
          }
        });
        this.markAsRead(res);
        this.loadingMessage = false;
        const message = {
          id: contact._id,
          messages: res
        };
        this.conversationDetails[contact._id] = message;
      }
    });
  }

  /**
   * When choose the contacts in the conversation contact list header,
   * the conversation panel would be reset
   * If the selected contacts count is more than 2, would not run this.
   * @param event
   */
  selectNewContacts(): void {
    if (this.newContacts.length === 1) {
      const firstNewContact = this.newContacts[0];
      const conversationIndex = _.findIndex(
        this.contacts,
        (e) => e._id === firstNewContact._id
      );
      // Conversation Detail Panel loading with selected contact
      if (conversationIndex !== -1) {
        this.smsService.getMessage(firstNewContact).subscribe((res) => {
          if (res) {
            const contactId = firstNewContact._id;
            res.forEach((e) => {
              if (e.send_status && e.send_status[contactId]?.status) {
                e.status = e.send_status[contactId]?.status;
                delete e.send_status;
              }
            });
            if (
              res[res.length - 1].type == 1 &&
              res[res.length - 1].status == 0
            ) {
              this.smsService
                .markRead(res[res.length - 1]._id, this.selectedContact._id)
                .subscribe((res) => {
                  if (res && res['status']) {
                    this.selectedContact.unread = false;
                  }
                });
            }
            this.loadingMessage = false;
            const message = {
              id: firstNewContact._id,
              messages: res
            };
            this.conversationDetails[firstNewContact._id] = message;
          }
        });
      }
    }
  }

  /**
   * Go back in the mobile
   */
  goToBack(): void {
    this.isNew = false;
    this.newContacts = [];
    this.panel = this.PanelView.Contacts;
  }

  /**
   * File List Open (mobile view flag setting & load files)
   */
  toggleFileList(): void {
    if (this.panel != this.PanelView.Files) {
      this.panel = this.PanelView.Files;
      // Load Files
      this.loadFiles();
    } else {
      this.panel = this.PanelView.Contacts;
    }
  }

  /**
   * Load the sent materials activity load and trackers
   */
  loadFiles(): void {
    this.loadingFiles = true;
    const sentActivities = this.getActivities() || [];
    this.smsService
      .loadFiles(this.selectedContact._id, sentActivities)
      .subscribe((res) => {
        this.loadingFiles = false;
        let materials = [];
        const trackers = {};
        const sendAtIndex = res['sendAtIndex'];
        const latestSentAt = {};
        const firstSentAt = {};
        const sentTimes = {};
        for (const materialId in sendAtIndex) {
          const latest = _.max(sendAtIndex[materialId], (e) =>
            new Date(e).getTime()
          );
          const first = _.min(sendAtIndex[materialId], (e) =>
            new Date(e).getTime()
          );
          latestSentAt[materialId] = latest;
          firstSentAt[materialId] = first;
          sentTimes[materialId] = sendAtIndex[materialId].length;
        }
        if (res.videos && res.videos.length) {
          materials = [...materials, ...res.videos];
        }
        if (res.pdfs && res.pdfs.length) {
          materials = [...materials, ...res.pdfs];
        }
        if (res.images && res.images.length) {
          materials = [...materials, ...res.images];
        }
        if (res.videoTrackers && res.videoTrackers.length) {
          res.videoTrackers.forEach((e) => {
            let materialId = '';
            if (e.video instanceof Array) {
              materialId = e.video[0];
            } else {
              materialId = e.video;
            }
            if (trackers[materialId]) {
              trackers[materialId].push(e);
            } else {
              trackers[materialId] = [e];
            }
            sendAtIndex[materialId] &&
              sendAtIndex[materialId].push(e.updated_at);
          });
        }
        if (res.pdfTrackers && res.pdfTrackers.length) {
          res.pdfTrackers.forEach((e) => {
            let materialId = '';
            if (e.pdf instanceof Array) {
              materialId = e.pdf[0];
            } else {
              materialId = e.pdf;
            }
            if (trackers[materialId]) {
              trackers[materialId].push(e);
            } else {
              trackers[materialId] = [e];
            }
            sendAtIndex[materialId].push(e.updated_at);
            sendAtIndex[materialId] &&
              sendAtIndex[materialId].push(e.updated_at);
          });
        }
        if (res.imageTrackers && res.imageTrackers.length) {
          res.imageTrackers.forEach((e) => {
            let materialId = '';
            if (e.image instanceof Array) {
              materialId = e.image[0];
            } else {
              materialId = e.image;
            }
            if (trackers[materialId]) {
              trackers[materialId].push(e);
            } else {
              trackers[materialId] = [e];
            }
            sendAtIndex[materialId].push(e.updated_at);
            sendAtIndex[materialId] &&
              sendAtIndex[materialId].push(e.updated_at);
          });
        }
        const sentIndex = [];
        for (const materialId in sendAtIndex) {
          const latest = _.max(sendAtIndex[materialId], (e) =>
            new Date(e).getTime()
          );
          sentIndex.push({
            material: materialId,
            sent_at: sendAtIndex[materialId],
            last_sent: latestSentAt[materialId],
            first_sent: firstSentAt[materialId],
            sent_times: sentTimes[materialId],
            latest
          });
        }
        sentIndex.sort((a, b) =>
          new Date(a.latest) < new Date(b.latest) ? 1 : -1
        );
        this.fileDetails[this.selectedContact._id] = {
          timeInfo: sentIndex,
          materials,
          trackers
        };
      });
  }
  getActivities(): any {
    const videoActivities = [];
    const pdfActivities = [];
    const imageActivities = [];

    const videoReg = new RegExp(environment.website + '/video1/\\w+', 'g');
    const pdfReg = new RegExp(environment.website + '/pdf1/\\w+', 'g');
    const imageReg = new RegExp(environment.website + '/image1/\\w+', 'g');

    let allMessage = '';
    this.conversationDetails[this.selectedContact._id].messages.forEach((e) => {
      allMessage += e.content + '\n';
    });

    let matches = allMessage.match(videoReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const videoId = e.replace(environment.website + '/video1/', '');
        videoActivities.push(videoId);
      });
    }
    matches = allMessage.match(pdfReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const videoId = e.replace(environment.website + '/pdf1/', '');
        pdfActivities.push(videoId);
      });
    }
    matches = allMessage.match(imageReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const videoId = e.replace(environment.website + '/image1/', '');
        imageActivities.push(videoId);
      });
    }

    return [...videoActivities, ...pdfActivities, ...imageActivities];
  }

  markAsRead(messages): void {
    if (
      messages[messages.length - 1].type == 1 &&
      messages[messages.length - 1].status == 0
    ) {
      this.smsService
        .markRead(messages[messages.length - 1]._id, this.selectedContact._id)
        .subscribe((res) => {
          if (res && res['status']) {
            this.selectedContact.unread = false;
            this.handlerService.readMessageContact.next({
              _id: this.selectedContact._id
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
          .markRead(unreadMessageId, this.selectedContact._id)
          .subscribe((res) => {
            if (res && res['status']) {
              this.selectedContact.unread = false;
              this.handlerService.readMessageContact.next({
                _id: this.selectedContact._id
              });
            }
          });
      }
    }
  }

  newMessage(): void {
    this.isNew = true;
    this.newContacts = [];
    this.panel = this.PanelView.Messages;
    this.scheduleCheck = false;
  }

  /**
   * Schedule Send Dialog Open
   */
  showSchedule(): void {
    const messageDialog = this.dialog.open(ScheduleSendComponent, {
      width: '100vw',
      maxWidth: '350px',
      data: {
        type: 'text'
      }
    });
    messageDialog['_overlayRef']['_host'].classList.add('top-dialog');
    messageDialog.afterClosed().subscribe((res) => {
      if (res) {
      }
    });
  }

  sendMessage(): void {
    if (this.isSend) {
      return;
    }
    if (
      this.message == '' ||
      this.message.replace(/(\r\n|\n|\r|\s)/gm, '').length == 0
    ) {
      return;
    }
    if (
      (!this.isNew && !this.selectedContact._id) ||
      (this.isNew && !this.newContacts.length)
    ) {
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

    const data = {
      video_ids: videoIds,
      pdf_ids: pdfIds,
      image_ids: imageIds,
      content: contentToSend
    };
    const send_data = {
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
    this.isSend = true;
    if (this.isNew) {
      const contactsToRegister = [];
      const existContacts = [];
      const contactIds = [];
      this.newContacts.forEach((contact) => {
        if (!contact._id) {
          contactsToRegister.push(contact);
        } else {
          existContacts.push(contact);
          contactIds.push(contact._id);
        }
      });

      if (!contactsToRegister.length) {
        data['contacts'] = contactIds;
        if (this.scheduleCheck) {
          this.sendSchedule(send_data, data['contacts']);
          return;
        }
        this.sendMessageImpl(data);
      } else {
        this.contactService.bulkCreate(contactsToRegister).subscribe((res) => {
          const newContactIds = [];
          if (res) {
            const addedContacts = res['succeed'];
            addedContacts.forEach((e) => contactIds.push(e._id));
            data['contacts'] = contactIds;
            if (this.scheduleCheck) {
              this.sendSchedule(send_data, data['contacts']);
              return;
            }
            this.sendMessageImpl(data, addedContacts);
          }
        });
      }
    } else {
      data['contacts'] = [this.selectedContact._id];
      if (this.scheduleCheck) {
        this.sendSchedule(send_data, data['contacts']);
        return;
      }
      this.sendMessageImpl(data);
    }
  }

  sendMessageImpl(data, newContacts = []): void {
    this.materialService.sendMessage(data).subscribe((res) => {
      this.isSend = false;
      if (res) {
        const message = {
          type: 0,
          content: this.message,
          updated_at: new Date(),
          created_at: new Date()
        };
        if (data?.contacts?.length > 1) {
          this.loadLatest(data.contacts.length, true);
        } else {
          const contactId = data['contacts'][0];
          let existingContact = null;
          this.contacts.some((e) => {
            if (contactId === e._id) {
              e.lastest_message = this.message;
              e.lastest_at = new Date();
              e.unread = false; // TODO: consider about the call sync
              existingContact = e;
              return true;
            }
          });
          if (!existingContact) {
            this.loadLatest(data.contacts.length, true);
          } else {
            this.contacts = this.contacts.sort((a, b) =>
              new Date(a.lastest_at + '').getTime() >
              new Date(b.lastest_at + '').getTime()
                ? -1
                : 1
            );
            if (this.selectedContact?._id === contactId) {
              // conversation details object would be updated later.
            } else {
              // select contact: this case wouldn't exist.
              this.selectContact(existingContact);
            }
          }
        }

        data.contacts.forEach((contact) => {
          if (this.conversationDetails[contact]) {
            this.conversationDetails[contact].messages.push(message);
          }
        });
        if (this.panel === this.PanelView.Files) {
          this.loadFiles();
        }
        this.message = '';
      }
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
    forkJoin({
      followup: from(this.taskService.bulkCreate(followup_data)),
      task: from(this.taskService.scheduleSendCreate(send_data))
    }).subscribe({
      next: (response) => {
        this.isSend = false;
        const task = response.task;
        if (response.followup && task['status']) {
          if (task['message'] === 'all_queue') {
            this.toast.info(
              'Your message requests are queued. The messaage queue progressing would be displayed in the header.',
              'Message Queue',
              {}
            );
          } else {
            this.toast.error('Schedules sending is failed.', 'Schedule Sent');
          }
          this.taskService.scheduleData.next({});
          this.handlerService.activityAdd$(contacts, 'task');
          this.handlerService.reload$('tasks');
          this.scheduleCheck = false;
          this.message = '';
        }
      }
    });
  }

  /**
   * Open Material dialog
   */
  openMaterialsDlg(): void {
    const { videoIds, imageIds, pdfIds } = this.getMaterials();
    const selectedMaterials = [...videoIds, ...imageIds, ...pdfIds].map((e) => {
      return { _id: e };
    });
    this.dialog
      .open(MaterialBrowserComponent, {
        width: '98vw',
        maxWidth: '940px',
        data: {
          multiple: true,
          hideMaterials: selectedMaterials
        }
      })
      .afterClosed()
      .subscribe((res) => {
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
              (!this.message ||
                this.message.replace(/(\r\n|\n|\r|\s)/gm, '').length == 0)
            ) {
              this.message = this.message + url;
              return;
            }
            if (index === 0 && this.message.slice(-1) === '\n') {
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
          this.messageText.nativeElement.focus();
        }
      });
  }

  /**
   * Select the template and prefill the textarea
   * @param template : template
   * @returns
   */
  selectTemplate(template: Template): void {
    this.messageText.nativeElement.focus();
    const field = this.messageText.nativeElement;
    if (!this.message.replace(/(\r\n|\n|\r|\s)/g, '').length) {
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

  /**
   * Insert the token
   * @param value : token value
   */
  insertValue(value: string): void {
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

  /**
   * Get the inserted the materials in the message textarea
   * @returns material ids object
   */
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

  keyTrigger(evt: any): void {
    if (evt.key === 'Enter') {
      if (evt.ctrlKey || evt.altKey) {
        return;
      }
      if (!evt.shiftKey) {
        evt.preventDefault();
        this.sendMessage();
      }
    }
  }
  resendMessage(message: string): void {}
  deleteMessage(message: string): void {}

  /**
   * Parse the content (convert the text content to the html content for the links.)
   * @param content: Increase the content
   * @returns
   */
  parseContent(content: string = ''): string {
    return content.replace(/(https?:\/\/[^\s]+)/g, function (url) {
      return '<a href="' + url + '" target="_blank">' + url + '</a>';
    });
  }

  /**
   * Calculate the different days between now and sent time
   * @param date : date
   * @returns : day count
   */
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

  /**
   * Check if the new time is new date time.
   * @param prev : prev time
   * @param next : next time
   * @returns
   */
  isNewDate(prev, next): boolean {
    if (!prev || !next) {
      return false;
    }
    const prevDate = new Date(prev.created_at + '');
    const nextDate = new Date(next.created_at + '');
    if (
      prevDate.getDate() !== nextDate.getDate() ||
      prevDate.getMonth() !== nextDate.getMonth() ||
      prevDate.getFullYear() !== nextDate.getFullYear()
    ) {
      return true;
    }
    return false;
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
}
