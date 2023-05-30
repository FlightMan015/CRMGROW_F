import { Component, OnInit } from '@angular/core';
import { DELAY } from 'src/app/constants/variable.constants';
import { MatDialog } from '@angular/material/dialog';
import { CustomFieldAddComponent } from 'src/app/components/custom-field-add/custom-field-add.component';
import { CustomFieldDeleteComponent } from 'src/app/components/custom-field-delete/custom-field-delete.component';
import { MaterialEditTemplateComponent } from 'src/app/components/material-edit-template/material-edit-template.component';
import { Garbage } from 'src/app/models/garbage.model';
import { UserService } from 'src/app/services/user.service';
import { ToastrService } from 'ngx-toastr';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { LeadCaptureFormAddComponent } from 'src/app/components/lead-capture-form-add/lead-capture-form-add.component';
import { StoreService } from 'src/app/services/store.service';
import { MaterialService } from 'src/app/services/material.service';

@Component({
  selector: 'app-lead-capture',
  templateUrl: './lead-capture.component.html',
  styleUrls: ['./lead-capture.component.scss']
})
export class LeadCaptureComponent implements OnInit {
  times = DELAY;
  garbage: Garbage = new Garbage();

  constructor(
    private dialog: MatDialog,
    public userService: UserService,
    private materialService: MaterialService,
    private storeService: StoreService
  ) {
    this.userService.garbage$.subscribe((res) => {
      if (res && res._id) {
        this.garbage = new Garbage().deserialize(res);
      }
    });
  }

  ngOnInit(): void {
    this.materialService.loadMaterial(false);
  }

  addForm(): void {
    this.dialog
      .open(LeadCaptureFormAddComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '450px',
        disableClose: true,
        data: {
          type: 'create'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const id = 'form-' + Date.now();
          this.garbage.capture_field[id] = res;
          this.save('capture_field');
        }
      });
  }

  editForm(id: string): void {
    this.dialog
      .open(LeadCaptureFormAddComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '550px',
        disableClose: true,
        data: {
          type: 'edit',
          form: this.garbage.capture_field[id]
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.garbage.capture_field[id] = {
            ...this.garbage.capture_field[id],
            ...res
          };
          this.save('capture_field');
        }
      });
  }

  deleteForm(id: string): void {
    this.dialog
      .open(ConfirmComponent, {
        data: {
          title: 'Delete form',
          message: 'Do you want to delete this form?',
          cancelLabel: 'No',
          confirmLabel: 'Delete'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const materials = this.storeService.materials.getValue();
          const assigned = materials.filter(
            (material) => material.capture_form == id
          );
          if (assigned.length) {
            const ids = assigned.map((t) => t._id);
            this.dialog
              .open(ConfirmComponent, {
                data: {
                  title: 'There are materials using this form',
                  message:
                    'Do you want to continue ? This form will be removed on materials.',
                  confirmLabel: 'Continue'
                }
              })
              .afterClosed()
              .subscribe((res) => {
                if (res) {
                  const editData = {
                    ids: ids,
                    capture_form: '',
                    enabled_capture: false
                  };
                  this.materialService
                    .leadCapture(editData)
                    .subscribe((response) => {
                      if (response) {
                        if (this.garbage.capture_form == id) {
                          this.garbage.capture_form = 'default';
                        }
                        delete this.garbage.capture_field[id];
                        this.save('capture_field');
                        this.save('capture_form');
                      }
                    });
                }
              });
          } else {
            if (this.garbage.capture_form == id) {
              this.garbage.capture_form = 'default';
            }
            delete this.garbage.capture_field[id];
            this.save('capture_field');
            this.save('capture_form');
          }
        }
      });
  }

  getDelayTime(id: number): any {
    const index = this.times.findIndex((e) => e.id == id.toString());
    return this.times[index].text;
  }

  setDefault(id: string): void {
    this.garbage.capture_form = id;
    this.save('capture_form');
  }

  save(field: string): void {
    let data;
    switch (field) {
      case 'capture_field':
        data = {
          capture_field: this.garbage.capture_field
        };
        break;
      case 'capture_form':
        data = {
          capture_form: this.garbage.capture_form
        };
        break;
    }
    this.userService.updateGarbage(data).subscribe(() => {
      // this.toast.success('Lead Capture successfully updated.');
      this.userService.updateGarbageImpl(data);
    });
  }
}
