import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { Subscription } from 'rxjs';
import { DialogSettings } from 'src/app/constants/variable.constants';
import { DialerService } from 'src/app/services/dialer.service';
import { UserService } from 'src/app/services/user.service';
import { CreateCallLabelComponent } from '../create-call-label/create-call-label.component';

@Component({
  selector: 'app-dialer-log',
  templateUrl: './dialer-log.component.html',
  styleUrls: ['./dialer-log.component.scss']
})
export class DialerLogComponent implements OnInit, AfterViewInit {
  contacts: any = {};
  history: any[] = [];
  historyLoadSubscription: Subscription;
  logs: any = {};
  ratings: any = {};
  labels: any = {};
  saving = false;
  constructor(
    private dialogRef: MatDialogRef<DialerLogComponent>,
    public dialerService: DialerService,
    public userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (this.data.contacts && this.data.contacts.length) {
      this.data.contacts.forEach((e) => {
        this.contacts[e.contactId] = e.name;
      });
    }
    this.historyLoadSubscription = this.dialerService.history$.subscribe(
      (res) => {
        this.history = res;
        this.history.forEach((e) => {
          if (e.outcome === 'VOICEMAIL') {
            this.labels[e.contactId] = 'Voice Message';
          } else if (e.outcome === 'CALLBACK') {
            this.labels[e.contactId] = 'Callback Set';
          } else if (e.answered) {
            this.labels[e.contactId] = 'Interested';
          } else {
            this.labels[e.contactId] = 'No Answer';
          }
        });
        if (!this.history.length) {
          this.dialogRef.close({ continue: true, data: [] });
        }
      }
    );
  }

  ngAfterViewInit(): void {
    this.historyLoadSubscription && this.historyLoadSubscription.unsubscribe();
  }

  update(isContinue: boolean = true): void {
    this.saving = true;
    const data = [];
    this.history.forEach((e) => {
      data.push({
        ...e,
        content: this.logs[e.contactId],
        rating: this.ratings[e.contactId],
        label: this.labels[e.contactId],
        deal: this.data.deal,
        uuid: this.data.uuid
      });
    });
    this.dialerService.register(data).subscribe((res) => {
      this.saving = false;
      this.dialogRef.close({ continue: true, data });
    });
  }

  close(): void {
    this.dialogRef.close({ continue: false, data: this.history });
  }

  openCallLabelManager(contact: any, selector: MatSelect): void {
    selector.close();
    this.dialog
      .open(CreateCallLabelComponent, {
        ...DialogSettings.CONFIRM
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.label) {
          this.labels[contact.contactId] = res.label;
        } else {
          selector.open();
        }
      });
  }
}
