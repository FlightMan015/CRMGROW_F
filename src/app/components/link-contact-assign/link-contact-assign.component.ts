import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  ViewChild,
  ElementRef
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { AutomationService } from 'src/app/services/automation.service';
import { ActivityService} from 'src/app/services/activity.service';
import { ToastrService } from 'ngx-toastr';
import { SelectContactComponent } from '../select-contact/select-contact.component';
import { ContactCreateComponent } from '../contact-create/contact-create.component';
import { DialogSettings } from '../../constants/variable.constants';
import { ContactService } from '../../services/contact.service';
import { Subscription } from 'rxjs';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-link-contact-assign',
  templateUrl: './link-contact-assign.component.html',
  styleUrls: ['./link-contact-assign.component.scss']
})
export class LinkContactAssignComponent implements OnInit, OnDestroy {
  selectedTrack: any;

  contacts: any[] = [];

  submitted = false;
  contactOverflow = false;
  loading = false;
  profileSubscription: Subscription;

  @ViewChild('contactSelector') contactSelector: SelectContactComponent;

  constructor(
    private dialogRef: MatDialogRef<LinkContactAssignComponent>,
    private automationService: AutomationService,
    private toastr: ToastrService,
    private activityService: ActivityService,
    private dialog: MatDialog,
    private contactService: ContactService,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.selectedTrack = this.data.track;
    }
  }

  ngOnDestroy(): void {}

  assignContact(): void {
    this.submitted = true;
    if (!this.selectedTrack || !this.contacts.length) {
      return;
    }
    this.loading = true;
    const track = this.selectedTrack;
    const contacts = [];
    this.contacts.forEach((e) => {
      contacts.push(e._id);
    });
    this.activityService.assignContact(track, contacts).subscribe(
      (res) => {
        this.loading = false;
        if (res) {
          this.dialogRef.close(res);
        }
      },
      (err) => {
        this.loading = false;
        this.dialogRef.close({ status: false });
      }
    );
  }

  addContacts(contact): any {
    this.contacts = [contact];
    this.contactSelector.clear();
  }

  removeContact(contact): void {
    const index = this.contacts.findIndex((item) => item._id === contact._id);
    if (index >= 0) {
      this.contacts.splice(index, 1);
      this.contactOverflow = false;
    }
  }
}
