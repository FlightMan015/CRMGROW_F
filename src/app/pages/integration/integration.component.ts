import { Component, ElementRef, NgZone, OnInit } from '@angular/core';
import { User } from 'src/app/models/user.model';
import { UserService } from 'src/app/services/user.service';
import { ToastrService } from 'ngx-toastr';
import { ConnectService } from '../../services/connect.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ZapierDialogComponent } from 'src/app/components/zapier-dialog/zapier-dialog.component';
import { CalendlyDialogComponent } from 'src/app/components/calendly-dialog/calendly-dialog.component';
import { Garbage } from 'src/app/models/garbage.model';
import { CalendlyListComponent } from 'src/app/components/calendly-list/calendly-list.component';
import * as _ from 'lodash';
import * as Storm from '@wavv/dialer';
import { DialPlanComponent } from 'src/app/components/dial-plan/dial-plan.component';
import { getUserLevel } from '../../utils/functions';
import { ActionImpossibleNotificationComponent } from 'src/app/components/action-impossible-notification/action-impossible-notification.component';
import { ForwardEmailComponent } from 'src/app/components/forward-email/forward-email.component';
import userflow from 'userflow.js';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-integration',
  templateUrl: './integration.component.html',
  styleUrls: ['./integration.component.scss']
})
export class IntegrationComponent implements OnInit {
  isLoading = false;
  isCopied = false;
  isRegenerated = false;
  user: User = new User();
  connectingMail = '';
  connectingCalendar = '';
  garbage: Garbage = new Garbage();

  googleCalendars = [];
  outlookCalendars = [];

  calendlyLength = 0;

  profileSubscription: Subscription;
  garbageSubscription: Subscription;
  updateGarbageSubscription: Subscription;
  updateProfileSubscription: Subscription;
  isPackageCalendar = true;

  callingBuy = false;
  zoomEnableAccount = [
    'super@crmgrow.com',
    'matt@crmgrow.com',
    'huyam@crmgrow.com'
  ];

