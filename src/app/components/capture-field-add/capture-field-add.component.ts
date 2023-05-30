import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Garbage } from 'src/app/models/garbage.model';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-capture-field-add',
  templateUrl: './capture-field-add.component.html',
  styleUrls: ['./capture-field-add.component.scss']
})
export class CaptureFieldAddComponent implements OnInit {
  submitted = false;
  fields = [
    { name: '', label: 'None' },
    { name: 'source', label: 'Source' },
    { name: 'website', label: 'Website' },
    { name: 'brokerage', label: 'Company' },
    { name: 'address', label: 'Address' },
    { name: 'city', label: 'City' },
    { name: 'country', label: 'Country' },
    { name: 'state', label: 'State' },
    { name: 'zip', label: 'Zip code' }
  ];
  match_field = '';
  fieldName = '';
  placeholder = '';
  FIELD_TYPES = [
    { label: 'Text', value: 'text' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Link', value: 'link' },
    { label: 'Dropdown', value: 'dropdown' }
  ];
  fieldType = 'text';
  option_id = 1;
  options = [{ label: '', value: 'option-1' }];
  duplicated = false;
  isSame = false;
  type = '';
  garbage: Garbage = new Garbage();

  constructor(
    private dialogRef: MatDialogRef<CaptureFieldAddComponent>,
    public userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.userService.garbage$.subscribe((res) => {
      if (res) {
        this.garbage = new Garbage().deserialize(res);
        if (this.garbage.additional_fields.length) {
          this.garbage.additional_fields.forEach((e) => {
            const data = {
              name: e.name,
              label: e.name
            };
            this.fields.push(data);
          });
        }
      }
    });
    if (this.data) {
      this.type = this.data.type;
      if (this.type == 'edit') {
        this.fieldName = this.data.editData.name;
        this.placeholder = this.data.editData.placeholder;
        this.fieldType = this.data.editData.type || 'text';
        this.options = this.data.editData.options;
        if (!this.options || this.options?.length == 0) {
          this.options = [{ label: '', value: 'option-1' }];
        }
        this.match_field = this.data.editData.match_field;
      }
    }
  }

  ngOnInit(): void {}

  // selectField(evt: any, field: any): void {
  //   if (evt.target.checked) {
  //     this.selectedFields.push(field);
  //   } else {
  //     const index = this.selectedFields.findIndex((e) => e.name == field.name);
  //     if (index !== -1) {
  //       this.selectedFields.splice(index, 1);
  //     }
  //   }
  // }

  // checkField(name: string): any {
  //   const index = this.selectedFields.findIndex((e) => e.name == name);
  //   if (index !== -1) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

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

  confirmDuplicated(): void {
    const index = this.fields.findIndex((e) => e.name == this.fieldName);
    if (index != -1) {
      this.duplicated = true;
      return;
    } else {
      this.duplicated = false;
    }
  }

  addField(): void {
    if (this.fieldType == 'dropdown' && !this.options.length) {
      return;
    }
    let data;
    if (this.fieldType == 'dropdown') {
      data = {
        name: this.fieldName,
        type: this.fieldType,
        placeholder: this.placeholder,
        options: this.options,
        match_field: this.match_field
      };
    } else {
      data = {
        name: this.fieldName,
        type: this.fieldType,
        placeholder: this.placeholder,
        options: [],
        match_field: this.match_field
      };
    }
    this.dialogRef.close(data);
  }
}
