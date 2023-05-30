import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { Label } from 'src/app/models/label.model';
import { LABEL_COLORS } from 'src/app/constants/variable.constants';
import { LabelEditColorComponent } from '../label-edit-color/label-edit-color.component';
import { Subscription } from 'rxjs';
import { LabelService } from 'src/app/services/label.service';

@Component({
  selector: 'app-label-edit',
  templateUrl: './label-edit.component.html',
  styleUrls: ['./label-edit.component.scss']
})
export class LabelEditComponent implements OnInit {
  LABEL_COLORS = LABEL_COLORS;
  label: Label = new Label();

  saving = false;
  saveSubscription: Subscription;

  constructor(
    private labelService: LabelService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<LabelEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Label
  ) {
    this.label = new Label().deserialize(this.data);
  }

  ngOnInit(): void {}

  addColor(): void {
    this.dialog
      .open(LabelEditColorComponent, {
        position: { top: '400px' },
        width: '100vw',
        maxWidth: '400px',
        maxHeight: '400px'
      })
      .afterClosed()
      .subscribe((color) => {
        if (color) {
          this.label.color = color;
        }
      });
  }

  selectColor(color: string): void {
    this.label.color = color;
  }

  editLabel(): void {
    this.saving = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();
    this.saveSubscription = this.labelService
      .updateLabel(this.label._id, {
        ...this.label,
        _id: undefined
      })
      .subscribe((status) => {
        this.saving = false;
        if (status) {
          this.labelService.update$(this.label);
          this.dialogRef.close();
        }
      });
  }
}
