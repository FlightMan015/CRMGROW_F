import { Component, Inject, OnInit } from '@angular/core';
import { Contact } from 'src/app/models/contact.model';
import { DealsService } from 'src/app/services/deals.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DealStage } from 'src/app/models/deal-stage.model';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-deal-create',
  templateUrl: './deal-create.component.html',
  styleUrls: ['./deal-create.component.scss']
})
export class DealCreateComponent implements OnInit {
  contacts: Contact[] = [];
  title = '';
  value: number;
  submitted = false;
  stages: any[] = [];
  selectedStage = '';
  saving = false;
  createSubscription: Subscription;
  keepContacts: Contact[] = [];
  maxValueFlag = false;
  decimalPointFlag = false;
  primaryContact = null;

  constructor(
    private dealsService: DealsService,
    private dialogRef: MatDialogRef<DealCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toastr: ToastrService
  ) {
    if (this.data && this.data.contacts) {
      this.keepContacts = [...this.data.contacts];
      this.contacts = [...this.keepContacts];
      if (this.contacts.length > 0) {
        this.primaryContact = { ...this.contacts[0] };
      }
    }
  }

  ngOnInit(): void {
    this.dealsService.easyLoadStage(
      true,
      this.dealsService.selectedPipeline.getValue()
    );
    this.dealsService.stages$.subscribe((res) => {
      // this.stages = [...this.stages, ...res];
      this.stages = res;
      if (this.data && this.data.id) {
        this.stages.forEach((stage) => {
          if (stage._id == this.data.id) {
            this.selectedStage = stage._id;
          }
        });
      } else {
        this.selectedStage = this.stages[0]?._id;
      }
    });
  }

  createDeals(): void {
    if (
      this.contacts.length == 0 ||
      this.maxValueFlag ||
      this.maxValueFlag ||
      !this.primaryContact
    ) {
      return;
    } else {
      this.saving = true;
      const contactId = [];
      this.contacts.forEach((contact) => {
        contactId.push(contact._id);
      });
      const data = {
        deal_stage: this.selectedStage,
        contacts: contactId,
        title: this.title,
        value: this.value,
        primary_contact: this.primaryContact._id
      };
      this.dealsService.createDeal(data).subscribe(
        (res) => {
          if (res) {
            this.saving = false;
            // this.toastr.success('New Deal successfully created.');
            this.dialogRef.close(res['data']);
          }
        },
        (err) => {
          this.saving = false;
        }
      );
    }
  }

  selectPrimary(contact): void {
    this.primaryContact = contact;
  }
}
