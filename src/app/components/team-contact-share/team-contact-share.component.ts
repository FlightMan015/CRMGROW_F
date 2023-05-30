import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { TeamService } from '../../services/team.service';
import { UserService } from '../../services/user.service';
import { ContactService } from '../../services/contact.service';
import { SelectContactComponent } from '../select-contact/select-contact.component';

@Component({
  selector: 'app-team-contact-share',
  templateUrl: './team-contact-share.component.html',
  styleUrls: ['./team-contact-share.component.scss']
})
export class TeamContactShareComponent implements OnInit {
  team: any;
  members: any[] = [];
  contacts: any[] = [];
  member;

  submitted = false;
  contactOverflow = false;
  loading = false;
  userId;

  @ViewChild('contactSelector') contactSelector: SelectContactComponent;

  constructor(
    private dialogRef: MatDialogRef<TeamContactShareComponent>,
    private teamService: TeamService,
    private contactService: ContactService,
    private userService: UserService,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.team = this.data.team;
      this.userService.profile$.subscribe((res) => {
        if (res) {
          this.userId = res._id;
        }
      });

      const members = [];
      for (const owner of this.team.owner) {
        if (owner._id !== this.userId) {
          members.push(owner);
        }
      }
      for (const member of this.team.members) {
        if (member._id !== this.userId) {
          members.push(member);
        }
      }
      this.members = members;
    }
  }

  shareContacts(): void {
    this.submitted = true;
    if (!this.team || !this.contacts.length || !this.member) {
      return;
    }
    this.loading = true;
    const contacts = [];
    this.contacts.forEach((e) => {
      contacts.push(e._id);
    });

    this.contactService
      .shareContacts({
        team: this.team._id,
        user: this.member._id,
        contacts: contacts
      })
      .subscribe((res) => {
        this.loading = false;
        if (res) {
          if (res.status) {
            this.dialogRef.close({ data: res.data });
          } else {
            this.toastr.error(res.error, 'Share contacts to team', {
              timeOut: 3000
            });
            this.dialogRef.close();
          }
        }
      });
  }

  selectMember(member): any {
    if (member) {
      this.member = member;
    }
  }

  addContacts(contact): any {
    if (contact) {
      if (this.contacts.length === 15) {
        this.contactOverflow = true;
        return;
      } else if (contact && this.contacts.length < 15) {
        const index = this.contacts.findIndex(
          (item) => item._id === contact._id
        );
        if (index < 0) {
          this.contacts.push(contact);
        }
      }
    }
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
