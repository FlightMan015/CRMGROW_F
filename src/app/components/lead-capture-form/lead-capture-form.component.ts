import { T } from '@angular/cdk/keycodes';
import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { DELAY } from 'src/app/constants/variable.constants';
import { Garbage } from 'src/app/models/garbage.model';
import { Material } from 'src/app/models/material.model';
import { MaterialService } from 'src/app/services/material.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-lead-capture-form',
  templateUrl: './lead-capture-form.component.html',
  styleUrls: ['./lead-capture-form.component.scss']
})
export class LeadCaptureFormComponent implements OnInit {
  times = DELAY;
  garbage: Garbage = new Garbage();
  submitted = false;
  saving = false;
  material = new Material();
  materials = [];
  allMaterials = [];
  selected_form = '';
  type = '';
  isCapture = false;

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<LeadCaptureFormComponent>,
    public userService: UserService,
    private toast: ToastrService,
    private materialService: MaterialService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.type = this.data.type;
      if (this.type == 'single') {
        this.material = this.data.material;
        this.isCapture = this.material.enabled_capture;
      } else {
        this.materials = this.data.materials;
        this.materials.forEach((e) => {
          this.allMaterials.push(e._id);
        });
        this.isCapture = this.materials.every((e) => e.enabled_capture);
      }
    }
    this.userService.garbage$.subscribe((res) => {
      if (res) {
        this.garbage = new Garbage().deserialize(res);
        if (this.type == 'all') {
          this.selected_form = this.garbage.capture_form;
        } else {
          if (this.material.capture_form) {
            this.selected_form = this.material.capture_form;
          } else {
            this.selected_form = this.garbage.capture_form;
          }
        }
      }
    });
  }

  ngOnInit(): void {}

  setForm(id: string): void {
    this.selected_form = id;
  }

  saveForm(): void {
    this.saving = true;
    const data = {
      capture_form: this.selected_form,
      enabled_capture: this.isCapture
    };
    let editData;
    if (this.type == 'single') {
      editData = {
        ids: [this.material._id],
        ...data
      };
    } else {
      editData = {
        ids: this.allMaterials,
        ...data
      };
    }
    this.materialService.leadCapture(editData).subscribe((res) => {
      this.saving = false;
      if (res) {
        this.dialogRef.close(data);
      }
    });
  }

  setCapture(evt: any): void {
    this.isCapture = !this.isCapture;
    if (!this.isCapture) {
      this.selected_form = '';
    }
  }

  getDelayTime(id: number): any {
    const index = this.times.findIndex((e) => e.id == id.toString());
    return this.times[index].text;
  }
}
