import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { TeamService } from '../../services/team.service';
import { ContactService } from '../../services/contact.service';
import { UserService } from '../../services/user.service';
import { ConfirmShareContactsComponent } from 'src/app/components/confirm-share-contacts/confirm-share-contacts.component';
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-contact-share',
  templateUrl: './contact-share.component.html',
  styleUrls: ['./contact-share.component.scss']
})
export class ContactShareComponent implements OnInit {
  contacts = [];
  submitted = false;
  loading = false;
  userId;
  selectedTeam;
  members = [];
  selectedMember;
  step = 1;
  sharingOptions = [
    { id: 1, value: 'Transfer' },
    { id: 2, value: 'Share' },
    { id: 3, value: 'Clone' }
  ];
  selectedOption = this.sharingOptions[0].id;

  constructor(
    private dialogRef: MatDialogRef<ContactShareComponent>,
    private teamService: TeamService,
    private contactService: ContactService,
    private toastr: ToastrService,
    private userService: UserService,
    private changeDetectorRef: ChangeDetectorRef,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.contacts = this.data.contacts;
    }
    const profile = this.userService.profile.getValue();
    if (profile) {
      this.userId = profile._id;
    }
  }

  selectTeam($event): void {
    if ($event) {
      this.selectedTeam = $event;
      this.members = [];
      for (const owner of this.selectedTeam.owner) {
        this.members.push(owner);
      }
      for (const member of this.selectedTeam.members) {
        this.members.push(member);
      }

      // remove yourself from members.
      const index = this.members.findIndex((item) => item._id === this.userId);
      if (index >= 0) {
        this.members.splice(index, 1);
      }

      this.changeDetectorRef.detectChanges();
    } else {
      this.selectedTeam = null;
      this.members = [];
    }
  }

  selectMember($event): void {
    if ($event) {
      this.selectedMember = $event;
    } else {
      this.selectedMember = null;
    }
  }

  shareContact(): void {
    this.submitted = true;
    if (!this.selectedTeam || !this.selectedMember || !this.contacts.length) {
      return;
    }
    this.loading = true;
    const users = [this.selectedMember._id];
    if (this.selectedOption === 2) {
      users.push(this.userId);
    }

    this.contactService
      .shareContacts({
        team: this.selectedTeam._id,
        user: users,
        contacts: this.contacts.map((e) => e._id),
        type: this.selectedOption
      })
      .subscribe((res) => {
        this.loading = false;
        if (res) {
          if (res.status) {
            if (res.error?.length > 0) {
              this.dialog
                .open(ConfirmShareContactsComponent, {
                  minHeight: 360,
                  disableClose: true,
                  data: {
                    title: 'Transfer contacts',
                    additional: res.error,
                    message:
                      'You failed to transfer these following contacts. Please check the reasons.'
                  }
                })
                .afterClosed()
                .subscribe(() => {
                  if (res.error.length !== this.contacts.length) {
                    this.dialogRef.close({ data: res.data });
                  } else {
                    this.dialogRef.close();
                  }
                });
            } else {
              this.dialogRef.close({ data: res.data });
            }
            // this.toastr.success(
            //   `This contact is successfully shared to ${this.selectedMember.user_name} of ${this.selectedTeam.name}.`
            // );
          } else {
            this.toastr.error(res.error, 'Share contacts to team member', {
              timeOut: 3000
            });
            this.dialogRef.close();
          }
        }
      });
  }

  goToStep(step) {
    this.step = step;
  }
}
