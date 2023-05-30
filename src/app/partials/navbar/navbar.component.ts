import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ContactCreateComponent } from 'src/app/components/contact-create/contact-create.component';
import { NoteCreateComponent } from 'src/app/components/note-create/note-create.component';
import { TaskCreateComponent } from 'src/app/components/task-create/task-create.component';
import { DialogSettings } from 'src/app/constants/variable.constants';
import { UserService } from 'src/app/services/user.service';
import { SendEmailComponent } from '../../components/send-email/send-email.component';
import { HandlerService } from 'src/app/services/handler.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ConnectService } from 'src/app/services/connect.service';
import { DealCreateComponent } from 'src/app/components/deal-create/deal-create.component';
import { interval, Subscription } from 'rxjs';
import { ContactService } from '../../services/contact.service';
import { TabItem } from 'src/app/utils/data.types';
import { Contact } from 'src/app/models/contact.model';
import { getNotificationDetail } from 'src/app/utils/functions';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { SendTextComponent } from 'src/app/components/send-text/send-text.component';
import { filter, map } from 'rxjs/operators';
import { StoreService } from '../../services/store.service';
import { Cookie } from 'src/app/utils/cookie';
import * as Storm from '@wavv/dialer';
import { Account, User } from 'src/app/models/user.model';
import { CalendarDialogComponent } from '../../components/calendar-dialog/calendar-dialog.component';
import { DialerLogComponent } from 'src/app/components/dialer-log/dialer-log.component';
import { DialerService } from 'src/app/services/dialer.service';
import { DialerReportComponent } from 'src/app/components/dialer-report/dialer-report.component';
import { AddPhoneComponent } from 'src/app/components/add-phone/add-phone.component';
import { SocketService } from 'src/app/services/socket.service';
import { ToastrComponent } from 'src/app/components/toastr/toastr.component';
import { DealsService } from 'src/app/services/deals.service';
import { between } from 'src/app/helper';
import userflow from 'userflow.js';
import { Location } from '@angular/common';
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy, AfterViewInit {
  actions: any[] = [
    { icon: 'i-contact bg-white', label: 'New Contact', id: 'contact' },
    { icon: 'i-sms-sent bg-white', label: 'New Text', id: 'text' },
    { icon: 'i-message bg-white', label: 'New Email', id: 'message' },
    { icon: 'i-task bg-white', label: 'New Task', id: 'task' },
    { icon: 'i-deals bg-white', label: 'New Deal', id: 'deal' },
    {
      icon: 'i-calendar bg-white',
      label: 'New Meeting',
      id: 'appointment'
    },
    { icon: 'i-template bg-white', label: 'New Note', id: 'note' },
    { icon: 'i-record bg-white', label: 'Record Video', id: 'record' },
    { icon: 'i-upload bg-white', label: 'New Material', id: 'video' }
  ];

  searchDataTypes: any[] = [
    { label: 'Contacts', id: 'contacts' },
    { label: 'Tasks', id: 'tasks' },
    { label: 'Materials', id: 'materials' },
    { label: 'Templates', id: 'templates' }
  ];
  currentSearchType: any = this.searchDataTypes[0];
  keyword = '';
  user_id = '';
  user: User = new User();

  // Multi Business Profile Variables
  userList: User[] = [];
  selectedUser: User = new User();
  hasMoreSeat = false;

  @ViewChild('searchInput') searchInput: ElementRef;
  @ViewChild('emailProgress') emailProgress: ElementRef;
  @ViewChild('textProgress') textProgress: ElementRef;
  @ViewChild('automationProgress') automationProgress: ElementRef;
  isSuspended = false;
  isPackageText = true;
  isPackageAutomation = true;
  isPurchasedDialer = true;
  isGuest;
  accountRef;
  goMaster = false;
  profileSubscription: Subscription;

  // Notifications
  notificationUpdater$;
  notificationUpdater: Subscription;
  notificationLoadSubscription: Subscription;
  notificationBarResetSubscription: Subscription;
  garbageSubscription: Subscription;
  systemNotifications = [];
  emailTasks = [];
  textTasks = [];
  automationTasks = [];
  unreadMessages = [];
  unreadMessageCount = 0;
  notifications = [];
  unreadNotifications = 0;
  disableActions = [];
  showEmails = false;
  showTexts = false;
  showAutomations = false;
  incomingNotifications = [];
  latestAt;
  materialTrackingShower;
  emailDialog;
  textDialog;

  showSystemBar = true;
  showAllSystemNotifications = false;

  callSubscription: Subscription;
  wavvInitSubscription: Subscription;
  siblingDealsLoadSubscription: Subscription;
  notificationSubscription: Subscription;
  notificationCommandSubscription: Subscription;
  readMessageSubscription: Subscription;
  readNotificationSubscription: Subscription;
  accountSubscription: Subscription;
  accountLoadSubscription: Subscription;
  loadingAccount = false;

  callIniting = false;
  callCommand = null;
  siblingDeals = null;
  currentDeal = null;
  newCallDeal = null;
  campaignContacts = [];
  dialerReports = [];

  draftSubscription: Subscription;
  updateEmailDraftSubscription: Subscription;
  removeEmailDraftSubscription: Subscription;
  createEmailDraftSubscription: Subscription;
  updateTextDraftSubscription: Subscription;
  removeTextDraftSubscription: Subscription;
  createTextDraftSubscription: Subscription;

  draftEmail = {
    subject: '',
    content: ''
  };

  draftText = {
    content: ''
  };

  dialerDlg;

  wavvEventListeners = [];
  lead_fields: any[] = [];

  tasks: any[];
  hasTasks: boolean = false;

  constructor(
    public userService: UserService,
    public notificationService: NotificationService,
    public handlerService: HandlerService,
    private connectService: ConnectService,
    private dialerService: DialerService,
    private dealService: DealsService,
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private contactService: ContactService,
    private toast: ToastrService,
    private router: Router,
    private location: Location,
    private storeService: StoreService,
    private socketService: SocketService,
    private zone: NgZone
  ) {
    this.loadingAccount = true;
    this.accountLoadSubscription && this.accountLoadSubscription.unsubscribe();
    this.accountLoadSubscription = this.userService
      .easyLoadSubAccounts()
      .subscribe((res) => {
        if (res && res['status'] && res['data']) {
          const accounts = res['data'].map((e) => new Account().deserialize(e));
          const limit = (res['limit'] || 0) + 1;
          this.userService.accounts.next({ accounts, limit });
        }
        this.loadingAccount = false;
      });

    this.isGuest = localStorage.getItem('guest_loggin');
    this.accountRef = localStorage.getItem('primary_loggin');
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile && profile._id) {
          this.user = profile;
          this.socketService.connect();

          this.initAccountSubscription();
          this.selectedUser = profile;
          this.user_id = profile._id;
          this.isPackageText = profile.text_info?.is_enabled;
          this.isPackageAutomation = profile.automation_info?.is_enabled;
          this.isSuspended = profile.subscription?.is_failed;
          this.disableActions = [];
          if (!this.isPackageAutomation) {
            this.disableActions.push({
              icon: 'i-calendar bg-white',
              label: 'New Meeting',
              id: 'appointment'
            });
          }
          if (profile.email_draft) {
            this.draftEmail = profile.email_draft;
          }
          if (profile.text_draft) {
            this.draftText = profile.text_draft;
          }
          if (!profile['master_disabled']) {
            this.goMaster = true;
          }

          if (profile.dialer_info && profile.dialer_info.is_enabled) {
            this.isPurchasedDialer = true;
          } else if (
            !profile.is_primary &&
            (profile['dialer'] ||
              profile['parent_company'] === 'EVO' ||
              profile.company === 'EVO')
          ) {
            this.isPurchasedDialer = true;
          } else {
            this.isPurchasedDialer = false;
          }

          if (profile?.proxy_number && !profile?.twilio_number) {
            document.body.classList.add('has-topbar');
          } else {
            document.body.classList.remove('has-topbar');
          }
        }
      }
    );

    this.readMessageSubscription && this.readMessageSubscription.unsubscribe();
    this.readMessageSubscription = this.handlerService.readMessageContact$.subscribe(
      (res) => {
        if (res && res._id) {
          this.unreadMessages.some((e, index) => {
            if (e.contact._id === res._id) {
              this.unreadMessages.splice(index, 1);
              return true;
            }
          });
          this.unreadMessages.forEach((e) => {
            if (e.contacts && e.contacts.length) {
              e.contact = new Contact().deserialize(e.contacts[0]);
            }
          });
          if (this.unreadMessageCount > 0) {
            if (this.unreadMessageCount > 5) {
              this.executeRealtimeCommand({ command: 'receive_text' });
            } else {
              this.unreadMessageCount--;
            }
          }
        }
      }
    );

    this.readNotificationSubscription &&
      this.readNotificationSubscription.unsubscribe();
    this.readNotificationSubscription = this.handlerService.readNotification$.subscribe(
      (res) => {
        if (res && res.ids && res.ids.length && this.unreadNotifications) {
          const currentNCount = this.unreadNotifications;
          for (let i = this.notifications.length - 1; i >= 0; i--) {
            const e = this.notifications[i];
            if (res.ids.indexOf(e._id) !== -1) {
              e.is_read = true;
              this.unreadNotifications--;
            }
          }
          if (currentNCount < 10) {
            return;
          } else if (this.unreadNotifications < 6) {
            this.loadNotifications();
          }
        } else if (res && res.mode == 'all') {
          this.unreadNotifications = 0;
          this.notifications.forEach((e) => {
            e.is_read = true;
          });
          this.loadNotifications();
        } else if (res && res.mode == 'all-remove') {
          this.unreadNotifications = 0;
          this.notifications = [];
        }
      }
    );

    this.notificationSubscription &&
      this.notificationSubscription.unsubscribe();
    this.notificationSubscription = this.socketService.notification$.subscribe(
      (res) => {
        if (res) {
          this.displayNotification(res);
        }
      }
    );

    this.notificationCommandSubscription &&
      this.notificationCommandSubscription.unsubscribe();
    this.notificationCommandSubscription = this.socketService.command$.subscribe(
      (res) => {
        if (res) {
          this.executeRealtimeCommand(res);
        }
      }
    );

    this.runTaskNotification();

    this.initWavvDialer();
  }

  ngOnInit(): void {
    this.connectService.receiveLogout().subscribe(() => {
      this.logout(null);
    });

    const currentPath = this.location.path();
    if (currentPath.startsWith('/deals/')) {
      this.currentDeal = currentPath.replace('/deals/', '');
    } else {
      this.currentDeal = null;
    }
    //sniper88t
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        this.lead_fields = _garbage.additional_fields.map((e) => e);
      }
    );
    this.routerHandle();
  }

  ngOnDestroy(): void {
    this.accountSubscription && this.accountSubscription.unsubscribe();
    this.accountLoadSubscription && this.accountLoadSubscription.unsubscribe();
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.notificationBarResetSubscription &&
      this.notificationBarResetSubscription.unsubscribe();
    this.notificationUpdater && this.notificationUpdater.unsubscribe();
    this.readMessageSubscription && this.readMessageSubscription.unsubscribe();
    this.readNotificationSubscription &&
      this.readNotificationSubscription.unsubscribe();
    this.callSubscription && this.callSubscription.unsubscribe();
    this.wavvInitSubscription && this.wavvInitSubscription.unsubscribe();
    this.notificationSubscription &&
      this.notificationSubscription.unsubscribe();
    this.wavvEventListeners.forEach((e) => {
      e && e.remove();
    });
    this.wavvEventListeners = [];
    this.latestAt = null;
    document.body.classList.remove('has-stormbar');
    document.body.classList.remove('has-topbar');
  }

  ngAfterViewInit(): void {
    this.notificationUpdater$ = interval(60 * 1000);
    this.notificationBarResetSubscription &&
      this.notificationBarResetSubscription.unsubscribe();
    this.notificationBarResetSubscription = this.handlerService.updaterTime$.subscribe(
      () => {
        this.resetProgressUI();
        this.loadNotifications();
        // this.notificationUpdater && this.notificationUpdater.unsubscribe();
        // this.notificationUpdater = this.notificationUpdater$.subscribe(() => {
        //   this.updateQueueStatus();
        // });
      }
    );
  }

  goToMessage(id: any): void {
    this.router.navigated = false;
    this.router.navigate(['/messages', id]);
  }

  logout(event: Event): void {
    // Logout Logic
    event && event.preventDefault();
    this.socketService.disconnect();
    userflow.reset();
    this.userService.logout().subscribe(
      () => {
        // LOGOUT COOKIE SETTING
        Cookie.setLogout();
        localStorage.removeItem('guest_loggin');
        // Intercom Logout
        window['Intercom']('shutdown');
        window['IntercomInited'] = false;
        // Wavv Deinit
        Storm.close();
        // Localstorage
        this.userService.clearLocalStorageItem('u_id');

        //clean userflow checklist localstorage
        localStorage.removeItem('checklist_state');
        localStorage.removeItem('checklist');

        this.socketService.clear$();
        this.userService.logoutImpl();
        this.handlerService.clearData();
        this.router.navigate(['/']);
      },
      () => {
        console.log('LOG OUT FAILURE');
      }
    );
  }

  /////////////////////////////////////////////////////////////////////////
  ////////////////////// Action Management /////////////////////////
  /////////////////////////////////////////////////////////////////////////
  isDisableAction(action): boolean {
    return this.disableActions.findIndex((item) => item.id === action.id) >= 0;
  }
  runAction(action: string): void {
    // Open New modal that corresponds to action
    switch (action) {
      case 'contact':
        this.dialog
          .open(ContactCreateComponent, {
            width: '98vw',
            maxWidth: '600px',
            disableClose: true,
            data: {
              contact: {},
              lead_fields: this.lead_fields
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res && res.created) {
              this.contactService.reloadPage();
            }
          });
        break;
      case 'text':
        this.storeService.textWindowType.next(true);
        if (!this.textDialog) {
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
              type: 'multi',
              draft_type: 'global_text',
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

          this.textDialog.afterClosed().subscribe((res) => {
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
            if (res && res.draft) {
              this.saveTextDraft(res.draft);
              this.storeService.textGlobalDraft.next({});
            }
            if (res && res.send) {
              const data = {
                content: ''
              };
              this.userService.updateTextDraft(data).subscribe((result) => {
                if (result) {
                  this.draftText = data;
                  this.storeService.textGlobalDraft.next({});
                }
              });
            }
          });
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
        break;
      case 'call':
        break;
      case 'task':
        this.dialog.open(TaskCreateComponent, DialogSettings.TASK);
        break;
      case 'deal':
        this.dialog
          .open(DealCreateComponent, DialogSettings.DEAL)
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              // this.dealService.getStage(true);
              this.dealService.easyLoadStage(
                true,
                this.dealService.selectedPipeline.getValue()
              );
            }
          });
        break;
      case 'note':
        this.dialog.open(NoteCreateComponent, DialogSettings.NOTE);
        break;
      case 'appointment':
        this.dialog.open(CalendarDialogComponent, {
          width: '100vw',
          maxWidth: '600px'
        });
        break;
      case 'message':
        this.storeService.emailWindowType.next(true);
        if (!this.emailDialog) {
          this.emailDialog = this.dialog.open(SendEmailComponent, {
            position: {
              bottom: '0px',
              right: '0px'
            },
            width: '100vw',
            panelClass: 'send-email',
            backdropClass: 'cdk-send-email',
            disableClose: true,
            data: {
              type: 'global_email',
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

          this.emailDialog.afterClosed().subscribe((res) => {
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
            if (res && res.draft) {
              this.saveEmailDraft(res.draft);
              this.storeService.emailGlobalDraft.next({});
            }
            if (res && res.send) {
              const data = {
                subject: '',
                content: ''
              };
              this.userService.updateEmailDraft(data).subscribe((result) => {
                if (result) {
                  this.draftEmail = data;
                  this.storeService.emailGlobalDraft.next({});
                }
              });
            }
          });
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
        break;
      case 'record':
        this.handlerService.openRecording.next(new Date().getTime());
        break;
      case 'video':
        this.router.navigate(['./materials/create/video']);
        break;
    }
    this.closeSearchBar();
  }

  ///////////////////////////////////////////////////////////////////////
  /////////////////// Notification Handler (With API) ///////////////////
  ///////////////////////////////////////////////////////////////////////
  loadNotifications(): void {
    this.notificationLoadSubscription &&
      this.notificationLoadSubscription.unsubscribe();
    this.notificationLoadSubscription = this.notificationService
      .getNotificationStatus()
      .subscribe((res) => {
        console.log('res---------------', res);
        if (res) {
          this.systemNotifications = res['system_notifications'] || [];

          // if (this.systemNotifications.length && this.showSystemBar) {
          //   document.body.classList.add('has-topbar');
          // } else {
          //   document.body.classList.remove('has-topbar');
          // }

          this.tasks = res['tasks'] || [];
          const automations = {};
          (res['automations'] || []).forEach((_a) => {
            automations[_a._id] = _a.title;
          });
          let totalContacts = 0;
          let executedContacts = 0;
          if (this.tasks && this.tasks.length) {
            this.tasks.forEach((e) => {
              if (e.type === 'send_email') {
                let failed = 0;
                let succeed = 0;
                e.tasks.forEach((_task) => {
                  if (_task.exec_result) {
                    failed += _task.exec_result.failed.length;
                    if (_task.exec_result.succeed) {
                      succeed += _task.exec_result.succeed.length;
                    } else {
                      succeed +=
                        _task.contacts.length - _task.exec_result.failed.length;
                    }
                  }
                  totalContacts += _task.contacts ? _task.contacts.length : 0;
                });
                e.failed = failed;
                e.succeed = succeed;
                executedContacts += e.failed + e.succeed;
              }

              if (e.type === 'send_text' || e.type === 'bulk_sms') {
                let failed = 0;
                let succeed = 0;
                let awaiting = 0;
                e.tasks.forEach((_task) => {
                  if (_task.status === 'active') {
                    awaiting++;
                  } else if (_task.status === 'delivered') {
                    succeed++;
                  } else {
                    failed++;
                  }
                  totalContacts += _task.contacts ? _task.contacts.length : 0;
                });
                e.failed = failed;
                e.succeed = succeed;
                e.awaiting = awaiting;
                executedContacts += failed + succeed;
              }

              if (e.type === 'assign_automation') {
                let aTotalContacts = 0;
                if (e.details && e.details.automation_id) {
                  e.details['title'] = automations[e.details.automation_id];
                }
                let failed = 0;
                let succeed = 0;
                e.tasks.forEach((_task) => {
                  if (_task.exec_result) {
                    failed += _task.exec_result.failed.length;
                    if (_task.exec_result.succeed) {
                      succeed += _task.exec_result.succeed.length;
                    } else {
                      succeed +=
                        _task.contacts.length - _task.exec_result.failed.length;
                    }
                  }
                  aTotalContacts += _task.contacts ? _task.contacts.length : 0;
                });
                e.failed = failed;
                e.succeed = succeed;
                e.contacts = aTotalContacts;
                totalContacts += aTotalContacts;
                executedContacts += e.failed + e.succeed;
              }
            });
            this.updateTextProgress(totalContacts, executedContacts);
          }

          // this.emailTasks = res['emails'] || [];
          // let eTotalContacts = 0;
          // let eExecutedContacts = 0;
          // if (this.emailTasks && this.emailTasks.length) {
          //   this.emailTasks.forEach((e) => {
          //     let failed = 0;
          //     let succeed = 0;
          //     e.tasks.forEach((_task) => {
          //       if (_task.exec_result) {
          //         failed += _task.exec_result.failed.length;
          //         if (_task.exec_result.succeed) {
          //           succeed += _task.exec_result.succeed.length;
          //         } else {
          //           succeed +=
          //             _task.contacts.length - _task.exec_result.failed.length;
          //         }
          //       }
          //       eTotalContacts += _task.contacts ? _task.contacts.length : 0;
          //     });
          //     e.failed = failed;
          //     e.succeed = succeed;
          //     eExecutedContacts += e.failed + e.succeed;
          //   });
          // }
          // this.updateEmailProgress(eTotalContacts, eExecutedContacts);

          // this.textTasks = res['texts'] || [];
          // let tTotalContacts = 0;
          // let tExecutedContacts = 0;
          // if (this.textTasks && this.textTasks.length) {
          //   this.textTasks.forEach((e) => {
          //     let failed = 0;
          //     let succeed = 0;
          //     let awaiting = 0;
          //     e.tasks.forEach((_task) => {
          //       if (_task.status === 'active') {
          //         awaiting++;
          //       } else if (_task.status === 'delivered') {
          //         succeed++;
          //       } else {
          //         failed++;
          //       }
          //       tTotalContacts += _task.contacts ? _task.contacts.length : 0;
          //     });
          //     e.failed = failed;
          //     e.succeed = succeed;
          //     e.awaiting = awaiting;
          //     tExecutedContacts += failed + succeed;
          //   });
          // }
          // this.updateTextProgress(tTotalContacts, tExecutedContacts);

          this.unreadMessages = res['unreadMessages'];
          let loadedMessages = 0;
          this.unreadMessages.forEach((e) => {
            if (e.contacts && e.contacts.length) {
              e.contact = new Contact().deserialize(e.contacts[0]);
            }
            loadedMessages += e.count;
          });
          if (res['unread'] > loadedMessages) {
            this.unreadMessageCount = this.unreadMessages.length + 1;
          } else {
            this.unreadMessageCount = this.unreadMessages.length;
          }

          this.unreadNotifications = res['unreadNotifications'];
          this.notifications = res['notifications'] || [];
          this.notifications.forEach((e) => {
            e.content = getNotificationDetail(e);
            if (!e.user) {
              e.is_read = e.read_status
                ? e.read_status[this.user_id] || false
                : false;
            }
          });

          const latest = _.maxBy(this.notifications, (e) =>
            new Date(e?.updated_at).getTime()
          );
          if (
            this.unreadNotifications &&
            this.latestAt &&
            this.latestAt.getTime() < new Date(latest?.updated_at).getTime()
          ) {
            // Check the new incoming notifications and trackers
            this.incomingNotifications = this.notifications.filter((e) => {
              return (
                new Date(e?.updated_at).getTime() > this.latestAt.getTime()
              );
            });
            const trackerNotifications = this.incomingNotifications.filter(
              (e) => {
                return e.criteria === 'material_track';
              }
            );
            if (trackerNotifications && trackerNotifications.length) {
              let counter = 0;
              this.materialTrackingShower = setInterval(() => {
                if (counter < trackerNotifications.length) {
                  this.toast.info(
                    trackerNotifications[counter].content,
                    'Material is tracked',
                    { enableHtml: true, timeOut: 6000 }
                  );
                } else {
                  clearInterval(this.materialTrackingShower);
                }
                counter++;
              }, 7000);
            }
            if (
              this.incomingNotifications.length - trackerNotifications.length
            ) {
              const anotherNotifications = this.incomingNotifications.filter(
                (e) => {
                  return e.criteria !== 'material_track';
                }
              );
              if (anotherNotifications.length > 1) {
                this.toast.success(
                  `${
                    this.incomingNotifications.length -
                    trackerNotifications.length
                  } event(s) happened recently`,
                  'Notification',
                  { timeOut: 3500 }
                );
              } else {
                this.toast.success(
                  anotherNotifications[0].content,
                  'Notification',
                  { timeOut: 3500, enableHtml: true }
                );
              }
            }
          }
          if (latest) {
            this.latestAt = new Date(latest.updated_at);
          }
        }
      });
    // this.runAutomationNotification();
  }

  resetProgressUI(): void {
    const textProgressEl =
      this.textProgress && <HTMLElement>this.textProgress.nativeElement;
    const emailProgressEl =
      this.emailProgress && <HTMLElement>this.emailProgress.nativeElement;
    const automationProgressEl =
      this.automationProgress &&
      <HTMLElement>this.automationProgress.nativeElement;
    if (textProgressEl) {
      const textThumb = textProgressEl.querySelector('.c-thumb');
      if (textThumb) {
        textThumb.classList.remove('animate');
        setTimeout(() => {
          textThumb.classList.add('animate');
        }, 100);
      }
    }
    if (emailProgressEl) {
      const emailThumb = emailProgressEl.querySelector('.c-thumb');
      if (emailThumb) {
        emailThumb.classList.remove('animate');
        setTimeout(() => {
          emailThumb.classList.add('animate');
        }, 100);
      }
    }
    if (automationProgressEl) {
      const automationThumb = automationProgressEl.querySelector('.c-thumb');
      if (automationThumb) {
        automationThumb.classList.remove('animate');
        setTimeout(() => {
          automationThumb.classList.add('animate');
        }, 100);
      }
    }
  }
  updateEmailProgress(total: number, progressed: number): void {
    if (!total && !progressed) {
      return;
    }
    let percent = 0;
    try {
      percent = progressed / (total || 1);
    } catch (err) {
      percent = 0;
    }
    const stroke = -250 - percent * 100;
    const progressEl =
      this.emailProgress && <HTMLElement>this.emailProgress.nativeElement;
    if (progressEl) {
      const track = <HTMLElement>progressEl.querySelector('.c-track');
      if (track) {
        console.log('stroke', stroke);
        track.style.strokeDashoffset = stroke + '';
      }
    }
  }
  updateTextProgress(total: number, progressed: number): void {
    let percent = 0;
    try {
      percent = progressed / (total || 1);
    } catch (err) {
      percent = 0;
    }
    const stroke = -250 - percent * 100;
    const progressEl =
      this.textProgress && <HTMLElement>this.textProgress.nativeElement;
    if (progressEl) {
      const track = <HTMLElement>progressEl.querySelector('.c-track');
      if (track) {
        track.style.strokeDashoffset = stroke + '';
      }
    }
  }
  updateAutomationProgress(total: number, progressed: number): void {
    let percent = 0;
    try {
      percent = progressed / (total || 1);
    } catch (err) {
      percent = 0;
    }
    const stroke = -250 - percent * 100;
    const progressEl =
      this.automationProgress &&
      <HTMLElement>this.automationProgress.nativeElement;
    if (progressEl) {
      const track = <HTMLElement>progressEl.querySelector('.c-track');
      if (track) {
        track.style.strokeDashoffset = stroke + '';
      }
    }
  }
  closeSystemBar(): void {
    this.showSystemBar = false;
    document.body.classList.remove('has-topbar');
  }

  /**
   * Go to Task Detail Page
   * @param task Email Task Data
   */
  goToQueuePage(task, type = 'email'): void {
    if (type === 'send_email') {
      this.router.navigate(['/email-queue/' + task._id]);
    } else if (type === 'send_text' || type === 'bulk_sms') {
      this.router.navigate(['/text-queue/' + task._id]);
    } else if (type === 'assign_automation') {
      this.router.navigate(['/automation-queue/' + task._id]);
    }
    // if (type === 'email') {
    //   this.router.navigate(['/email-queue/' + task._id]);
    // } else if (type === 'text') {
    //   this.router.navigate(['/text-queue/' + task._id]);
    // } else if (type === 'automation') {
    //   this.router.navigate(['/automation-queue/' + task._id]);
    // }
  }

  openAllSystemNotifications(): void {
    this.showAllSystemNotifications = true;
  }

  ////////////////////////////////////////////////////////
  /////////////////// Search Handler ////////////////
  ////////////////////////////////////////////////////////
  /**
   * Filter Objects
   * @param str : keyword to filter the contacts, materials ...
   */
  onFilter(str: string): void {
    this.handlerService.searchStr.next(str);
  }
  changeType(type: any): void {
    this.currentSearchType = type;
  }
  toggleSearchBar(): void {
    const openSearch = this.handlerService.openSearch.getValue();
    if (openSearch) {
      this.handlerService.openSearch.next(false);
    } else {
      this.handlerService.openSearch.next(true);
      this.searchInput.nativeElement.focus();
    }
  }
  openSearchBar(): void {
    this.handlerService.openSearch.next(true);
    this.searchInput.nativeElement.focus();
  }
  closeSearchBar(): void {
    this.handlerService.openSearch.next(false);
    const tempPipeline = this.dealService.pipelines
      .getValue()
      .find((e) => e.is_active == true);
    this.dealService.selectedPipeline.next(tempPipeline);
  }
  clearSearch(): void {
    if (this.keyword) {
      this.keyword = '';
      this.handlerService.searchStr.next('');
    } else {
      this.closeSearchBar();
    }
  }

  ////////////////////////////////////////////////////////
  /////////////////// Sub account handler ////////////////
  ////////////////////////////////////////////////////////
  initAccountSubscription(): void {
    this.accountSubscription && this.accountSubscription.unsubscribe();
    this.accountSubscription = this.userService.accounts$.subscribe(
      (accountInfo) => {
        if (!accountInfo) {
          this.userList = [];
          this.hasMoreSeat = false;
          return;
        }
        const { accounts, limit } = accountInfo;
        if (accounts && accounts.length) {
          this.userList = [];
          this.hasMoreSeat = false;
          const seat_limit = limit || 0;
          let used_seat = 0;
          accounts.forEach((e) => {
            this.userList.push(new Account().deserialize(e));
            used_seat += e.equal_account || 1;
          });

          if (used_seat < seat_limit) {
            this.hasMoreSeat = true;
          } else {
            this.hasMoreSeat = false;
          }
        } else {
          this.userList = [];
          this.hasMoreSeat = false;
        }
      }
    );
  }

  selectUser(user: User): void {
    if (this.selectedUser._id == user._id) {
      return;
    }
    this.userService.changeAccount(user._id).subscribe((res) => {
      if (res['status']) {
        this.socketService.disconnect();
        const token = res.data.token;
        if (token) {
          localStorage.setItem('token', token);
        }
        window.location.reload();
      }
    });
  }

  ////////////////////////////////////////////////////////
  ////////// Email Draft and Text Draft Handler //////////
  ////////////////////////////////////////////////////////
  routerHandle(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {})
      )
      .subscribe(() => {
        const currentPath = this.location.path();
        if (currentPath.startsWith('/deals/')) {
          this.currentDeal = currentPath.replace('/deals/', '');
        } else {
          this.currentDeal = null;
        }
        if (this.emailDialog) {
          const isMaximized = this.storeService.emailWindowType.getValue();
          if (isMaximized) {
            setTimeout(() => {
              const draftData = this.storeService.emailGlobalDraft.getValue();
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
        }
        if (this.textDialog) {
          const isMaximized = this.storeService.textWindowType.getValue();
          if (isMaximized) {
            setTimeout(() => {
              const draftData = this.storeService.textGlobalDraft.getValue();
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
        }
      });
  }
  saveEmailDraft(data): void {
    if (!data.content && !data.subject) {
      if (this.draftEmail.content || this.draftEmail.subject) {
        this.removeEmailDraftSubscription &&
          this.removeEmailDraftSubscription.unsubscribe();
        this.removeEmailDraftSubscription = this.userService
          .updateEmailDraft(data)
          .subscribe((res) => {
            if (res) {
              this.draftEmail = {
                subject: '',
                content: ''
              };
            }
          });
      }
    } else {
      const defaultEmail = this.userService.email.getValue();
      if (this.draftEmail.content || this.draftEmail.subject) {
        if (
          data.subject === this.draftEmail.subject &&
          data.content === this.draftEmail.content
        ) {
          return;
        }
      } else {
        if (defaultEmail) {
          if (
            data.content === defaultEmail.content.replace(/^\s+|\s+$/g, '') &&
            data.subject === defaultEmail.subject
          ) {
            return;
          }
        }
      }

      this.createEmailDraftSubscription &&
        this.createEmailDraftSubscription.unsubscribe();
      this.createEmailDraftSubscription = this.userService
        .updateEmailDraft(data)
        .subscribe((res) => {
          if (res) {
            this.draftEmail = data;
          }
        });
    }
  }

  saveTextDraft(data): void {
    if (!data.content) {
      if (this.draftText.content) {
        this.removeTextDraftSubscription &&
          this.removeTextDraftSubscription.unsubscribe();
        this.removeTextDraftSubscription = this.userService
          .updateTextDraft(data)
          .subscribe((res) => {
            if (res) {
              this.draftText = {
                content: ''
              };
            }
          });
      }
    } else {
      const defaultText = this.userService.sms.getValue();
      if (this.draftText.content) {
        if (data.content === this.draftEmail.content) {
          return;
        }
      } else {
        if (defaultText) {
          if (data.content === defaultText.content.replace(/^\s+|\s+$/g, '')) {
            return;
          }
        }
      }

      this.createTextDraftSubscription &&
        this.createTextDraftSubscription.unsubscribe();
      this.createTextDraftSubscription = this.userService
        .updateTextDraft(data)
        .subscribe((res) => {
          if (res) {
            this.draftText = data;
          }
        });
    }
  }

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////// WAVV Dialer Initialization /////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  purchaseDialer(): void {
    Storm.purchaseDialer();
  }

  liveTraining(): void {
    if (!this.selectedUser.onboard.tour) {
      this.selectedUser.onboard.tour = true;
      this.userService
        .updateProfile({ onboard: this.selectedUser.onboard })
        .subscribe(() => {
          this.userService.updateProfileImpl({
            onboard: this.selectedUser.onboard
          });
        });
    }
  }

  /**
   * Open the intercom
   */
  openHelpCenter(): void {
    if (!window['IntercomInited']) {
      alert('Help center is not initialized');
    } else {
      window['Intercom']('show');
    }
  }

  resetOnboarding(): void {
    localStorage.removeItem('checklist');
    localStorage.setItem('checklist_state', 'restart');
    this.selectedUser.onboard.profile = false;
    this.selectedUser.onboard.connect_email = false;
    this.selectedUser.onboard.connect_calendar = false;
    this.selectedUser.onboard.created_contact = false;
    this.selectedUser.onboard.sms_service = false;
    this.selectedUser.onboard.upload_video = false;
    this.selectedUser.onboard.send_video = false;
    this.selectedUser.onboard.dialer_checked = false;
    this.selectedUser.onboard.tour = false;
    this.selectedUser.onboard.material_download = false;
    this.selectedUser.onboard.complete = false;
    this.userService
      .updateProfile({ onboard: this.selectedUser.onboard })
      .subscribe(() => {
        this.userService.updateProfileImpl({
          onboard: this.selectedUser.onboard
        });
      });
  }

  onStartedCampaign(command, contacts): void {
    const uuid =
      this.user_id + '_' + new Date().getTime() + '_' + between(1000, 9999);
    this.callIniting = false;
    this.callCommand = command;
    this.newCallDeal = null;
    this.campaignContacts = contacts;
    if (this.callCommand?.deal) {
      this.callCommand.uuid = uuid;
      this.dialerService.clean$();
    }
  }

  initWavvDialer(): void {
    this.siblingDealsLoadSubscription &&
      this.siblingDealsLoadSubscription.unsubscribe();
    this.siblingDealsLoadSubscription = this.dealService.siblings$.subscribe(
      (res) => {
        if (res) {
          this.siblingDeals = res;
        }
      }
    );

    this.callSubscription && this.callSubscription.unsubscribe();
    this.callSubscription = this.handlerService.callCommand$.subscribe(
      (command) => {
        if (command) {
          if (command.type === 'single') {
            this.callIniting = true;
            Storm.callPhone(command.contacts[0])
              .then(() => {
                this.onStartedCampaign(command, [...command.contacts]);
              })
              .catch((err) => {
                this.onStartedCampaign(null, []);
                this.toast.error(err.message || err, 'Calling Request');
              });
          } else if (command.type === 'bulk') {
            this.callIniting = true;
            Storm.startCampaign({ contacts: command.contacts })
              .then(() => {
                this.onStartedCampaign(command, [...command.contacts]);
              })
              .catch((err) => {
                this.onStartedCampaign(null, []);
                this.toast.error(err.message || err, 'Calling Request');
              });
          }
        }
      }
    );

    this.wavvInitSubscription && this.wavvInitSubscription.unsubscribe();
    this.wavvInitSubscription = this.handlerService.wavvInited$.subscribe(
      (inited) => {
        if (inited) {
          const addCampaignEndedListener = Storm.addCampaignEndedListener(
            (e) => {
              console.log('=== Campagin End ===', e);
              // go to list page and show all status
              if (this.campaignContacts.length > 1) {
                if (this.callCommand?.deal) {
                  this.zone.run(() => {
                    if (
                      this.dialerReports.length === this.campaignContacts.length
                    ) {
                      this.closeDealCall();
                    }
                  });
                  return;
                }
                this.zone.run(() => {
                  this.router.navigate(['/contacts']);
                  if (
                    this.dialerReports &&
                    this.dialerReports.length &&
                    this.campaignContacts &&
                    this.campaignContacts.length
                  ) {
                    this.dialog
                      .open(DialerReportComponent, {
                        width: '96vw',
                        maxWidth: '500px',
                        data: {
                          reports: this.dialerReports.reverse(),
                          contacts: this.campaignContacts
                        },
                        disableClose: true
                      })
                      .afterClosed()
                      .subscribe((res) => {
                        this.dialerReports = [];
                        if (res && res.data) {
                          const notification = res.data;
                          notification.content = getNotificationDetail(
                            notification
                          );
                          this.notifications.unshift(notification);
                          this.unreadNotifications++;
                        }
                      });
                  }
                });
              }
            }
          );

          const campaignWaitingListener = Storm.addWaitingForContinueListener(
            (e) => {
              // Show feedback dialog (Save Note && recording save && cancel)
              console.log('=== Waiting Signal ===', e);
              this.zone.run(() => {
                setTimeout(() => {
                  // Check the Completed Contact Data
                  console.log('=== Waiting Handler ===', e);
                  if (!e.contactId) {
                    return;
                  }
                  const logs = this.dialerService.history.getValue();

                  // Check if the logs contains the current completed contact data
                  // if there is no current completed contact data, this is submitted to the server already.
                  const currentCompletedContact = logs.findIndex(
                    (e) => e.contactId === e.contactId
                  );
                  if (currentCompletedContact === -1) {
                    return;
                  }

                  if (logs && logs.length) {
                    if (this.dialerDlg) {
                      return;
                    }
                    if (this.callCommand?.deal) {
                      this.dialerDlg = this.dialog.open(DialerLogComponent, {
                        width: '96vw',
                        maxWidth: '500px',
                        data: {
                          contacts: this.campaignContacts,
                          deal: this.callCommand?.deal,
                          uuid: this.callCommand?.uuid
                        },
                        disableClose: true
                      });
                      this.dialerDlg.afterClosed().subscribe((res) => {
                        this.dialerService.clean$();
                        this.dialerReports = [
                          ...res.data,
                          ...this.dialerReports
                        ];
                        this.dialerReports = _.uniqBy(
                          this.dialerReports,
                          'contactId'
                        );
                        const lastContact = this.campaignContacts.slice(-1)[0];
                        if (
                          !lastContact ||
                          e.contactId === lastContact.contactId
                        ) {
                          Storm.continueCampaign({
                            resume: true
                          }).then(() => {});
                        } else {
                          Storm.continueCampaign({
                            resume: false
                          }).then(() => {});
                        }
                        if (this.campaignContacts.length === 1) {
                          this.contactService.addLatestActivity(3);
                        }
                        this.dialerDlg = null;
                        if (this.newCallDeal) {
                          this.closeDealCall();
                        }
                      });
                      return;
                    }
                    this.dialerDlg = this.dialog.open(DialerLogComponent, {
                      width: '96vw',
                      maxWidth: '500px',
                      data: {
                        contacts: this.campaignContacts
                      },
                      disableClose: true
                    });
                    this.dialerDlg.afterClosed().subscribe((res) => {
                      this.dialerService.clean$();
                      this.dialerReports = [...res.data, ...this.dialerReports];
                      this.dialerReports = _.uniqBy(
                        this.dialerReports,
                        'contactId'
                      );
                      const lastContact = this.campaignContacts.slice(-1)[0];
                      if (
                        !lastContact ||
                        e.contactId === lastContact.contactId
                      ) {
                        console.log('=== last contact is closed ===');
                        Storm.continueCampaign({ resume: true }).then(() => {});
                      } else {
                        if (res.continue) {
                          Storm.continueCampaign({
                            resume: true
                          }).then(() => {});
                        } else {
                          Storm.continueCampaign({
                            resume: false
                          }).then(() => {});
                        }
                      }
                      if (this.campaignContacts.length === 1) {
                        this.contactService.addLatestActivity(3);
                      }

                      this.dialerDlg = null;
                    });
                  } else {
                    this.dialerService.clean$();
                    const lastContact = this.campaignContacts.slice(-1)[0];
                    if (!lastContact || e.contactId === lastContact.contactId) {
                      Storm.continueCampaign({ resume: true }).then(() => {});
                    } else {
                      Storm.continueCampaign({ resume: false }).then(() => {});
                    }
                    if (this.campaignContacts.length === 1) {
                      this.contactService.addLatestActivity(3);
                    }
                  }
                }, 500);
              });
            }
          );

          const callEndListener = Storm.addCallEndedListener((data) => {
            console.log('=== call is ended ===', data);
            const res = this.dialerService.update$(data);
            // Deal call check
            if (this.callCommand?.deal) {
              if (!res.answered) {
                // Save automatically and remove from deal service chunk
                if (res.human === undefined) {
                  if (this.newCallDeal) {
                    this.closeDealCall();
                  }
                  return;
                }
                const log = { ...res };
                if (data.outcome === 'VOICEMAIL') {
                  log['label'] = 'Voice Message';
                } else if (data.outcome === 'CALLBACK') {
                  log['label'] = 'Callback Set';
                } else {
                  log['label'] = 'No Answer';
                }
                log.deal = this.callCommand?.deal;
                log.uuid = this.callCommand?.uuid;
                this.dialerService.pop$(log);
                this.dialerReports = _.uniqBy(
                  [...this.dialerReports, log],
                  'contactId'
                );
                if (this.newCallDeal) {
                  this.closeDealCall();
                }
                this.dialerService.register([log]).subscribe(() => {
                  console.log('disconnected call log is saved.');
                });
              }
              return;
            }
            if (!res.answered) {
              // Save automatically and remove from deal service chunk
              const log = { ...res };
              if (data.outcome === 'VOICEMAIL') {
                log['label'] = 'Voice Message';
              } else if (data.outcome === 'CALLBACK') {
                log['label'] = 'Callback Set';
              } else {
                log['label'] = 'No Answer';
              }
              this.dialerService.register([log]).subscribe((res) => {
                console.log('saving log', res);
              });
              this.dialerService.pop$(log);
              this.dialerReports = _.uniqBy(
                [...this.dialerReports, log],
                'contactId'
              );
            }
          });

          const lineChangeListener = Storm.addLinesChangedListener(
            ({ lines }) => {
              lines.forEach((call) => {
                if (call.focused) {
                  if (call.contactId) {
                    this.zone.run(() => {
                      this.dialerDlg && this.dialerDlg.close();
                      this.dialerDlg = null;
                      if (this.callCommand?.deal) {
                        return;
                      }
                      this.router.navigate([`/contacts/${call.contactId}`]);
                    });
                  }
                }
              });
            }
          );

          const callStartListener = Storm.addCallStartedListener((data) => {
            if (data && data.contactId) {
              this.dialerService.push$(data);
            }
          });

          const callRecordedListener = Storm.addCallRecordedListener((data) => {
            this.dialerService.update$(data);
          });

          const callAnsweredListener = Storm.addCallAnsweredListener((data) => {
            this.dialerService.update$({ ...data, answered: true });
          });

          const wavvClosedListener = Storm.addClosedListener(() => {
            this.callCommand = null;
          });

          const dialerVisibleListener = Storm.addDialerVisibleListener((e) => {
            this.toggleStormBar(e);
          });

          const miniDialerVisibleListener = Storm.addMiniDialerVisibleListener(
            (e) => {
              this.toggleStormBar(e);
            }
          );

          this.wavvEventListeners.push(addCampaignEndedListener);
          this.wavvEventListeners.push(campaignWaitingListener);
          this.wavvEventListeners.push(lineChangeListener);
          this.wavvEventListeners.push(callStartListener);
          this.wavvEventListeners.push(callEndListener);
          this.wavvEventListeners.push(callRecordedListener);
          this.wavvEventListeners.push(callAnsweredListener);
          this.wavvEventListeners.push(wavvClosedListener);
          this.wavvEventListeners.push(dialerVisibleListener);
          this.wavvEventListeners.push(miniDialerVisibleListener);
        }
      }
    );
  }

  callPrevDeal(): void {
    const logs = this.dialerService.history.getValue();
    if (
      (this.dialerReports.length &&
        this.dialerReports.length !== this.campaignContacts.length) ||
      (this.campaignContacts.length && logs && logs.length)
    ) {
      for (let i = this.campaignContacts.length - 1; i >= 0; i--) {
        const contact = this.campaignContacts[i];
        Storm.removeContact({ ...contact, hangup: true, resume: true });
      }
      this.newCallDeal = this.siblingDeals?.prev;

      if (this.campaignContacts.length && (!logs || !logs.length)) {
        this.closeDealCall();
      }
    } else {
      if (this.campaignContacts && this.campaignContacts.length) {
        for (let i = this.campaignContacts.length - 1; i >= 0; i--) {
          const contact = this.campaignContacts[i];
          Storm.removeContact({ ...contact, hangup: true, resume: true });
        }
      }
      const deal = this.siblingDeals?.prev;
      setTimeout(() => {
        this.moveOtherDealCall(deal);
      }, 1000);
    }
  }

  callNextDeal(): void {
    const logs = this.dialerService.history.getValue();
    if (
      (this.dialerReports.length &&
        this.dialerReports.length !== this.campaignContacts.length) ||
      (this.campaignContacts.length && logs && logs.length)
    ) {
      for (let i = this.campaignContacts.length - 1; i >= 0; i--) {
        const contact = this.campaignContacts[i];
        Storm.removeContact({ ...contact, hangup: true, resume: true });
      }
      this.newCallDeal = this.siblingDeals?.next;

      if (this.campaignContacts.length && (!logs || !logs.length)) {
        this.closeDealCall();
      }
    } else {
      if (this.campaignContacts && this.campaignContacts.length) {
        for (let i = this.campaignContacts.length - 1; i >= 0; i--) {
          const contact = this.campaignContacts[i];
          Storm.removeContact({ ...contact, hangup: true, resume: true });
        }
      }
      const deal = this.siblingDeals?.next;
      setTimeout(() => {
        this.moveOtherDealCall(deal);
      }, 1000);
    }
  }

  moveOtherDealCall(deal): void {
    if (!deal || !deal._id) {
      return;
    } else {
      this.router.navigate(['/deals/' + deal._id]);
      const contacts = [];
      deal.contacts.forEach((e) => {
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
        deal: deal._id
      });
    }
  }

  closeDealCall(): void {
    const reports = this.dialerReports;
    this.dialog
      .open(DialerReportComponent, {
        width: '96vw',
        maxWidth: '500px',
        data: {
          reports: reports,
          contacts: this.campaignContacts,
          deal: this.callCommand?.deal,
          uuid: this.callCommand?.uuid
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        this.dialerReports = [];
        if (res && res.data) {
          const notification = res.data;
          notification.content = getNotificationDetail(notification);
          this.notifications.unshift(notification);
          this.unreadNotifications++;
        }

        Storm.continueCampaign({
          resume: true
        }).then(() => {});
        // Call Move Next
        if (this.newCallDeal) {
          this.moveOtherDealCall(this.newCallDeal);
        }
      });
  }

  goToPrevDeal(): void {
    if (!this.siblingDeals?.prev) {
      return;
    }
    if (this.callCommand?.deal === this.currentDeal) {
      this.callPrevDeal();
    } else {
      // Redirect
      this.router.navigate(['/deals/' + this.siblingDeals?.prev?._id]);
    }
  }

  goToNextDeal(): void {
    if (!this.siblingDeals?.next) {
      return;
    }
    if (this.callCommand?.deal === this.currentDeal) {
      this.callNextDeal();
    } else {
      // Redirect
      this.router.navigate(['/deals/' + this.siblingDeals?.next?._id]);
    }
  }

  toggleStormBar(e): void {
    if (e.visible) {
      document.body.classList.add('has-stormbar');
    } else {
      document.body.classList.remove('has-stormbar');
      this.zone.run(() => {
        this.callCommand = null;
      });
    }
  }

  ////////////////////////////////////////////////////////
  /////////////////// Socket Notification Display /////////////////
  ///////////////////////////////////////////////////////
  displayNotification(_n: any): void {
    this.toast.info('', 'Material is tracked', {
      toastComponent: ToastrComponent,
      enableHtml: true,
      // disableTimeOut: true,
      tapToDismiss: false
    });
  }

  executeRealtimeCommand(_c): void {
    if (_c.command === 'receive_text') {
      this.notificationService.loadUnreadTexts().subscribe((res) => {
        this.unreadMessages = res['data'];
        let loadedMessages = 0;
        this.unreadMessages.forEach((e) => {
          if (e.contacts && e.contacts.length) {
            e.contact = new Contact().deserialize(e.contacts[0]);
          }
          loadedMessages += e.count;
        });
        if (this.unreadMessages.length > 5) {
          this.unreadMessageCount = this.unreadMessages.length;
          this.unreadMessages = this.unreadMessages.slice(0, 5);
        } else {
          this.unreadMessageCount = this.unreadMessages.length;
        }
      });
      return;
    }
    if (_c.command === 'bulk_email_progress' || _c.command === 'bulk_email') {
      this.runTaskNotification();
      // this.runEmailNotification();
      this.loadNotifications();
      return;
    }
    if (_c.command === 'bulk_text_progress' || _c.command === 'bulk_text') {
      this.runTaskNotification();
      // this.runTextNotification();
      this.loadNotifications();
      return;
    }
    if (_c.command === 'assign_automation_progress') {
      this.runTaskNotification();
      // this.runAutomationNotification();
      this.loadNotifications();
      return;
    }
    if (_c.command === 'load_notification') {
      console.log('load notification', _c);
      this.loadNotifications();
      return;
    }
    if (_c.command == 'share_automation') {
      this.loadNotifications();
      return;
    }
    if (_c.command == 'share_material') {
      this.loadNotifications();
      return;
    }
    if (_c.command == 'share_template') {
      this.loadNotifications();
      return;
    }
    if (_c.command == 'team_invited') {
      this.loadNotifications();
      return;
    }
  }

  updateQueueStatus(): void {
    // Email Queue
    if (this.emailTasks && this.emailTasks.length) {
      this.runEmailNotification();
    }
    // Sms Queue
    if (this.textTasks && this.textTasks.length) {
      this.runTextNotification();
    }
    // Automation Queue
    if (this.automationTasks && this.automationTasks.length) {
      this.runAutomationNotification();
    }
  }

  runTaskNotification(): void {
    this.notificationService.checkTasks().subscribe((res) => {
      if (res.data) {
        this.hasTasks = true;
      } else {
        this.hasTasks = false;
      }
    });
  }

  runAutomationNotification(): void {
    this.notificationService.loadAutomationQueues().subscribe((res) => {
      const automations = {};
      (res['automations'] || []).forEach((_a) => {
        automations[_a._id] = _a.title;
      });
      this.automationTasks = res['data'] || [];
      this.automationTasks.forEach((_t) => {
        if (_t.details && _t.details.automation_id) {
          _t.details['title'] = automations[_t.details.automation_id];
        }
      });
      this.automationTasks = res['data'] || [];
      let eTotalContacts = 0;
      let eExecutedContacts = 0;
      if (this.automationTasks && this.automationTasks.length) {
        this.automationTasks.forEach((e) => {
          let failed = 0;
          let succeed = 0;
          e.tasks.forEach((_task) => {
            if (_task.exec_result) {
              failed += _task.exec_result.failed.length;
              if (_task.exec_result.succeed) {
                succeed += _task.exec_result.succeed.length;
              } else {
                succeed +=
                  _task.contacts.length - _task.exec_result.failed.length;
              }
            }
            eTotalContacts += _task.contacts ? _task.contacts.length : 0;
          });
          e.failed = failed;
          e.succeed = succeed;
          e.contacts = eTotalContacts;
          eExecutedContacts += e.failed + e.succeed;
        });
      }
      this.updateAutomationProgress(eTotalContacts, eExecutedContacts);
    });
  }

  runEmailNotification(): void {
    this.notificationService.loadEmailQueues().subscribe((res) => {
      let eTotalContacts = 0;
      let eExecutedContacts = 0;
      this.emailTasks = res['data'] || [];
      if (this.emailTasks && this.emailTasks.length) {
        this.emailTasks.forEach((e) => {
          let failed = 0;
          let succeed = 0;
          e.tasks.forEach((_task) => {
            if (_task.exec_result) {
              failed += _task.exec_result.failed.length;
              if (_task.exec_result.succeed) {
                succeed += _task.exec_result.succeed.length;
              } else {
                succeed +=
                  _task.contacts.length - _task.exec_result.failed.length;
              }
            }
            eTotalContacts += _task.contacts ? _task.contacts.length : 0;
          });
          e.failed = failed;
          e.succeed = succeed;
          eExecutedContacts += e.failed + e.succeed;
        });
        this.updateEmailProgress(eTotalContacts, eExecutedContacts);
      }
    });
  }

  runTextNotification(): void {
    this.notificationService.loadTextQueues().subscribe((res) => {
      this.textTasks = res['data'] || [];
      let tTotalContacts = 0;
      let tExecutedContacts = 0;
      if (this.textTasks && this.textTasks.length) {
        this.textTasks.forEach((e) => {
          let failed = 0;
          let succeed = 0;
          let awaiting = 0;
          e.tasks.forEach((_task) => {
            if (_task.status === 'active') {
              awaiting++;
            } else if (_task.status === 'delivered') {
              succeed++;
            } else {
              failed++;
            }
            tTotalContacts += _task.contacts ? _task.contacts.length : 0;
          });
          e.failed = failed;
          e.succeed = succeed;
          e.awaiting = awaiting;
          tExecutedContacts += failed + succeed;
        });
      }
      this.updateTextProgress(tTotalContacts, tExecutedContacts);
    });
  }

  /**
   * Sms number buy modal
   */
  openBuySms(): void {
    this.dialog
      .open(AddPhoneComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '650px',
        disableClose: true,
        data: {
          type: 'edit'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.user.twilio_number = res;
          if (!this.user.onboard.sms_service) {
            this.user.onboard.sms_service = true;
            this.userService
              .updateProfile({ onboard: this.user.onboard })
              .subscribe(() => {
                this.userService.updateProfileImpl({
                  proxy_number: this.user.proxy_number,
                  twilio_number: this.user.twilio_number,
                  onboard: this.user.onboard
                });
              });
          } else {
            this.userService.updateProfileImpl({
              proxy_number: this.user.proxy_number,
              twilio_number: this.user.twilio_number
            });
          }
        }
      });
  }
}
