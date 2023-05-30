import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwPush } from '@angular/service-worker';
import { Garbage } from 'src/app/models/garbage.model';
import { SearchOption } from 'src/app/models/searchOption.model';
import { User } from 'src/app/models/user.model';
import { ContactService } from 'src/app/services/contact.service';
import { DealsService } from 'src/app/services/deals.service';
import { HandlerService } from 'src/app/services/handler.service';
import { LabelService } from 'src/app/services/label.service';
import { NotificationService } from 'src/app/services/notification.service';
import { TagService } from 'src/app/services/tag.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';
import { init } from '@wavv/dialer';
import { ToastrService } from 'ngx-toastr';
import { ThemeService } from 'src/app/services/theme.service';
import { ADMIN_CALL_LABELS } from 'src/app/constants/variable.constants';
import { MatDialog } from '@angular/material/dialog';
import { NotificationAlertComponent } from 'src/app/components/notification-alert/notification-alert.component';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import userflow from 'userflow.js';
import { UserflowCongratComponent } from 'src/app/components/userflow-congrat/userflow-congrat.component';
import { SelectCompanyComponent } from 'src/app/components/select-company/select-company.component';
import { Location } from '@angular/common';
import { Cookie } from 'src/app/utils/cookie';
import { filter } from 'rxjs/operators';
import { UpgradePlanErrorComponent } from '../../components/upgrade-plan-error/upgrade-plan-error.component';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit {
  user: User = new User();
  @ViewChild('drawer') manageLabelPanel: MatDrawer;
  mode = '';
  showDialog = false;
  visibleRecording = false;
  accountInfo = [
    { type: 'profile', status: true, label: 'Complete your profile' },
    { type: 'email', status: false, label: 'Connect your email' },
    { type: 'contact', status: false, label: 'Create your first contact' },
    { type: 'video', status: false, label: 'Upload and send a video' },
    { type: 'sms', status: false, label: 'Set up the SMS service' },
    { type: 'calendar', status: false, label: 'Connect your calendar ' },
    {
      type: 'dialer',
      status: false,
      label: 'Set up your dialer with unlimited talk time'
    },
    {
      type: 'another',
      status: false,
      label: 'Add another profile to your account'
    },
    {
      type: 'tour',
      status: false,
      label: 'Take a mini tour on crmgrow'
    }
  ];
  isOverlay = true;
  isDownload = false;
  downloadLink = '';
  checklist_id = '73d17b2f-c330-4a92-8156-8cf922b5e47c';
  isUserflowInited = false;
  isUserflowStarted = false;
  routeChangeSubscription: Subscription;
  profileSubscription: Subscription;
  garbageSubscription: Subscription;
  selectedCompany: BehaviorSubject<boolean> = new BehaviorSubject(false);
  selectedCompany$ = this.selectedCompany.asObservable();
  isCheckedUpdate = false;
  congratModal;
  isShowSuspendedModal = false;

  constructor(
    public handlerService: HandlerService,
    private userService: UserService,
    private labelService: LabelService,
    private dealsService: DealsService,
    private tagService: TagService,
    private contactService: ContactService,
    private themeService: ThemeService,
    private notificationService: NotificationService,
    private swPush: SwPush,
    private toast: ToastrService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private location: Location
  ) {
    this.userService.loadProfile().subscribe((res) => {
      const userInfo = new User().deserialize(res);

      this.userService.updateLocalStorageItem('u_id', userInfo._id);

      if (res?.builder_token) {
        this.userService.loadPagesImpl(res.builder_token).then((pages) => {
          if (pages?.length) {
            this.userService.updateProfileImpl({ builder_version: 'old' });
          }
          Cookie.setWithDomain(
            '_pages_session',
            res.builder_token1,
            'crmgrow.com'
          );
        });
      }

      if (res['dialer_token']) {
        init({ token: res['dialer_token'] })
          .then(() => {
            // this.toast.success(
            //   'Wavv Call is initialized successfully.',
            //   'Wavv Call'
            // );
            this.handlerService.wavvInited.next(new Date().getTime());
          })
          .catch((err) => {
            this.toast.error(
              err ? err.message || err : 'Unknown Error',
              'Init Wavv Call'
            );
            userInfo.dialer_info.is_enabled = false;
          });
      } else {
        if (userInfo.dialer_info) {
          userInfo.dialer_info.is_enabled = false;
        }
      }

      this.userService.setProfile(userInfo);
      const garbage = new Garbage().deserialize(res['garbage']);
      this.userService.setGarbage(garbage);

      if (garbage && garbage.call_labels && garbage.call_labels.length) {
        const callLabels = [...ADMIN_CALL_LABELS, ...garbage.call_labels];
        this.userService.callLabels.next(callLabels);
      }

      this.contactService.searchOption.next(new SearchOption());
      this.contactService.getCountriesAndStates();
      // this.contactService.searchStr.next('');

      this.userService.loadDefaults().subscribe((res) => {
        if (res) {
          this.userService.email.next(res['email']);
          this.userService.sms.next(res['sms']);
        }
      });

      // Intercom setting
      window['intercomSettings'] = {
        app_id: 'f5cp9mf4',
        name: res['user_name'],
        email: res['email'],
        created_at: res['created_at'],
        last_request_at: new Date().getTime() / 1000,
        vertical_padding: 20,
        hide_default_launcher: true
      };
      window['Intercom']('update', window['intercomSettings']);
      window['IntercomInited'] = true;
    });
    this.labelService.loadLabels();
    this.tagService.getAllTags();
    this.tagService.getAllCompanies();
    this.tagService.getAllSources();
    this.dealsService.getPipeLine().subscribe((res) => {
      if (res) {
        this.dealsService.pipelines.next(res);
        const activePipeline = res.find((e) => e.is_active == true);
        if (activePipeline) {
          this.dealsService.selectedPipeline.next(activePipeline);
        } else {
          this.dealsService.selectedPipeline.next(res[0]);
          this.dealsService
            .updatePipeLine(res[0]._id, {
              is_active: true
            })
            .subscribe();
        }
        this.dealsService
          .loadStage(this.dealsService.selectedPipeline.getValue())
          .subscribe((dealStages) => {
            console.log(dealStages);
            this.dealsService.stages.next(dealStages || []);
            this.dealsService.stages.forEach((next) => {
              next.forEach((element) => {
                const idArray = this.dealsService.stageIdArray.getValue();
                idArray.push(element._id);
                this.dealsService.stageIdArray.next(idArray);
              });
            });
          });
      }
    });
    this.themeService.getNewsletters(true);

    // Open or Close Manage Label
    this.labelService.manageLabel$.subscribe((flg) => {
      if (this.manageLabelPanel) {
        if (flg) {
          this.manageLabelPanel.open();
        } else {
          this.manageLabelPanel.close();
        }
      }
    });

    this.notificationService.loadNotifications();

    this.handlerService.openSearch$.subscribe((status) => {
      if (status) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
      }
    });

    this.handlerService.openRecording$.subscribe((res) => {
      if (res) {
        this.visibleRecording = true;
      } else {
        this.visibleRecording = false;
      }
    });

    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.user = profile;
        }
      }
    );

    this.selectedCompany$.subscribe((res) => {
      if (res) {
        this.userflowImpl();
      }
    });

    // check refresh browser and if user is suspended, show upgrade plan modal.
    this.router.events
      .pipe(filter((rs): rs is NavigationEnd => rs instanceof NavigationEnd))
      .subscribe((event) => {
        if (event.id === 1 && event.url === event.urlAfterRedirects) {
          this.userService.profile$.subscribe((profile) => {
            if (profile._id) {
              if (
                profile &&
                profile.subscription &&
                profile.subscription.is_failed &&
                !this.isShowSuspendedModal
              ) {
                this.isShowSuspendedModal = true;
                this.dialog.open(UpgradePlanErrorComponent, {
                  position: { top: '100px' },
                  width: '100vw',
                  maxWidth: '450px',
                  disableClose: true
                });
              }
            }
          });

          // if (
          //   data.user &&
          //   data.user.subscription &&
          //   data.user.subscription.is_suspended
          // ) {
          //   this.returnUrl = '/profile/billing';
          //   this.router.navigate([this.returnUrl]);
          //   this.dialog.open(UpgradePlanErrorComponent, {
          //     position: { top: '100px' },
          //     width: '100vw',
          //     maxWidth: '450px',
          //     disableClose: true
          //   });
          // }
        }
      });
  }

  ngOnInit(): void {
    this.routeChangeSubscription = this.route.queryParams.subscribe(
      (params) => {
        this.mode = params['prev'];
        if (this.mode == 'signup') {
          this.location.replaceState('/home');
          this.dialog
            .open(SelectCompanyComponent, {
              width: '98vw',
              maxWidth: '527px',
              disableClose: true,
              data: {
                type: 'signup'
              }
            })
            .afterClosed()
            .subscribe((res) => {
              if (res) {
                const company = res['company'];
                const job = res['job'];
                this.userService
                  .updateProfile({ company, job })
                  .subscribe((res) => {
                    if (res) {
                      this.userService.updateProfileImpl({ company, job });
                    }
                  });
                this.selectedCompany.next(true);
              }
            });
        } else {
          this.selectedCompany.next(true);
        }
      }
    );
    userflow.setCustomNavigate((url) => {
      if (url) {
        this.ngZone.run(() => {
          if (url == 'watched_modal' && !this.user.onboard.watched_modal) {
            this.user.onboard.watched_modal = true;
            this.userService
              .updateProfile({
                onboard: this.user.onboard
              })
              .subscribe(() => {
                this.userService.updateProfileImpl({
                  onboard: this.user.onboard
                });
              });
            this.router.navigate(['/profile/general']);
          } else if (url == 'calendar' || url == 'dialer') {
            this.router.navigate(['/settings/integration']);
          } else {
            this.router.navigate([url]);
          }
        });
      }
    });
    userflow.on('checklistEnded', (event) => {
      if (event.checklist.id === this.checklist_id) {
        localStorage.setItem('checklist_state', 'dismiss');
        this.checkUpdate();
      }
    });

    // Download Link Generation
    if (window.navigator.userAgent.indexOf('Win') !== -1) {
      this.downloadLink =
        'https://teamgrow.s3.us-east-2.amazonaws.com/recorder/CRMRecord.exe';
    } else {
      this.downloadLink =
        'https://teamgrow.s3.us-east-2.amazonaws.com/recorder/CRMRecord.dmg';
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types

  checkUpdate(): void {
    if (this.isCheckedUpdate) {
      return;
    }
    this.isCheckedUpdate = true;
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (garbage) => {
        if (garbage._id) {
          this.garbageSubscription && this.garbageSubscription.unsubscribe();
          if (!this.user?.onboard?.watched_modal) {
            return;
          }
          if (!garbage.is_read) {
            this.notificationService.loadUpdate().subscribe((_n) => {
              const notification = _n.result?.[0];
              if (notification) {
                this.dialog.open(NotificationAlertComponent, {
                  width: '98vw',
                  maxWidth: '527px',
                  disableClose: true,
                  data: {
                    notification
                  }
                });
              }
            });
          }
        }
      }
    );
  }

  initUserflow(userInfo: User): void {
    if (this.isUserflowInited) {
      return;
    }
    userflow.init('ct_opamqimbtjhorkvifeujsaaajq');
    userflow.identify(userInfo._id, {
      watch_modal: {
        set: 'false',
        data_type: 'string'
      },
      profile: {
        set: 'false',
        data_type: 'string'
      },
      connect_email: {
        set: 'false',
        data_type: 'string'
      },
      contact: {
        set: 'false',
        data_type: 'string'
      },
      upload_video: {
        set: 'false',
        data_type: 'string'
      },
      send_video: {
        set: 'false',
        data_type: 'string'
      },
      sms: {
        set: 'false',
        data_type: 'string'
      },
      calendar: {
        set: 'false',
        data_type: 'string'
      },
      dialer: {
        set: 'false',
        data_type: 'string'
      },
      account_type: {
        set: 'false',
        data_type: 'string'
      },
      tour: {
        set: 'false',
        data_type: 'string'
      },
      material_download: {
        set: 'false',
        data_type: 'string'
      },
      automation_download: {
        set: 'false',
        data_type: 'string'
      },
      template_download: {
        set: 'false',
        data_type: 'string'
      }
    });
    this.isUserflowInited = true;
    this.startUserflow();
    // if (this.selectedCompany.getValue()) {
    //   this.startUserflow();
    // }
  }

  startUserflow(): void {
    if (this.isUserflowStarted) {
      return;
    }
    if (
      !localStorage.getItem('checklist_state') ||
      localStorage.getItem('checklist_state') == 'start'
    ) {
      userflow.start(this.checklist_id);
      localStorage.setItem('checklist_state', 'start');
      if (!localStorage.getItem('checklist')) {
        localStorage.setItem('checklist', 'start');
      }
    }
    this.isUserflowStarted = true;
  }

  userflowImpl(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.user = profile;
          if (profile.user_version < 2.1) {
            this.checkUpdate();
            return;
          }

          this.initUserflow(this.user);

          let isProfile, isEmail;
          if (
            (this.user.user_name &&
              this.user.email &&
              this.user.phone.number) ||
            this.user.onboard.profile
          ) {
            isProfile = 'true';
          } else {
            isProfile = 'false';
          }

          if (this.user.primary_connected || this.user.onboard.connect_email) {
            isEmail = 'true';
          } else {
            isEmail = 'false';
          }

          if (userflow.isIdentified()) {
            userflow.updateUser({
              watch_modal: {
                set: this.user.onboard.watched_modal ? 'true' : 'false',
                data_type: 'string'
              },
              profile: {
                set: isProfile,
                data_type: 'string'
              },
              connect_email: {
                set: isEmail,
                data_type: 'string'
              },
              contact: {
                set: this.user.onboard.created_contact ? 'true' : 'false',
                data_type: 'string'
              },
              upload_video: {
                set: this.user.onboard.upload_video ? 'true' : 'false',
                data_type: 'string'
              },
              send_video: {
                set: this.user.onboard.send_video ? 'true' : 'false',
                data_type: 'string'
              },
              sms: {
                set:
                  this.user.proxy_number ||
                  this.user.twilio_number ||
                  this.user.onboard.sms_service
                    ? 'true'
                    : 'false',
                data_type: 'string'
              },
              calendar: {
                set:
                  this.user.calendar_list.length ||
                  this.user.onboard.connect_calendar
                    ? 'true'
                    : 'false',
                data_type: 'string'
              },
              dialer: {
                set:
                  this.user.dialer_info?.is_enabled ||
                  this.user.onboard.dialer_checked
                    ? 'true'
                    : 'false',
                data_type: 'string'
              },
              account_type: {
                set: this.user.package_level,
                data_type: 'string'
              },
              tour: {
                set: this.user.onboard.tour ? 'true' : 'false',
                data_type: 'string'
              },
              material_download: {
                set: this.user.onboard.material_download ? 'true' : 'false',
                data_type: 'string'
              },
              automation_download: {
                set: this.user.onboard.automation_download ? 'true' : 'false',
                data_type: 'string'
              },
              template_download: {
                set: this.user.onboard.template_download ? 'true' : 'false',
                data_type: 'string'
              }
            });

            if (localStorage.getItem('checklist_state') == 'restart') {
              userflow.start(this.checklist_id);
              localStorage.setItem('checklist_state', 'start');
              if (!localStorage.getItem('checklist')) {
                localStorage.setItem('checklist', 'start');
              }
            }

            if (!this.user.onboard.watched_modal) {
              userflow.start('3e3d4a71-d310-45e9-97f7-1cc9f6e52fec');
            }
          }
          if (
            ((this.user.user_name &&
              this.user.email &&
              this.user.phone.number) ||
              this.user.onboard.profile) &&
            (this.user.primary_connected || this.user.onboard.connect_email) &&
            this.user.onboard.created_contact &&
            (this.user.calendar_list.length ||
              this.user.onboard.connect_calendar) &&
            this.user.onboard.upload_video &&
            this.user.onboard.send_video &&
            (this.user.proxy_number ||
              this.user.twilio_number ||
              this.user.onboard.sms_service) &&
            (this.user.onboard.dialer_checked ||
              this.user.dialer_info?.is_enabled) &&
            this.user.onboard.tour
          ) {
            if (localStorage.getItem('checklist') == 'start') {
              localStorage.setItem('checklist', 'done');
            }
            localStorage.setItem('checklist_state', 'end');
            if (!this.user.onboard.complete) {
              if (!this.congratModal) {
                this.congratModal = this.dialog.open(UserflowCongratComponent, {
                  position: { bottom: '55px', right: '100px' },
                  width: '100vw',
                  maxWidth: '380px',
                  disableClose: true,
                  panelClass: 'congrat-panel',
                  backdropClass: 'congrat-backdrop'
                });
                this.congratModal.afterClosed().subscribe(() => {
                  this.user.onboard.complete = true;
                  this.userService
                    .updateProfile({
                      onboard: this.user.onboard
                    })
                    .subscribe(() => {
                      this.userService.updateProfileImpl({
                        onboard: this.user.onboard
                      });
                    });
                  this.checkUpdate();
                });
              }
            } else {
              this.checkUpdate();
            }
          }
        }
      }
    );
  }

  setShowDialog($event): void {
    this.showDialog = $event;
  }

  closeOverlay(): void {
    this.isOverlay = false;
  }

  showDownload(): void {
    this.isDownload = !this.isDownload;
  }
}
