import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { element } from 'protractor';
import { Garbage } from 'src/app/models/garbage.model';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-custom-field-add',
  templateUrl: './custom-field-add.component.html',
  styleUrls: ['./custom-field-add.component.scss']
})
export class CustomFieldAddComponent implements OnInit {
  type = ''; // Type for contact or lead capture
  mode = ''; // Type for create or edit
  form_id = ''; //Lead capture form id
  fieldName = ''; // field name
  placeholder = ''; // type placeholder
  duplicated = false;
  submitted = false;
  isSame = false;
  saving = false;
  special_alphabet = false;
  garbage: Garbage = new Garbage();
  original = {
    id: '',
    name: '',
    options: [],
    placeholder: '',
    status: false,
    type: ''
  };

  // Field Type
  FIELD_TYPES = [
    { label: 'Text', value: 'text' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Link', value: 'link' },
    { label: 'Dropdown', value: 'dropdown' }
  ];
  fieldType = 'text';

  // Dropdown Selector Option
  option_id = 1;
  options = [{ label: '', value: 'option-1' }];

  constructor(
    private dialogRef: MatDialogRef<CustomFieldAddComponent>,
    private changeDetectorRef: ChangeDetectorRef,
    private userService: UserService,
    private toast: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.userService.garbage$.subscribe((res) => {
      if (res) {
        this.garbage = new Garbage().deserialize(res);
      }
    });
  }

  ngOnInit(): void {
    try {
      this.original = JSON.parse(JSON.stringify(this.data.field));
    } catch (err) {
      console.log('field data', err);
    }
    if (this.data) {
      this.type = this.data.type;
      this.mode = this.data.mode;
      if (this.mode == 'edit') {
        this.fieldName = this.data.field.name;
        this.placeholder = this.data.field.placeholder;
        const type = this.data.field.type || 'text';
        this.FIELD_TYPES.some((_f) => {
          if (_f.value === type) {
            this.fieldType = _f.value;
            return true;
          }
        });
        this.options = this.data.field.options;
        if (this.options.length == 0) {
          this.options = [{ label: '', value: 'option-1' }];
        }
      }
      if (this.type == 'lead capture') {
        this.form_id = this.data.form_id;
      }
    }
  }

  addField(): void {
    this.saving = true;
    const spCharsRegExp = /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (
      this.fieldName.indexOf('.') !== -1 ||
      this.fieldName.match(new RegExp(spCharsRegExp)) !== null
    ) {
      this.special_alphabet = true;
      this.saving = false;
      return;
    } else {
      this.special_alphabet = false;
    }
    if (this.type == 'contact') {
      let fieldTmp;
      if (this.mode == 'create') {
        let data;
        if (this.fieldType == 'dropdown') {
          data = {
            id: (this.garbage.additional_fields.length + 1).toString(),
            name: this.fieldName,
            placeholder: this.placeholder,
            options: this.options,
            type: this.fieldType,
            status: false
          };
        } else {
          data = {
            id: (this.garbage.additional_fields.length + 1).toString(),
            name: this.fieldName,
            placeholder: this.placeholder,
            options: [],
            type: this.fieldType,
            status: false
          };
        }
        this.garbage.additional_fields.push(data);
      } else {
        for (let i = 0; i < this.garbage.additional_fields.length; i++) {
          const field = this.garbage.additional_fields[i];
          if (field.id == this.data.field.id) {
            if (this.fieldType === 'dropdown') {
              field.name = this.fieldName;
              field.placeholder = '';
              field.options = this.options;
              field.type = 'dropdown';
            } else {
              field.name = this.fieldName;
              field.placeholder = this.placeholder;
              field.options = [];
              field.type = this.fieldType;
            }
            fieldTmp = field;
          }
        }
        Object.keys(this.garbage.capture_field).forEach((key) => {
          const cfields = this.garbage.capture_field[key].fields;
          cfields.forEach((c) => {
            if (
              c.match_field !== undefined &&
              c.match_field === this.original.name
            ) {
              c.match_field = fieldTmp.name;
              c.options = fieldTmp.options;
              c.type = fieldTmp.type;
              c.placeholder = fieldTmp.placeholder;
            }
          });
        });
      }
      console.log(this.garbage.capture_field);
      const updateData = {
        additional_fields: this.garbage.additional_fields,
        capture_field: this.garbage.capture_field
      };
      this.userService.updateGarbage(updateData).subscribe(() => {
        this.saving = false;
        // this.toast.success('Custom fields successfully updated.');
        this.userService.updateGarbageImpl(updateData);
        this.dialogRef.close(fieldTmp);
      });
    } else if (this.type == 'lead capture') {
      if (this.duplicated) {
        this.saving = false;
        return;
      } else {
        this.saving = false;
        let data;
        if (this.fieldType == 'dropdown') {
          data = {
            name: this.fieldName,
            type: this.fieldType,
            placeholder: this.placeholder,
            options: this.options
          };
        } else {
          data = {
            name: this.fieldName,
            type: this.fieldType,
            placeholder: this.placeholder,
            options: []
          };
        }
        this.dialogRef.close(data);
      }
    }
  }

  confirmDuplicated(): void {
    if (this.fieldName.indexOf('.') == -1) {
      this.special_alphabet = false;
    }
    if (this.type == 'lead capture') {
      const index = this.garbage.capture_field[this.form_id].fields.findIndex(
        (e) => e.name == this.fieldName
      );
      if (index != -1) {
        this.duplicated = true;
        return;
      } else {
        this.duplicated = false;
      }
    } else {
      return;
    }
  }

  addOption(): void {
    this.option_id++;
    const data = {
      label: '',
      value: 'option-' + this.option_id
    };
    this.options.push(data);
  }

  deleteOption(index: number): void {
    this.options.splice(index, 1);
    this.isSame = false;
  }

  close(): void {
    this.dialogRef.close();
  }

  optionNameChange(evt: any): void {
    if (this.options.length > 1) {
      if (this.options.filter((option) => option.label == evt).length > 1) {
        this.isSame = true;
      } else {
        this.isSame = false;
      }
    } else {
      this.isSame = false;
    }
  }

  optionValueChange(option: any): void {
    option.value = option.label.replace(' ', '-');
  }
}
