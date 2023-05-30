import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { VerifyCodeConfirmComponent } from '../../components/verify-code-confirm/verify-code-confirm.component';
import { ToastrService } from 'ngx-toastr';
import { User } from '../../models/user.model';
import { NgForm } from '@angular/forms';
import { HOURS } from 'src/app/constants/variable.constants';

@Component({
  selector: 'app-campaign-smtp',
  templateUrl: './campaign-smtp.component.html',
  styleUrls: ['./campaign-smtp.component.scss']
})
export class CampaignSmtpComponent implements OnInit {
  loading = false;
  smtp_info;
  senderEmail = '';
  senderName = '';
  smtpHost = '';
  smtpPort = '';
  password = '';
  enableSSL = true;

  isSMTPConnected = false;
  isSMTPVerified = false;
  isEdit = false;
  isEditEmail = false;
  currentUser: User;
  dailyLimit = 0;
  campaignLimit = 0;

  menuItems = [
    { id: 'smtp', label: 'SMTP Server', icon: 'i-server' },
    { id: 'email', label: 'Sender Email', icon: 'i-alt-email' },
    { id: 'daily', label: 'Daily Limit', icon: 'i-sand-timer' },
    { id: 'hours', label: 'Business Hours', icon: 'i-timer' }
  ];
  currentTab = 'smtp';

  profileSubscription: Subscription;
  connectSubscription: Subscription;
  verifySubscription: Subscription;
  updateDailyLimitSubscription: Subscription;
  updateProfileSubscription: Subscription;

  isConnecting = false;
  isVerifying = false;
  isUpdating = false;

  host = 'other'; // gmail, outlook, office, other

  start_time = '09:00:00.000';
  end_time = '17:00:00.000';
  times = HOURS;
  startIndex = 0;

