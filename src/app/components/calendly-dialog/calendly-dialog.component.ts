import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ConnectService } from '../../services/connect.service';
import { ToastrService } from 'ngx-toastr';
import { UserService } from 'src/app/services/user.service';
import { Subscription } from 'rxjs';
import { Garbage } from 'src/app/models/garbage.model';

@Component({
  selector: 'app-calendly-dialog',
  templateUrl: './calendly-dialog.component.html',
  styleUrls: ['./calendly-dialog.component.scss']
})
export class CalendlyDialogComponent implements OnInit {
  isConfirm = false;
  calendlyApiKey = '';
  garbageSubscription: Subscription;
  garbage: Garbage = new Garbage();

  constructor(
    private dialogRef: MatDialogRef<CalendlyDialogComponent>,
    private connectService: ConnectService,
    private toast: ToastrService,
    public userService: UserService
  ) {}

  ngOnInit(): void {}

  authCalendly(): void {
    if (this.calendlyApiKey == '') {
      return;
    }
    this.isConfirm = true;
    const token = { token: this.calendlyApiKey };
    this.connectService.connectCalendly(token).subscribe(
      (res) => {
        if (res && res['status']) {
          this.isConfirm = false;
          this.connectService.getEvent().subscribe((event) => {
            if (event && event['status']) {
              if (event['data'].length == 1) {
                const calendly = {
                  link: event['data'][0].attributes.url,
                  id: event['data'][0].id
                };
                this.connectService.setEvent(calendly).subscribe((calendly) => {
                  if (calendly && calendly['status']) {
                    this.garbage.calendly.link =
                      event['data'][0].attributes.url;
                    this.garbage.calendly.id = event['data'][0].id;
                    this.userService.updateGarbageImpl(this.garbage);
                  }
                });
              }
              const data = {
                email: res['data'].calendly.email,
                token: res['data'].calendly.token,
                length: event['data'].length
              };
              // this.toast.success('Calendly connected successfully');
              this.dialogRef.close(data);
            }
          });
        }
      },
      (err) => {
        this.isConfirm = false;
        if (err.status === 400) {
          this.toast.error('Please check your calendly api key.');
        }
      }
    );
  }
}