  constructor(
    private userService: UserService,
    private toast: ToastrService,
    private notificationService: NotificationService,
    private connectService: ConnectService,
    private dialog: MatDialog,
    private router: Router,
    private myElement: ElementRef,
    private ngZone: NgZone
  ) {
    this.isLoading = true;
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.user = profile;
          if (
            !this.user.primary_connected &&
            !this.user.onboard.connect_email &&
            this.user.user_version >= 2.1
          ) {
            userflow.start('6b9783a0-a926-4ee0-9fdc-8236e213cbfd');
          }
          if (
            (this.user.primary_connected || this.user.onboard.connect_email) &&
            !this.user.onboard.connect_calendar &&
            !this.user.calendar_list.length &&
            this.user.user_version >= 2.1
          ) {
            this.autoScroll('calendar');
            userflow.start('fd15f470-b7fd-4052-8f15-9d1b47448604');
          }
          if (
            (this.user.primary_connected || this.user.onboard.connect_email) &&
            (this.user.onboard.connect_calendar ||
              this.user.calendar_list.length) &&
            !this.user.onboard.dialer_checked &&
            this.user.user_version >= 2.1
          ) {
            this.autoScroll('dialer');
            userflow.start('7c7f4939-5815-4eca-8c43-ec12bb155da4');
          }
          this.isLoading = false;
          this.isPackageCalendar = profile.calendar_info?.is_enabled;
          if (this.user.calendar_list) {
            this.googleCalendars = this.user.calendar_list.filter((e) => {
              if (e.connected_calendar_type === 'google') {
                return true;
              }
            });
            this.outlookCalendars = this.user.calendar_list.filter((e) => {
              return e.connected_calendar_type === 'outlook';
            });
          }
        }
      }
    );
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = res;
      if (this.garbage.calendly) {
        this.connectService.getEvent().subscribe((res) => {
          if (res && res['status']) {
            this.calendlyLength = res['data'].length;
          }
        });
      }
      if (this.garbage.access_token == '') {
        this.connectService.getToken().subscribe((res) => {
          if (res['status'] == true) {
            this.garbage.access_token = res['token'];
          }
        });
      }
    });
  }

  ngOnInit(): void {
    userflow.setCustomNavigate((url) => {
      if (url) {
        this.ngZone.run(() => {
          if (url == 'calendar' || url == 'dialer') {
            this.router.navigate(['/settings/integration']);
            this.autoScroll(url);
          } else if (url == 'dialer_check') {
            if (!this.user.onboard.dialer_checked) {
              this.user.onboard.dialer_checked = true;
              this.userService
                .updateProfile({ onboard: this.user.onboard })
                .subscribe(() => {
                  this.userService.updateProfileImpl({
                    onboard: this.user.onboard
                  });
                  if (!this.user.onboard.tour) {
                    userflow.start('980d9c77-ba14-4a2f-9391-99ff38c9c36c');
                  }
                });
            }
          } else {
            this.router.navigate([url]);
          }
        });
      }
    });
    Storm.addOverlayVisibleListener((res) => {
      if (!res.visible) {
        if (!this.user.onboard.tour && this.user.user_version >= 2.1) {
          userflow.start('980d9c77-ba14-4a2f-9391-99ff38c9c36c');
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
  }

  /**
   * Pre-handler to connect email service. If current connected is smtp, check the current active tasks with mass contacts.
   * @param type: string (google | outlook | smtp)
   */
  connectMail(type: string): void {
    // if current connected email is smtp, please check the mass task is running.
    if (
      this.user.connected_email_type === 'smtp' &&
      this.user.primary_connected
    ) {
      this.notificationService.loadMassTasks().subscribe((_tasks) => {
        if (_tasks?.length) {
          // Error Alert showing
          const details = [];
          _tasks.forEach((e, index) => {
            const detail = {};
            detail['title'] = e.action?.subject || 'TO-DO Task ' + index;
            if (e.process) {
              detail['link'] = '/email-queue/' + e.process;
            } else {
              detail['link'] = '/to-do';
            }
            detail['type'] = 'Task';
            details.push(detail);
          });
          this.dialog.open(ActionImpossibleNotificationComponent, {
            width: '96%',
            maxWidth: '480px',
            data: {
              title: 'Can not change your primary email',
              message:
                'You can not change your primary email service because there are some active tasks that should send the emails at once. Please check following tasks. Please wait for the completion of them or remove those.',
              details
            }
          });
        } else {
          this.connectMailImpl(type);
        }
      });
    } else {
      this.connectMailImpl(type);
    }
  }

  /**
   * Main handler to connect email service
   * @param type: string (google | outlook | smtp)
   */
  connectMailImpl(type: string): void {
    if (type == 'gmail' || type == 'outlook') {
      this.connectingMail = type;
      this.userService.requestSyncUrl(type).subscribe(
        (res) => {
          if (res['status']) {
            location.href = res['data'];
          }
          this.connectingMail = '';
        },
        (err) => {
          this.connectingMail = '';
          this.showError('Request authorization url Error is happened.');
        }
      );
    } else if (type == 'smtp') {
      this.dialog.open(ForwardEmailComponent, {
        width: '100vw',
        maxWidth: '600px',
        disableClose: true
      });
    } else {
      this.showError(
        'We are improving with the platform with this email Services. So please use another service while we are developing.'
      );
    }
  }

  disconnectMail(type: string): void {
    this.userService.disconnectMail().subscribe((res) => {
      if (res.status) {
        this.user.primary_connected = false;
        this.user.connected_email_type = '';
        this.user.connected_email = '';
        if (type == 'smtp') {
          const data = {
            smtp_verified: false,
            smtp_connected: false
          };
          this.updateProfileSubscription &&
            this.updateProfileSubscription.unsubscribe();
          this.updateProfileSubscription = this.userService
            .updateProfile(data)
            .subscribe(() => {
              this.userService.updateProfileImpl(data);
            });
          delete this.garbage['smtp_info'];
          this.updateGarbageSubscription &&
            this.updateGarbageSubscription.unsubscribe();
          this.updateGarbageSubscription = this.userService
            .updateGarbage(this.garbage)
            .subscribe(() => {
              this.userService.updateGarbageImpl(this.garbage);
            });
        }
        const data = {
          primary_connected: this.user.primary_connected,
          connected_email_type: this.user.connected_email_type,
          connected_email: this.user.connected_email
        };
        this.userService.updateProfileImpl(data);
        // this.toast.success('Email is disconnected successfully.');
      }
    });
  }

  connectCalendar(type: string): void {
    if (type == 'gmail' || type == 'outlook') {
      this.connectingCalendar = type;
      this.userService.requestCalendarSyncUrl(type).subscribe(
        (res) => {
          if (res && res['status']) {
            location.href = res['data'];
          }
          this.connectingCalendar = '';
        },
        (err) => {
          this.connectingCalendar = '';
          this.showError('Request authorization url Error is happened.');
        }
      );
    } else {
      this.showError(
        'We are improving with the platform with this calendar Services. So please use another service while we are developing.'
      );
    }
  }

  disconnectCalendar(email: string, type: string): void {
    this.userService.disconnectCalendar(email).subscribe((res) => {
      if (res && res['status']) {
        if (type == 'gmail') {
          const pos = _.findIndex(
            this.googleCalendars,
            (e) => e.connected_email == email
          );
          this.googleCalendars.splice(pos, 1);
          // this.toast.success(
          //   'Your Google Calendar is disconnected successfully.'
          // );
        } else {
          const pos = _.findIndex(
            this.outlookCalendars,
            (e) => e.connected_email == email
          );
          this.outlookCalendars.splice(pos, 1);
          // this.toast.success(
          //   'Your Outlook Calendar is disconnected successfully.'
          // );
        }
        const pos = _.findIndex(
          this.user.calendar_list,
          (e) => e.connect_email == email
        );
        this.user.calendar_list.splice(pos, 1);
        this.userService.updateProfileImpl({
          calendar_list: this.user.calendar_list
        });
      }
    });
  }

  connectZapier(): void {
    this.dialog.open(ZapierDialogComponent, {
      width: '100vw',
      maxWidth: '800px'
    });
  }

  copyKey(): void {
    const key = this.garbage?.access_token;
    const el = document.createElement('textarea');
    el.value = key;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    this.isCopied = true;
    this.toast.success('Copied the key to clipboard');
    setTimeout(() => {
      this.isCopied = false;
    }, 2000);
  }

  getToken(): void {
    this.isRegenerated = true;
    this.connectService.getToken().subscribe((res) => {
      if (res['status'] == true) {
        this.isRegenerated = false;
        this.garbage.access_token = res['token'];
        // this.toast.success('API Key regenerated successfully.');
      }
    });
  }

  connectCalendly(): void {
    this.dialog
      .open(CalendlyDialogComponent, {
        width: '100vw',
        maxWidth: '850px'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.userService
            .updateGarbage({ calendly: { email: res.email, token: res.token } })
            .subscribe(() => {
              this.userService.updateGarbageImpl({
                calendly: { email: res.email, token: res.token }
              });
            });
          this.calendlyLength = res.length;
        }
      });
  }

  selectCalendly(): void {
    this.dialog.open(CalendlyListComponent, {
      width: '100vw',
      maxWidth: '800px',
      data: {
        key: this.garbage.calendly?.id
      }
    });
  }

  disconnectCalendly(): void {
    this.connectService.disconnectCalendly().subscribe((res) => {
      if (res && res['status']) {
        delete this.garbage['calendly'];
        this.userService.updateGarbage(this.garbage).subscribe(() => {
          this.userService.updateGarbageImpl(this.garbage);
          // this.toast.success('Calendly disconnected successfully.');
        });
      }
    });
  }

  connectZoom(): void {
    this.userService.requestZoomSyncUrl().subscribe((res) => {
      if (res && res['status']) {
        location.href = res['data'];
      }
    });
  }

  buyDial(): void {
    // this.dialog.open(DialPlanComponent, {
    //   width: '100vw',
    //   maxWidth: '800px'
    // });
    this.callingBuy = true;
    Storm.purchaseDialer()
      .then(() => {
        this.callingBuy = false;
        console.log('Show the subscription modal');
      })
      .catch((err) => {
        this.callingBuy = false;
        console.log('error', err);
      });
    if (!this.user.onboard.dialer_checked) {
      this.user.onboard.dialer_checked = true;
      this.userService
        .updateProfile({ onboard: this.user.onboard })
        .subscribe(() => {
          this.userService.updateProfileImpl({
            onboard: this.user.onboard
          });
        });
    }
  }

  showError(msg: string): void {
    this.toast.error(msg);
  }

  autoScroll(type: string): void {
    if (type == 'calendar') {
      setTimeout(() => {
        const el = this.myElement.nativeElement.querySelector('#calendars');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('focus');
          setTimeout(() => {
            if (el) {
              el.classList.remove('focus');
            }
          }, 2000);
        }
      }, 2000);
    } else if (type == 'dialer') {
      setTimeout(() => {
        const el = this.myElement.nativeElement.querySelector('#others');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('focus');
          setTimeout(() => {
            if (el) {
              el.classList.remove('focus');
            }
          }, 2000);
        }
      }, 2000);
    }
  }

  disconnectZoom(): void {
    this.garbage.zoom.email = '';
    this.garbage.zoom.refresh_token = '';
    this.userService.updateGarbage(this.garbage).subscribe(() => {
      this.userService.updateGarbageImpl(this.garbage);
    });
  }
}
