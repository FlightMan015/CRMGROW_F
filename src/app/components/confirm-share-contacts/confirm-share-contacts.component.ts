import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ContactActivity } from 'src/app/models/contact.model';

@Component({
  selector: 'app-confirm-share-contacts',
  templateUrl: './confirm-share-contacts.component.html',
  styleUrls: ['./confirm-share-contacts.component.scss']
})
export class ConfirmShareContactsComponent implements OnInit {
  permissionContacts = [];
  runningContacts = [];
  constructor(
    private dialogRef: MatDialogRef<ConfirmShareContactsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    if (this.data && this.data.additional) {
      this.permissionContacts = [];
      this.runningContacts = [];
      (this.data.additional || []).forEach((e) => {
        if (e.error === 'Invalid permission') {
          this.permissionContacts.push(
            new ContactActivity().deserialize(e.contact)
          );
        }
        if (e.error === 'Running job') {
          this.runningContacts.push(
            new ContactActivity().deserialize(e.contact)
          );
        }
      });
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
