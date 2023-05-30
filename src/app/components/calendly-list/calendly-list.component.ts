import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConnectService } from '../../services/connect.service';
import { UserService } from 'src/app/services/user.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Garbage } from 'src/app/models/garbage.model';

@Component({
  selector: 'app-calendly-list',
  templateUrl: './calendly-list.component.html',
  styleUrls: ['./calendly-list.component.scss']
})
export class CalendlyListComponent implements OnInit {
  loading = false;
  calendlyList = [];
  calendlyKey = '';
  garbageSubscription: Subscription;
  garbage: Garbage = new Garbage();

  constructor(
    private dialogRef: MatDialogRef<CalendlyListComponent>,
    private userService: UserService,
    private connectService: ConnectService,
    private toast: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.calendlyKey = this.data.key;
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = res;
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.connectService.getEvent().subscribe((res) => {
      if (res) {
        this.loading = false;
        this.calendlyList = [...this.calendlyList, ...res['data']];
        if (!this.calendlyKey) {
          this.calendlyList.forEach((calendly) => {
            calendly.selectStatus = false;
          });
        } else {
          this.calendlyList.forEach((calendly) => {
            if (calendly.id == this.calendlyKey) {
              calendly.selectStatus = true;
            } else {
              calendly.selectStatus = false;
            }
          });
        }
      }
    });
  }

  setEvent(index: number): void {
    const calendly = {
      link: this.calendlyList[index].attributes.url,
      id: this.calendlyList[index].id
    };
    this.connectService.setEvent(calendly).subscribe((res) => {
      if (res && res['status']) {
        this.garbage.calendly.link = this.calendlyList[index].attributes.url;
        this.garbage.calendly.id = this.calendlyList[index].id;
        // this.toast.success('Event is selected successfully.');
        this.userService.updateGarbageImpl(this.garbage);
        this.dialogRef.close();
      }
    });
  }
}
