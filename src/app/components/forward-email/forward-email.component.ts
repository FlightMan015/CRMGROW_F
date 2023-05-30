import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user.model';
import { UserService } from 'src/app/services/user.service';
import { VerifyCodeConfirmComponent } from '../verify-code-confirm/verify-code-confirm.component';

@Component({
  selector: 'app-forward-email',
  templateUrl: './forward-email.component.html',
  styleUrls: ['./forward-email.component.scss']
})
export class ForwardEmailComponent implements OnInit {
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

  menuItems = [
    { id: 'smtp', label: 'SMTP Server', icon: 'i-server' },
    { id: 'email', label: 'Sender Email', icon: 'i-alt-email' },
    { id: 'daily', label: 'Daily Limit', icon: 'i-sand-timer' }
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

  host = 'other';
  constructor(
    private dialogRef: MatDialogRef<ForwardEmailComponent>,
    private userService: UserService,
    private dialog: MatDialog,
    private toast: ToastrService
  ) {
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      if (res && res._id) {
        this.currentUser = res;
        this.isSMTPVerified = this.currentUser.smtp_verified || false;
        this.isSMTPConnected = this.currentUser.smtp_connected || false;

        if (this.isSMTPConnected && !this.isSMTPVerified) {
          this.currentTab = 'email';
        }
      }
    });
  }

  ngOnInit(): void {
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
        this.dailyLimit = this.currentUser.email_info.max_count || 400;
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
          let data;
          if (!this.currentUser.onboard.connect_email) {
            this.currentUser.onboard.connect_email = true;
            data = {
              primary_connected: true,
              connected_email_type: 'smtp',
              connected_email: this.senderEmail,
              smtp_verified: true,
              onboard: this.currentUser.onboard
            };
          } else {
            data = {
              primary_connected: true,
              connected_email_type: 'smtp',
              connected_email: this.senderEmail,
              smtp_verified: true
            };
          }
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
        }
      });
  }

  setDailyLimit(): void {
    const data = {
      smtp_info: {
        ...this.smtp_info,
        daily_limit: this.dailyLimit / 2
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
    this.updateProfileSubscription &&
      this.updateProfileSubscription.unsubscribe();
    let data1;
    if (this.currentUser.smtp_connected && this.currentUser.smtp_verified) {
      if (!this.currentUser.onboard.connect_email) {
        this.currentUser.onboard.connect_email = true;
        data1 = {
          email_info: {
            ...this.currentUser.email_info,
            max_count: this.dailyLimit
          },
          primary_connected: true,
          connected_email_type: 'smtp',
          connected_email: this.senderEmail,
          onboard: this.currentUser.onboard
        };
      } else {
        data1 = {
          email_info: {
            ...this.currentUser.email_info,
            max_count: this.dailyLimit
          },
          primary_connected: true,
          connected_email_type: 'smtp',
          connected_email: this.senderEmail
        };
      }
    } else {
      data1 = {
        email_info: {
          ...this.currentUser.email_info,
          max_count: this.dailyLimit
        }
      };
    }
    this.updateProfileSubscription = this.userService
      .updateProfile(data1)
      .subscribe(() => {
        this.userService.updateProfileImpl(data1);
        this.dialogRef.close();
      });
  }

  changeMenu(id: string): void {
    this.currentTab = id;
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
  }
}
