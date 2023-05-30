import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ContactDetail } from 'src/app/models/contact.model';
import { LabelService } from 'src/app/services/label.service';
import * as _ from 'lodash';
import { ContactService } from '../../services/contact.service';
import { Label } from 'src/app/models/label.model';

@Component({
  selector: 'app-contact-merge',
  templateUrl: './contact-merge.component.html',
  styleUrls: ['./contact-merge.component.scss']
})
export class ContactMergeComponent implements OnInit {
  saving = false;
  sourceContact: ContactDetail = new ContactDetail();
  mergeContact: ContactDetail = new ContactDetail();
  previewContact = {};
  collection = {};
  emails = [];
  phones = [];

  columns = [
    'first_name',
    'last_name',
    'label',
    'address',
    'website',
    'country',
    'city',
    'state',
    'zip',
    'brokerage',
    'source',
    'tags'
  ];

  activity = 'Keep primary';
  followup = 'Both';
  automation = 'Keep primary';
  notes = 'Both';
  label: Label = new Label();

  mergeActions = [
    { label: 'Both', value: 'both' },
    { label: 'Keep primary', value: 'primary' },
    { label: 'Remove', value: 'remove' }
  ];

  automationMergeActions = [
    { label: 'Keep primary', value: 'primary' },
    { label: 'Remove', value: 'remove' }
  ];

  constructor(
    private dialogRef: MatDialogRef<ContactMergeComponent>,
    private labelService: LabelService,
    private contactService: ContactService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.contact) {
      this.sourceContact = this.data.contact;
    }
  }

  ngOnInit(): void {
    this.initContact();
  }

  initContact(): void {
    this.previewContact = {
      ...this.sourceContact
    };
    this.collection = {};

    for (const column of this.columns) {
      if (this.sourceContact[column]) {
        if (column !== 'tags') {
          this.collection[column] = [this.sourceContact[column]];
        } else {
          this.collection[column] = [...this.sourceContact[column]];
        }
      }
    }

    if (this.sourceContact['email']) {
      this.emails.push(this.sourceContact['email']);
    }
    if (this.sourceContact['secondary_email']) {
      this.emails.push(this.sourceContact['secondary_email']);
    }
    if (this.sourceContact['cell_phone']) {
      this.phones.push(this.sourceContact['cell_phone']);
    }
    if (this.sourceContact['secondary_phone']) {
      this.phones.push(this.sourceContact['secondary_phone']);
    }

    if (this.emails.length > 0) {
      this.previewContact['primary_email'] = this.emails[0];
      if (this.emails.length > 1) {
        this.previewContact['secondary_email'] = this.emails[1];
      }
    }
    if (this.phones.length > 0) {
      this.previewContact['primary_phone'] = this.phones[0];
      if (this.phones.length > 1) {
        this.previewContact['secondary_phone'] = this.phones[1];
      }
    }
  }

  isExistMergeContact(): any {
    return this.mergeContact && this.mergeContact._id;
  }

  addContacts(contact: any): void {
    this.emails = [];
    this.phones = [];
    this.initContact();
    this.mergeContact = new ContactDetail();

    if (!contact) {
      return;
    }

    this.mergeContact = contact;
    for (const column of this.columns) {
      if (this.mergeContact[column]) {
        if (this.collection[column]) {
          if (column !== 'tags') {
            if (
              this.collection[column].indexOf(this.mergeContact[column]) < 0
            ) {
              this.collection[column].push(this.mergeContact[column]);
            }
          } else {
            for (const tag of this.mergeContact[column]) {
              if (this.collection[column].indexOf(tag) < 0) {
                this.collection[column].push(tag);
              }
            }
            this.previewContact[column] = [...this.collection[column]];
          }
        } else {
          if (column !== 'tags') {
            this.collection[column] = [this.mergeContact[column]];
            this.previewContact[column] =
              this.collection[column].length > 0
                ? this.collection[column][0]
                : null;
          } else {
            this.collection[column] = [...this.mergeContact[column]];
            this.previewContact[column] = [...this.collection[column]];
          }
        }
      }
    }

    if (this.mergeContact['email']) {
      this.emails.push(this.mergeContact['email']);
    }
    if (this.mergeContact['secondary_email']) {
      this.emails.push(this.mergeContact['secondary_email']);
    }
    if (this.mergeContact['cell_phone']) {
      this.phones.push(this.mergeContact['cell_phone']);
    }
    if (this.mergeContact['secondary_phone']) {
      this.phones.push(this.mergeContact['secondary_phone']);
    }

    if (!this.previewContact['primary_email'] && this.emails.length > 0) {
      this.previewContact['primary_email'] = this.emails[0];
    }
    if (!this.previewContact['secondary_email'] && this.emails.length > 1) {
      this.previewContact['secondary_email'] = this.emails[1];
    }
    if (!this.previewContact['primary_phone'] && this.phones.length > 0) {
      this.previewContact['primary_phone'] = this.phones[0];
    }
    if (!this.previewContact['secondary_phone'] && this.phones.length > 1) {
      this.previewContact['secondary_phone'] = this.phones[1];
    }
  }

  submit(): void {
    if (!this.mergeContact._id) {
      return;
    }
    this.saving = true;
    const activityIndex = this.mergeActions.findIndex(
      (item) => item.label === this.activity
    );
    const followupIndex = this.mergeActions.findIndex(
      (item) => item.label === this.followup
    );
    const automationIndex = this.automationMergeActions.findIndex(
      (item) => item.label === this.automation
    );
    const notesIndex = this.mergeActions.findIndex(
      (item) => item.label === this.notes
    );

    const data = {
      primary_contact: this.sourceContact._id,
      secondary_contact: this.mergeContact._id,
      activity_merge: this.mergeActions[activityIndex].value,
      followup_merge: this.mergeActions[followupIndex].value,
      automation_merge: this.automationMergeActions[automationIndex].value,
      notes_merge: this.mergeActions[notesIndex].value,
      ...this.previewContact,
      cell_phone: this.previewContact['primary_phone'],
      email: this.previewContact['primary_email']
    };
    this.contactService.mergeContacts(data).subscribe((res) => {
      this.saving = false;
      if (res) {
        this.dialogRef.close(true);
      }
    });
  }
}
