import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationService } from 'src/app/services/notification.service';
import { UserService } from 'src/app/services/user.service';
import { DialerService } from 'src/app/services/dialer.service';

@Component({
  selector: 'app-dialer-report',
  templateUrl: './dialer-report.component.html',
  styleUrls: ['./dialer-report.component.scss']
})
export class DialerReportComponent implements OnInit {
  dialCallNote = '';
  dialCallStatus = '';
  contacts = {};
  saving = false;
  constructor(
    private userService: UserService,
    private notificationService: NotificationService,
    private dialerService: DialerService,
    private dialogRef: MatDialogRef<DialerReportComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    if (this.data.contacts && this.data.contacts.length) {
      this.data.contacts.forEach((e) => {
        this.contacts[e.contactId] = e.name;
      });
    }
  }

  close(): void {
    const details = [];
    const contacts = [];
    this.data.reports.forEach((e) => {
      const detail = { ...e, name: this.contacts[e.contactId] };
      contacts.push(e.contactId);
      details.push(detail);
    });
    const user = this.userService.profile.getValue();
    const userId = user._id;
    if (this.data.deal) {
      // Deal Activity & Notification Register
      if (!this.dialCallNote) {
        return;
      } else {
        const notification = {
          user: userId, //user information
          type: 'personal',
          criteria: 'dialer_call',
          detail: {
            data: details,
            content: this.dialCallNote,
            status: this.dialCallStatus
          },
          contact: contacts,
          deal: this.data.deal,
          content: this.dialCallNote,
          status: this.dialCallStatus,
          uuid: this.data.uuid
        };
        this.saving = true;
        this.dialerService.saveDealDialer(notification).subscribe((res) => {
          this.saving = false;
          if (res && res.status) {
            this.dialogRef.close({ data: res.data });
          }
        });
      }
    } else {
      const notification = {
        user: userId, //user information
        type: 'personal',
        criteria: 'dialer_call',
        detail: { data: details },
        contact: contacts
      };
      this.saving = true;
      this.notificationService.create(notification).subscribe((res) => {
        this.saving = false;
        if (res && res.status) {
          this.dialogRef.close({ data: res.data });
        }
      });
    }
  }
}
