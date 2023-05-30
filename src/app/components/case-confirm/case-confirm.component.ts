import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-case-confirm',
  templateUrl: './case-confirm.component.html',
  styleUrls: ['./case-confirm.component.scss']
})
export class CaseConfirmComponent implements OnInit {
  selectedCase: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CaseConfirmComponent>
  ) {}

  selectCase(option): void {
    this.selectedCase = option;
  }

  ngOnInit(): void {}

  confirm(): void {
    this.dialogRef.close(this.selectedCase);
  }
}
