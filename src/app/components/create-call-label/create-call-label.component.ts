import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UserService } from 'src/app/services/user.service';
import * as _ from 'lodash';
import { ADMIN_CALL_LABELS } from 'src/app/constants/variable.constants';

@Component({
  selector: 'app-create-call-label',
  templateUrl: './create-call-label.component.html',
  styleUrls: ['./create-call-label.component.scss']
})
export class CreateCallLabelComponent implements OnInit {
  label: string = '';
  saving: boolean = false;
  constructor(
    private userService: UserService,
    private dialogRef: MatDialogRef<CreateCallLabelComponent>
  ) {}

  ngOnInit(): void {}

  create(): void {
    const labels = this.userService.callLabels.getValue();
    if (labels.indexOf(this.label) !== -1) {
      this.dialogRef.close({ label: this.label });
    } else {
      const ownLabels = _.difference(labels, ADMIN_CALL_LABELS);
      ownLabels.push(this.label);
      this.saving = true;
      this.userService
        .updateGarbage({
          call_labels: ownLabels
        })
        .subscribe((status) => {
          this.saving = false;
          if (status) {
            this.userService.callLabels.next([
              ...ADMIN_CALL_LABELS,
              ...ownLabels
            ]);
            this.dialogRef.close({ label: this.label });
          }
        });
    }
  }
}