  @Output() onConnect = new EventEmitter();
  @Output() onNewConnect = new EventEmitter();

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.initSetting();
  }

  initSetting() {
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      if (res && res._id) {
        this.currentUser = res;
        this.isSMTPVerified = this.currentUser.smtp_verified || false;
        this.isSMTPConnected = this.currentUser.smtp_connected || false;

        if (this.isSMTPConnected && !this.isSMTPVerified) {
          this.currentTab = 'email';
        }

        if (res?.email_info?.max_count) {
          if (this.smtp_info?.daily_limit) {
            this.dailyLimit =
              this.smtp_info.daily_limit + res.email_info.max_count;
          } else {
            this.dailyLimit = res.email_info.max_count;
          }
        }
      }
    });
    this.userService.garbage$.subscribe((res) => {
      if (res && res.smtp_info) {
        const smtp_info = res.smtp_info;
        this.smtp_info = smtp_info;
        this.smtpHost = smtp_info.host;
        this.smtpPort = smtp_info.port + '';
        this.enableSSL = smtp_info.secure;
        this.senderName = smtp_info.user;
        this.senderEmail = smtp_info.email;
        this.password = smtp_info.pass;
        if (smtp_info.daily_limit) {
          if (this.currentUser?.email_info?.max_count) {
            this.dailyLimit =
              smtp_info.daily_limit + this.currentUser.email_info.max_count;
          } else {
            this.dailyLimit = smtp_info.daily_limit;
          }
          this.campaignLimit = smtp_info.daily_limit;
        }
        if (smtp_info.start_time) {
          this.start_time = smtp_info.start_time;
          this.changeStart();
        }
        if (smtp_info.end_time) this.end_time = smtp_info.end_time;
      }
    });
  }

  connectSMTP(): void {
    if (this.host != 'other') {
      return;
    }
    const data = {
      host: this.smtpHost,
      port: this.smtpPort,
      user: this.senderName,
      pass: this.password,
      secure: this.enableSSL
    };
    this.isConnecting = true;
    this.connectSubscription && this.connectSubscription.unsubscribe();
    this.connectSubscription = this.userService
      .connectSMTP(data)
      .subscribe((res) => {
        this.isConnecting = false;
        if (res && res.status) {
          this.smtp_info = { ...data, email: '' };
          this.userService.updateProfileImpl({
            smtp_connected: true,
            smtp_verified: false
          });
          this.isEdit = false;
          this.userService.updateGarbageImpl({ smtp_info: this.smtp_info });
          this.onNewConnect.next();
          this.currentTab = 'email';
        }
      });
  }

  setEnableSSL(): void {
    this.enableSSL = !this.enableSSL;
  }

  edit(form: NgForm): void {
    form.resetForm();
    this.isEdit = true;
  }
  cancel(): void {
    const smtp_info = this.smtp_info;
    this.smtpHost = smtp_info.host;
    this.smtpPort = smtp_info.port + '';
    this.enableSSL = smtp_info.secure;
    this.senderName = smtp_info.user;
    this.senderEmail = smtp_info.email;
    this.password = smtp_info.pass;
    this.isEdit = false;
  }
  editEmail(): void {
    this.isEditEmail = true;
  }
  cancelEditEmail(): void {
    this.senderEmail = this.smtp_info?.email;
    this.isEditEmail = false;
  }

  verifyEmail(): void {
    if (!this.senderEmail) {
      return;
    }
    const data = {
      email: this.senderEmail
    };
    this.isVerifying = true;
    this.verifySubscription && this.verifySubscription.unsubscribe();
    this.verifySubscription = this.userService
      .verifySMTP(data)
      .subscribe((res) => {
        this.isVerifying = false;
        if (res && res.status) {
          this.smtp_info = { ...res.data, verification_code: '' };
          this.userService.updateGarbageImpl({
            smtp_verified: false,
            smtp_info: this.smtp_info
          });
          this.isSMTPVerified = false;
          this.verifyCode();
        }
      });
  }

  verifyCode(): void {
    console.log('verify code');
    this.dialog
      .open(VerifyCodeConfirmComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          email: this.currentUser.email
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result && result.status) {
          // this.toast.success('Your SMTP connection is verified successfully.');
          const data = {
            primary_connected: true,
            connected_email_type: 'smtp',
            connected_email: this.senderEmail,
            smtp_verified: true
          };
          this.updateProfileSubscription &&
            this.updateProfileSubscription.unsubscribe();
          this.updateProfileSubscription = this.userService
            .updateProfile(data)
            .subscribe(() => {
              this.userService.updateProfileImpl(data);
            });
          this.smtp_info.verification_code = result.code;
          this.senderEmail = this.smtp_info.email;
          this.isEditEmail = false;
          this.currentTab = 'daily';
          this.onConnect.next();
        }
      });
  }

  setDailyLimit(): void {
    const data = {
      smtp_info: {
        ...this.smtp_info,
        daily_limit: this.campaignLimit
      }
    };
    this.isUpdating = true;
    this.updateDailyLimitSubscription &&
      this.updateDailyLimitSubscription.unsubscribe();
    this.updateDailyLimitSubscription = this.userService
      .updateGarbage(data)
      .subscribe(() => {
        this.isUpdating = false;
        // this.toast.success('Daily Limit successfully updated.');
        this.userService.updateGarbageImpl(data);
      });

    let data1;
    if (this.currentUser.smtp_connected && this.currentUser.smtp_verified) {
      data1 = {
        email_info: {
          ...this.currentUser.email_info,
          max_count: this.dailyLimit - this.campaignLimit
        },
        primary_connected: true,
        connected_email_type: 'smtp',
        connected_email: this.senderEmail
      };
    } else {
      data1 = {
        email_info: {
          ...this.currentUser.email_info,
          max_count: this.dailyLimit
        }
      };
    }
    this.updateProfileSubscription &&
      this.updateProfileSubscription.unsubscribe();
    this.updateProfileSubscription = this.userService
      .updateProfile(data1)
      .subscribe(() => {
        this.userService.updateProfileImpl(data1);
      });
  }

  changeMenu(id: string): void {
    this.currentTab = id;
    this.initSetting();
  }

  checkHostName(event: string): void {
    const host = (event || '').trim();
    switch (host) {
      case 'smtp.gmail.com':
        this.host = 'gmail';
        break;
      case 'smtp.office365.com':
        this.host = 'office';
        break;
      case 'smtp-mail.outlook.com':
        this.host = 'outlook';
        break;
      default:
        this.host = 'other';
    }
    console.log('this.host', this.host);
  }

  setSetting(): void {
    if (!this.validBusinessHours()) {
      return;
    }
    const data = {
      ...this.smtp_info,
      start_time: this.start_time,
      end_time: this.end_time
    };
    this.isUpdating = true;
    this.userService.updateGarbage({ smtp_info: data }).subscribe(() => {
      this.isUpdating = false;
      // this.toast.success('Calendar working hours successfully updated.');
      this.userService.updateGarbageImpl({
        smtp_info: data
      });
    });
  }
  changeStart(): void {
    this.startIndex = this.times.findIndex((e) => e.id == this.start_time);
  }
  validBusinessHours(): boolean {
    const start = this.times.findIndex((e) => e.id == this.start_time);
    const end = this.times.findIndex((e) => e.id == this.end_time);
    return start < end;
  }

  changeCampaignLimit(event) {
    this.campaignLimit = event.value;
  }
  changeDailyLimit() {
    if (this.campaignLimit > this.dailyLimit) {
      this.campaignLimit = this.dailyLimit / 2;
    }
  }
}
