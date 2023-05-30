import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Automation } from '../../models/automation.model';
import { AutomationService } from '../../services/automation.service';

@Component({
  selector: 'app-event-type-automation',
  templateUrl: './event-type-automation.component.html',
  styleUrls: ['./event-type-automation.component.scss']
})
export class EventTypeAutomationComponent implements OnInit {
  submitted = false;
  saving = false;

  selectedAutomation: Automation;

  constructor(
    private dialogRef: MatDialogRef<EventTypeAutomationComponent>,
    private automationService: AutomationService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data?.automation) {
      this.automationService.automations$.subscribe((res) => {
        if (res && res.length > 0) {
          const index = res.findIndex((e) => e._id == this.data?.automation);
          this.selectedAutomation = res[index];
        }
      });
    }
  }

  ngOnInit(): void {}
  selectAutomation(evt: Automation): void {
    this.selectedAutomation = evt;
  }

  setAutomation(): void {
    this.saving = true;
    this.saving = false;
    this.dialogRef.close(this.selectedAutomation?._id);
  }
}
