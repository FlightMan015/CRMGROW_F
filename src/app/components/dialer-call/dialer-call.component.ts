import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { DialogSettings } from 'src/app/constants/variable.constants';
import { DialerService } from 'src/app/services/dialer.service';
import { UserService } from 'src/app/services/user.service';
import { CreateCallLabelComponent } from '../create-call-label/create-call-label.component';

@Component({
  selector: 'app-dialer-call',
  templateUrl: './dialer-call.component.html',
  styleUrls: ['./dialer-call.component.scss']
})
export class DialerCallComponent implements OnInit {
  log: any = {};
  saving = false;
  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<DialerCallComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private dialerService: DialerService,
    public userService: UserService
  ) {
    if (this.data && this.data.call) {
      this.log = { ...this.data.call };
    }
  }

  ngOnInit(): void {}

  update(): void {
    this.saving = true;
    this.dialerService.updateLog(this.log._id, this.log).subscribe((status) => {
      this.saving = false;
      if (status) {
        this.dialogRef.close({ status: true, data: this.log });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  openCallLabelManager(selector: MatSelect): void {
    selector.close();
    this.dialog
      .open(CreateCallLabelComponent, {
        ...DialogSettings.CONFIRM
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.label) {
          this.log.label = res.label;
        } else {
          selector.open();
        }
      });
  }
}
