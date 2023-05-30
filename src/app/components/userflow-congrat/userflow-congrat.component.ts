import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-userflow-congrat',
  templateUrl: './userflow-congrat.component.html',
  styleUrls: ['./userflow-congrat.component.scss']
})
export class UserflowCongratComponent implements OnInit {
  constructor(private dialogRef: MatDialogRef<UserflowCongratComponent>) {}

  ngOnInit(): void {}

  getStarted(): void {
    localStorage.setItem('checklist', 'end');
    this.dialogRef.close();
  }
}
