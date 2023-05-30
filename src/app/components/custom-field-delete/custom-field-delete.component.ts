import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Garbage } from 'src/app/models/garbage.model';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-custom-field-delete',
  templateUrl: './custom-field-delete.component.html',
  styleUrls: ['./custom-field-delete.component.scss']
})
export class CustomFieldDeleteComponent implements OnInit {
  field;
  type = '';
  deleting = false;
  garbage: Garbage = new Garbage();

  constructor(
    private dialogRef: MatDialogRef<CustomFieldDeleteComponent>,
    private userService: UserService,
    private toast: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.type = this.data.type;
      this.field = this.data.field;
    }
    this.userService.garbage$.subscribe((res) => {
      if (res) {
        this.garbage = new Garbage().deserialize(res);
      }
    });
  }

  ngOnInit(): void {}

  deleteField(): void {
    this.deleting = true;
    if (this.type == 'contact') {
      const required_fields = this.garbage.additional_fields.filter(
        (field) => field.id != this.field.id
      );
      this.garbage.additional_fields = [];
      this.garbage.additional_fields = required_fields;
      const updateData = {
        additional_fields: this.garbage.additional_fields
      };
      this.userService.updateGarbage(updateData).subscribe(() => {
        this.deleting = false;
        // this.toast.success('Custom fields successfully updated.');
        this.userService.updateGarbageImpl(updateData);
        this.dialogRef.close();
      });
    } else {
      this.deleting = false;
      this.dialogRef.close(true);
    }
  }
}
