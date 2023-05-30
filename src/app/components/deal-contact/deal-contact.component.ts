import { Component, Inject, OnInit } from '@angular/core';
import { Contact } from 'src/app/models/contact.model';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DealsService } from 'src/app/services/deals.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-deal-contact',
  templateUrl: './deal-contact.component.html',
  styleUrls: ['./deal-contact.component.scss']
})
export class DealContactComponent implements OnInit {
  contacts: Contact[] = [];
  saving = false;
  submitted = false;
  saveSubscription: Subscription;
  exceedContacts: Contact[] = [];
  availableCount = 10;

  constructor(
    private dialogRef: MatDialogRef<DealContactComponent>,
    private dealService: DealsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (!this.data || !this.data.deal) {
      this.dialogRef.close();
    }
    if (this.data && this.data.exceedContacts) {
      this.exceedContacts = this.data.exceedContacts;
      this.availableCount = this.availableCount - this.exceedContacts.length;
    }
  }

  ngOnInit(): void {}

  addContacts(): void {
    if (!this.contacts.length) {
      return;
    }
    const contactIds = [];
    this.contacts.forEach((e) => {
      contactIds.push(e._id);
    });
    this.saving = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();
    this.saveSubscription = this.dealService
      .updateContact(this.data.deal, 'add', contactIds)
      .subscribe((status) => {
        this.saving = false;
        if (status) {
          this.dialogRef.close({ data: this.contacts, ids: contactIds });
        }
      });
  }
}
