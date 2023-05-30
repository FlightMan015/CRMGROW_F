import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PaymentCardComponent } from '../payment-card/payment-card.component';
import { UserService } from '../../services/user.service';
import { Contact } from '../../models/contact.model';
import { Subscription } from 'rxjs';
import { ContactService } from '../../services/contact.service';
import { saveAs } from 'file-saver';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-upgrade-plan-error',
  templateUrl: './upgrade-plan-error.component.html',
  styleUrls: ['./upgrade-plan-error.component.scss']
})
export class UpgradePlanErrorComponent implements OnInit {
  card = {
    card_name: '',
    number: '',
    cvc: '',
    exp_year: '',
    exp_month: '',
    card_brand: '',
    last4: '',
    plan_id: '',
    card_id: '',
    token: ''
  };
  isSaving = false;
  contacts: Contact[] = [];
  selectSubscription: Subscription;

  DOWNLOAD_STATUS = {
    DOWNLOADING: 'downloading',
    COMPLETED: 'completed',
    NOT_START: 'not_start'
  };

  downloadStatus = this.DOWNLOAD_STATUS.NOT_START;

  constructor(
    public dialogRef: MatDialogRef<UpgradePlanErrorComponent>,
    private router: Router,
    private dialog: MatDialog,
    private userService: UserService,
    public contactService: ContactService,
    private toast: ToastrService
  ) {
    this.userService.payment$.subscribe((res) => {
      if (res) {
        this.card = {
          ...res,
          number: res.last4
        };
      }
    });
  }

  ngOnInit(): void {
    this.selectSubscription && this.selectSubscription.unsubscribe();
    this.selectSubscription = this.contactService
      .selectAll()
      .subscribe((contacts) => {
        this.contacts = contacts;
      });
  }

  goToBilling(): void {
    // this.router.navigate([`/profile/billing`]);
    this.dialog
      .open(PaymentCardComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '550px',
        disableClose: true,
        data: {
          card: this.card
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.dialogRef.close();
        }
        if (res.status) {
          location.reload();
        }
      });
  }

  downloadCSV(): void {
    let contacts = [];
    let cnt = 0;
    this.isSaving = true;
    for (let i = 0; i < Math.ceil(this.contacts.length / 1000); i += 1) {
      const ids = [];
      this.contacts.forEach((e, index) => {
        if (
          index >= 1000 * i &&
          index <
            (1000 * (i + 1) < this.contacts.length
              ? 1000 * (i + 1)
              : this.contacts.length)
        ) {
          ids.push(e._id);
        }
      });
      if (ids.length > 0) {
        this.downloadStatus = this.DOWNLOAD_STATUS.DOWNLOADING;
        this.contactService.downloadCSV(ids).subscribe((data) => {
          data.forEach((e) => {
            const contact = {
              first_name: e.contact.first_name,
              last_name: e.contact.last_name,
              email: e.contact.email,
              phone: e.contact.cell_phone,
              source: e.contact.source,
              brokerage: e.contact.brokerage,
              city: e.contact.city,
              state: e.contact.state,
              zip: e.contact.zip,
              address: e.contact.address,
              secondary_email: e.contact.secondary_email,
              secondary_phone: e.contact.secondary_phone
            };
            const notes = [];
            if (e.note && e.note.length) {
              e.note.forEach((note) => {
                notes.push(note.content);
              });
            }
            let label = '';
            if (e.contact.label) {
              label = e.contact.label.name || '';
            }
            contact['note'] = notes.join('     ');
            contact['note'] = contact['note'].replace(/<[^>]+>/g, '');
            contact['tags'] = e.contact.tags.join(', ');
            contact['label'] = label;
            contacts.push(contact);
            cnt += 1;
            if (
              (cnt > 0 && cnt % 10000 === 0) ||
              cnt === this.contacts.length
            ) {
              this.csvEngin(contacts);
              contacts = [];
            }
          });
          this.isSaving = false;
          this.downloadStatus = this.DOWNLOAD_STATUS.COMPLETED;
        });
      } else {
        this.isSaving = false;
        this.toast.info('', `You don't have contact.`, {
          closeButton: true
        });
      }
    }
  }

  csvEngin(contacts: any): void {
    const replacer = (key, value) => (value === null ? '' : value); // specify how you want to handle null values here
    const header = Object.keys(contacts[0]);
    const csv = contacts.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(',')
    );
    csv.unshift(header.join(','));
    const csvArray = csv.join('\r\n');

    const blob = new Blob([csvArray], { type: 'text/csv' });
    const date = new Date();
    const fileName = `crmgrow Contacts (${date.getDate()}-${
      date.getMonth() + 1
    }-${date.getFullYear()} ${date.getHours()}-${date.getMinutes()})`;
    saveAs(blob, fileName + '.csv');
  }
}
