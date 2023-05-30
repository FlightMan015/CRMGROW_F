import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { environment } from 'src/environments/environment';
import { FileUploader } from 'ng2-file-upload';
import { Papa } from 'ngx-papaparse';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { UserService } from '../../services/user.service';
import { ConfirmComponent } from '../confirm/confirm.component';
import { NotifyComponent } from '../notify/notify.component';
import { ImportContactEditComponent } from '../import-contact-edit/import-contact-edit.component';
import { ImportContactMergeComponent } from '../import-contact-merge/import-contact-merge.component';
import {
  DialogSettings,
  PHONE_COUNTRIES
} from '../../constants/variable.constants';
import { ContactService } from '../../services/contact.service';
import { HandlerService } from '../../services/handler.service';
import { ToastrService } from 'ngx-toastr';
import { saveAs } from 'file-saver';
import { ContactEditComponent } from '../contact-edit/contact-edit.component';
import { validateEmail } from '../../helper';
import { Contact2I } from 'src/app/models/contact.model';
const phone = require('phone');
const PhoneNumber = require('awesome-phonenumber');
import * as _ from 'lodash';
import { LabelService } from 'src/app/services/label.service';
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';
import { Label } from 'src/app/models/label.model';
import { Subscription } from 'rxjs';
import { DealsService } from '../../services/deals.service';
import { COUNTRIES } from 'src/app/constants/countries.constant';
import { CountryISO } from 'ngx-intl-tel-input';

interface GroupAction {
  selection: string[];
  merging?: boolean;
  deleting?: boolean;
  checking?: boolean;
}

@Component({
  selector: 'app-upload-contacts',
  templateUrl: './upload-contacts.component.html',
  styleUrls: ['./upload-contacts.component.scss']
})
export class UploadContactsComponent implements OnInit, OnDestroy {
  // File Selector Varaibles
  @ViewChild('file') file: any;
  isCSVFile = false;
  fileSize;
  fileName = '';

  public uploader: FileUploader = new FileUploader({
    url: environment.api + 'contact/import-csv',
    authToken: this.userService.getToken(),
    itemAlias: 'csv'
  });
  userId = '';
  step = 1;

  columns = []; // CSV Header columns
  public lines = []; // CSV File Line Data
  labels = []; // CSV File Lable Data

  updateColumn = {}; // CSV column and CRM property matching relationship
  _pcMatching = {}; // Property and Column matching relationship

  invalidContacts: Contact2I[] = []; // invalid contact is loaded from file & edited as valid contacts
  contacts: Contact2I[] = []; // valid contacts is loaded from file directly
  contactGroups: Contact2I[][] = []; // Duplicated Contact groups
  dealGroups = []; // Duplicated by deal Contact groups
  groupActions: GroupAction[] = []; // Group Actions, selection, deleting, merging, checking
  contactsToUpload: Contact2I[] = []; // Contacts to upload (passed in duplication checking)
  selectedContactsToUpload: Contact2I[] = []; // Contacts that are selected to upload

  selectedImportContacts = new SelectionModel<any>(true, []);
  firstImport = true;

  UPLOAD_ONCE = 50;
  uploading = false;
  isCompleteUpload = false;
  uploadPercent = 0;
  overallContacts = 0; // total contact count to upload
  createdDealPercent = 0;
  createdDealCount = 0;
  overallDealCount = 0;

  uploadingChunk: Contact2I[] = [];
  private dataText = '';
  failedData: Contact2I[] = [];
  exceedContacts: Contact2I[] = [];
  uploadedContactsCount = 0;

  duplicateLoading = false;
  checkingDuplicate = false;

  groupPage = 1;
  reviewPage = 1;
  exceedPage = 1;
  invalidPage = 1;
  failedPage = 1;
  gPSize = 20;
  rPSize = 100;
  ePSize = 100;
  iPSize = 100;
  fPSize = 5;

  dgPSize = 10;
  dealGroupPage = 1;
  stages: any[] = [];
  creatingDeals = false;
  prevDealStep = 1;

  phoneUtil = PhoneNumberUtil.getInstance();
  lead_fields: any[] = [];

  countries: string[] = PHONE_COUNTRIES;
  COUNTRIES = [];
  selectedCountryISO = CountryISO.UnitedStates;
  selectedCountry: any = {
    areaCodes: undefined,
    dialCode: '',
    iso2: '',
    name: '',
    placeholder: '',
    priority: 0
  };

  profileSubscription: Subscription;
  garbageSubscription: Subscription;
  dealStageLoadSubscription: Subscription;

  constructor(
    private dialogRef: MatDialogRef<UploadContactsComponent>,
    private userService: UserService,
    private dialog: MatDialog,
    private papa: Papa,
    private contactService: ContactService,
    private handlerService: HandlerService,
    private toastr: ToastrService,
    private labelService: LabelService,
    private dealsService: DealsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.userId = res._id;
    });
    this.loadDealStage();
  }

  ngOnInit(): void {
    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
      if (this.uploader.queue.length > 1) {
        this.uploader.queue.splice(0, 1);
      }
    };
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        this.lead_fields = _garbage.additional_fields.map((e) => e);
        this.lead_fields.forEach((field) => {
          this.fields.push({ value: field.name, label: field.name });
          this.properties[field.name] = field.name;
        });
      }
    );

    this.uploader.onCompleteItem = (
      item: any,
      response: any,
      status: any,
      headers: any
    ) => {
      response = JSON.parse(response);
      if (response.status) {
        this.uploading = false;

        const duplicated = response.duplicate_contacts || [];
        const exceed = response.exceed_contacts || [];

        this.isCompleteUpload = this.selectedContactsToUpload.length
          ? false
          : true;
        this.uploadPercent = Math.round(
          (1 - this.selectedContactsToUpload.length / this.overallContacts) *
            100
        );
        this.uploadedContactsCount +=
          this.uploadingChunk.length - duplicated.length - exceed.length;
        if (duplicated && duplicated.length) {
          duplicated.forEach((e) => {
            const _dOrigin = { ...e };
            if (e.tags) {
              if (e.tags instanceof Array) {
                _dOrigin.tags = e.tags;
              } else {
                _dOrigin.tags = e.tags.split(',');
              }
            }
            if (e.notes) {
              if (e.notes instanceof Array) {
                _dOrigin.notes = e.notes;
              } else {
                _dOrigin.notes = [e.notes];
              }
            }
            if (e.label && e.label._id) {
              _dOrigin['label_id'] = e.label._id;
              _dOrigin.label = e.label.name;
            }
            if (e.cell_phone) {
              let code = '';
              if (e.cell_phone.includes('+')) {
                const tel = this.phoneUtil.parse(e.cell_phone);
                _dOrigin['cell_phone'] = this.phoneUtil.format(
                  tel,
                  PhoneNumberFormat.E164
                );
              } else {
                code = this.selectedCountry['iso2'];
                _dOrigin['cell_phone'] = this.getInternationalPhone(
                  e.cell_phone,
                  code
                );
              }
              // _dOrigin['cell_phone'] = this.getInternationalPhone(e.cell_phone);
            }
            const _d = new Contact2I().deserialize(_dOrigin);
            if (_d._id) {
              _d.id = _d._id;
            }
            this.failedData.push(_d);
          });
        }
        if (exceed.length) {
          // Stop the uploading
          // fill excceed contacts with rest contacts
          this.exceedContacts = [
            ...this.exceedContacts,
            ...exceed,
            ...this.selectedContactsToUpload
          ];
          this.step = 6;
          return;
        }

        if (!this.isCompleteUpload) {
          // Upload next chunk
          this.uploadingChunk = this.selectedContactsToUpload.splice(
            0,
            this.UPLOAD_ONCE
          );
          this.uploadRecursive();
        } else {
          this.uploading = false;
          // complete the first import
          // 1: Exceed Data checking
          // 2: Failed Data checking
          if (this.exceedContacts.length) {
            this.step = 6;
            return;
          } else if (this.failedData.length) {
            // Rechecking the duplication with db contacts and csv contacts
            this.confirmFailed();
            return;
          }
          // 3: completed successfully
          if (!this.failedData.length && !this.exceedContacts.length) {
            // this.toastr.success('Contacts are imported successfully.');
            this.handlerService.bulkContactAdd$();
            this.dialogRef.close({ created: true });
          }
        }
      } else if (response.error === 'max_exceed') {
        this.uploading = false;
        // exceed contacts
        this.exceedContacts = [
          ...this.exceedContacts,
          ...this.uploadingChunk,
          ...this.selectedContactsToUpload
        ];
        this.step = 6;
      } else {
        this.toastr.error(response.error);
        this.dialogRef.close();
      }
    };
    for (let i = 0; i < COUNTRIES.length; i++) {
      const c = COUNTRIES[i];
      const country = {
        name: c[0].toString(),
        iso2: c[1].toString(),
        dialCode: c[2].toString(),
        priority: +c[3] || 0,
        areaCodes: c[4] || undefined,
        htmlId: `iti-0__item-${c[1].toString()}`,
        flagClass: `iti__${c[1].toString().toLocaleLowerCase()}`,
        placeHolder: '',
        mask: ''
      };
      country.placeHolder = this.getPhoneNumberPlaceHolder(
        country.iso2.toUpperCase()
      );
      country.mask = country.placeHolder.replace(/[0-9]/gi, '0');
      this.COUNTRIES.push(country);
    }
    const countriesTemp = [];
    if (this.countries.length) {
      this.countries.forEach((country) => {
        this.COUNTRIES.forEach((c) => {
          if (country === c.iso2) {
            countriesTemp.push(c);
          }
        });
      });
    }
    if (countriesTemp.length > 0) {
      this.COUNTRIES = countriesTemp;
    }
    this.selectedCountry = this.COUNTRIES.find((c) => {
      return c.iso2.toLowerCase() === this.selectedCountryISO.toLowerCase();
    });
  }

  ngOnDestroy(): void {
    this.dealStageLoadSubscription &&
      this.dealStageLoadSubscription.unsubscribe();
  }

  /**
   * Clear the File Import variables to import the file newly
   */
  initImport(): void {
    this.isCSVFile = false;
    this.fileName = '';
    this.updateColumn = {};
  }

  /**
   * Select the CSV file and parse that
   * @param evt: File Select Event
   * @returns
   */
  readFile(evt): any {
    this.initImport();
    const file = evt.target.files[0];
    if (!file) {
      return false;
    }
    if (!file.name?.toLowerCase().endsWith('.csv')) {
      this.isCSVFile = false;
      this.toastr.error('Please select the csv file.', 'Import Contacts');
      return false;
    }

    this.isCSVFile = true;
    this.fileName = file.name;
    this.fileSize = this.humanFileSize(file.size);
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const text = fileReader.result + '';
      this.papa.parse(text, {
        skipEmptyLines: true,
        complete: (results) => {
          this.columns = results.data[0];
          const lines = results.data.slice(1);
          this.lines = [];

          // remove blank columns and that column cells in rows
          for (let i = results.data[0].length - 1; i >= 0; i--) {
            if (results.data[0][i] === '') {
              this.columns.splice(i, 1);
              for (const line of lines) {
                line.splice(i, 1);
              }
            }
          }

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.join('').trim()) {
              const contact = {};
              line.forEach((cell, index) => {
                const field = this.columns[index];
                contact[field] = cell.trim();
              });
              this.lines.push(contact);
            }
          }

          if (this.lines.length > 10000) {
            // Alert & Disable
            this.dialog
              .open(NotifyComponent, {
                ...DialogSettings.ALERT,
                data: {
                  message:
                    'This csv contains 10,000+ records. Please split the file and try again.'
                }
              })
              .afterClosed()
              .subscribe((res) => {
                this.initImport();
              });
            return;
          }

          // Add index to the same name columns
          const sameColumns = {};
          for (let i = 0; i < this.columns.length; i++) {
            let column = this.columns[i];
            column = column.replace(/(\s\(\d\))$/, '');
            if (!sameColumns[column]) {
              sameColumns[column] = 1;
            } else {
              this.columns[i] = column + ' (' + sameColumns[column] + ')';
              sameColumns[column]++;
            }
          }
          // this.parseResults = [];
          this.step = 2;
        }
      });
    };
    fileReader.readAsText(evt.target.files[0]);
  }

  /**
   * Go to Match Column Step
   */
  selectField(): void {
    if (this.isCSVFile) {
      this.step = 2;
    }
  }

  review(): void {
    this.contacts = [];
    this.invalidContacts = [];
    this.contactsToUpload = [];
    this.contactGroups = [];
    this.failedData = [];
    let importField = false;
    this.labels = [];
    this.columns.some((e) => {
      if (this.updateColumn[e]) {
        importField = true;
        return true;
      }
    });
    if (!importField) {
      this.toastr.error(
        'Please match the fields with Contact Properties.',
        'Import Contact'
      );
      return;
    }
    const pcMatching = _.invert(this.updateColumn); // CRMGrow Property: CSV column matching relationship
    this._pcMatching = pcMatching;
    if (pcMatching['notes']) {
      const pcMatchingBy = _.invertBy(this.updateColumn);
      this._pcMatching['notes'] = pcMatchingBy['notes'];
    }

    if (!this._pcMatching['first_name'] && !this._pcMatching['last_name']) {
      this.toastr.error(
        'Please match the fields with first name or last name of crmgrow',
        'Import Contact'
      );
      return;
    }
    if (!this._pcMatching['email'] && !this._pcMatching['cell_phone']) {
      this.toastr.error(
        'Please match the fields with primary email or primary phone of crmgrow',
        'Import Contact'
      );
      return;
    }

    this.lines.map((record, cellIndex) => {
      const contact = new Contact2I();
      for (const property in pcMatching) {
        if (
          property !== 'notes' &&
          property !== 'tags' &&
          property !== 'cell_phone' &&
          property !== 'secondary_phone'
        ) {
          contact[property] = record[pcMatching[property]];
          if (
            property == 'label' &&
            this.labels.indexOf(record[pcMatching[property]]) === -1
          ) {
            this.labels.push(record[pcMatching[property]]);
          }
        } else if (
          property === 'cell_phone' ||
          property === 'secondary_phone'
        ) {
          let code = '';
          if (record[this._pcMatching[property]].charAt(0) == '+') {
            try {
              const tel = this.phoneUtil.parse(
                record[this._pcMatching[property]]
              );
              contact[property] = this.phoneUtil.format(
                tel,
                PhoneNumberFormat.E164
              );
            } catch (err) {
              contact[property] = '';
            }
          } else {
            code = this.selectedCountry['iso2'];
            contact[property] = this.getInternationalPhone(
              record[this._pcMatching[property]],
              code
            );
          }
          if (
            this._pcMatching['country'] &&
            record[this._pcMatching['country']]
          ) {
            const country = record[this._pcMatching['country']];
            this.COUNTRIES.forEach((e) => {
              if (
                e.iso2.toLowerCase() == country.toLowerCase() ||
                e.name.toLowerCase() == country.toLowerCase()
              ) {
                code = e.iso2;
                contact[property] = this.getInternationalPhone(
                  record[this._pcMatching[property]],
                  code
                );
              }
            });
          }
          // contact[property] = this.getInternationalPhone(
          //   record[pcMatching[property]],
          //   code
          // );
        } else if (property === 'notes') {
          if (pcMatching['notes'] instanceof Array) {
            pcMatching['notes'].forEach((field) => {
              contact['notes'].push(record[field]);
            });
          } else {
            contact['notes'].push(record[pcMatching[property]]);
          }
        } else if (property === 'tags') {
          contact['tags'] = record[pcMatching['tags']].split(',');
        }
      }
      contact.id = cellIndex + '';

      if (!contact.isValidEmails || !contact.isValidPhones) {
        this.invalidContacts.push(contact);
      } else {
        this.contacts.push(contact);
      }
    });

    if (this._pcMatching['label'] && this.labels.length > 50) {
      this.dialog.open(NotifyComponent, {
        maxWidth: '420px',
        width: '96vw',
        data: {
          message: `We have a label limit of 50 labels per account.  You have reached this limit.  Please use tags to help reduce the amount of labels used going forward or reach out to support@crmgrow.com for help with label and tagging strategy.`
        }
      });
      return;
    }

    if (this.invalidContacts.length > 0) {
      // Invalid contacts Step
      this.invalidPage = 1;
      this.step = 7;
    } else {
      this.duplicateLoading = true;
      setTimeout(() => {
        console.log('columns res', this.columns, this.updateColumn);
        this.groupContacts()
          .then((res) => {
            console.log('res result', res);
            if (res) {
              // Review the Duplicated contacts
              this.groupPage = 1;
              this.step = 3;
            } else {
              // Review the contacts to upload
              this.reviewPage = 1;
              this.step = 4;
              this.selectAllForce();
            }
          })
          .finally(() => {
            this.duplicateLoading = false;
          });
      }, 150);
    }
  }

  onCountrySelect(country: any): void {
    this.selectedCountry = country;
  }

  getPhoneNumberPlaceHolder(countryCode: string): any {
    try {
      return this.phoneUtil.format(
        this.phoneUtil.getExampleNumber(countryCode),
        PhoneNumberFormat.NATIONAL
      );
    } catch (e) {
      return e;
    }
  }

  /**
   * Edit the Invalid Contact
   * @param contact: Contact2I to edit
   */
  editInvalidContact(contact: Contact2I): void {
    this.dialog
      .open(ImportContactEditComponent, {
        data: {
          contact: { ...contact },
          fields: { ...this._pcMatching }
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res['contact']) {
          const edited = new Contact2I().deserialize({ ...res['contact'] });
          let code = '';
          if (edited.cell_phone.includes('+')) {
            const tel = this.phoneUtil.parse(edited.cell_phone);
            edited.cell_phone = this.phoneUtil.format(
              tel,
              PhoneNumberFormat.E164
            );
          } else {
            code = this.selectedCountry['iso2'];
            edited.cell_phone = this.getInternationalPhone(
              edited.cell_phone,
              code
            );
          }
          // edited.cell_phone = this.getInternationalPhone(edited.cell_phone);
          const contactIndex = this.invalidContacts.findIndex(
            (e) => e.id === contact.id
          );
          if (contactIndex >= 0) {
            this.invalidContacts.splice(contactIndex, 1, edited);
          }
        }
      });
  }

  /**
   * Review Validation again & next step: Step 7 Submit
   */
  reviewValidation(): void {
    let firstInvalidContact;
    let firstInvalidContactIndex = 0;
    this.invalidContacts.some((e, index) => {
      if (!e.isValidEmails || !e.isValidPhones) {
        firstInvalidContact = e;
        firstInvalidContactIndex = index;
        return true;
      }
    });
    if (firstInvalidContact) {
      const confirmDlg = this.dialog.open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Review Invalid Contacts',
          message:
            'There are invalid contacts yet. Are you sure to ignore the invalid contacts and move to next step?',
          confirmLabel: 'Ignore & Next',
          additional: 'export the invalid contacts'
        }
      });
      confirmDlg.afterClosed().subscribe((res) => {
        if (res) {
          // merge valid contacts and current contacts
          this.invalidContacts.forEach((contact) => {
            if (!contact.isValidEmails || !contact.isValidPhones) {
              return;
            } else {
              this.contacts.push(contact);
            }
          });
          this.duplicateCheckImpl();
        } else {
          this.invalidPage =
            Math.floor(firstInvalidContactIndex / this.iPSize) + 1;
          setTimeout(() => {
            const id = 'invalid-' + firstInvalidContact.id;
            this.scrollToEl(id);
          }, 100);
          return;
        }
      });
      confirmDlg.componentInstance.onOtherAction.subscribe((data) => {
        // Download the Invalid Contacts
        this.downloadInvalidContacts();
      });
      return;
    }
    this.contacts = [...this.contacts, ...this.invalidContacts];
    this.duplicateCheckImpl();
  }

  downloadInvalidContacts(): void {
    const invalidContactArr: Contact2I[] = [];
    this.invalidContacts.forEach((contact) => {
      if (!contact.isValidEmails || !contact.isValidPhones) {
        invalidContactArr.push(contact);
      }
    });
    // download the invalid
    this.downloadCSV(invalidContactArr, 'crmgrow Import(Invalid)');
  }

  downloadFailed(): void {
    const failed = this.contacts.filter((e) => !e._id);
    this.downloadCSV(failed, 'crmgrow Import Failed(with contacts)');
  }

  duplicateCheckImpl(): void {
    this.duplicateLoading = true;
    setTimeout(() => {
      this.groupContacts()
        .then((res) => {
          if (res) {
            // Review the Duplicated contacts
            this.groupPage = 1;
            this.step = 3;
          } else {
            // Review the contacts to upload
            this.reviewPage = 1;
            this.step = 4;
            this.selectAllForce();
          }
        })
        .finally(() => {
          this.duplicateLoading = false;
        });
    }, 150);
  }

  /**
   * Get the Duplicated contacts status and groupize the contacts
   * @returns duplicated contacts status
   */
  groupContacts(): Promise<any> {
    return new Promise((resolve) => {
      const idGroups = {};
      this.contacts.forEach((e) => {
        idGroups[e.id] = e;
      });
      const emailGroups = _.groupBy(this.contacts, (e: Contact2I) =>
        (e.email || '').toLowerCase()
      );
      const phoneGroups = _.groupBy(
        this.contacts,
        (e: Contact2I) => e.cell_phone
      );
      const nameGroups = _.groupBy(this.contacts, (e: Contact2I) =>
        (e.fullName || '').toLowerCase()
      );
      const emailGroupContactIds = [];
      const phoneGroupContactIds = [];
      const nameGroupContactIds = [];
      for (const email in emailGroups) {
        if (email && email !== 'undefined' && email !== 'null') {
          const eGroups = emailGroups[email].map((e: Contact2I) => e.id);
          emailGroupContactIds.push(eGroups);
        } else {
          emailGroups[email].forEach((e) => {
            emailGroupContactIds.push([e.id]);
          });
        }
      }
      for (const phone in phoneGroups) {
        if (phone && phone !== 'undefined' && phone !== 'null') {
          const eGroups = phoneGroups[phone].map((e: Contact2I) => e.id);
          phoneGroupContactIds.push(eGroups);
        } else {
          phoneGroups[phone].forEach((e) => {
            phoneGroupContactIds.push([e.id]);
          });
        }
      }
      for (const name in nameGroups) {
        if (name && name !== 'undefined' && name !== 'null') {
          const eGroups = nameGroups[name].map((e: Contact2I) => e.id);
          nameGroupContactIds.push(eGroups);
        } else {
          nameGroups[name].forEach((e) => {
            nameGroupContactIds.push([e.id]);
          });
        }
      }
      const groupContactIds = [...emailGroupContactIds];
      for (let j = 0; j < phoneGroupContactIds.length; j++) {
        const group = phoneGroupContactIds[j];
        if (group.length > 1) {
          let mergedGroup = [];
          for (let i = groupContactIds.length - 1; i >= 0; i--) {
            const groupToCheck = groupContactIds[i];
            const intersected = _.intersection(group, groupToCheck);
            if (intersected.length) {
              mergedGroup = _.uniq([...mergedGroup, ...groupToCheck]);
              groupContactIds.splice(i, 1);
            }
          }
          if (mergedGroup.length) {
            groupContactIds.push(_.uniq([...group, ...mergedGroup]));
          }
        }
      }
      for (let j = 0; j < nameGroupContactIds.length; j++) {
        const group = nameGroupContactIds[j];
        if (group.length > 1) {
          let mergedGroup = [];
          for (let i = groupContactIds.length - 1; i >= 0; i--) {
            const groupToCheck = groupContactIds[i];
            const intersected = _.intersection(group, groupToCheck);
            if (intersected.length) {
              mergedGroup = _.uniq([...mergedGroup, ...groupToCheck]);
              groupContactIds.splice(i, 1);
            }
          }
          if (mergedGroup.length) {
            groupContactIds.push(_.uniq([...group, ...mergedGroup]));
          }
        }
      }
      const resultGroupIds = groupContactIds.filter((e) => e.length > 1);
      const singleGroupIds = groupContactIds.filter((e) => e.length === 1);
      const uniqContactIds = singleGroupIds.map((e) => e[0]);
      const resultGroups = [];
      resultGroupIds.forEach((_g) => {
        const group = [];
        _g.forEach((id) => {
          group.push(idGroups[id]);
        });
        resultGroups.push(group);
      });
      if (resultGroups.length) {
        this.contactsToUpload = this.contacts.filter(
          (e) => uniqContactIds.indexOf(e.id) !== -1
        );
        this.contactGroups = resultGroups;
        this.groupActions = [];
        for (let i = 0; i < resultGroups.length; i++) {
          const gActions: GroupAction = {
            selection: []
          };
          this.groupActions.push(gActions);
        }
        resolve(true);
      } else {
        this.contactsToUpload = this.contacts;
        resolve(false);
      }
    });
  }

  /**
   * Check if the current field of the current contact is duplicated
   * @param gIndex:number (Contact Group Index)
   * @param contact: Contact2I (Contact to check)
   * @param field: Field name to check
   * @returns
   */
  isDuplicated(gIndex: number, contact: Contact2I, field: string): boolean {
    const allowedFields = ['email', 'cell_phone', 'first_name', 'last_name'];
    if (allowedFields.indexOf(field) === -1) {
      return false;
    }
    let isDuplicated = false;
    this.contactGroups[gIndex].some((e) => {
      if (field === 'cell_phone') {
        if (
          e[field] &&
          contact[field] &&
          e[field] === contact[field] &&
          e.id !== contact.id
        ) {
          isDuplicated = true;
          return true;
        }
      } else {
        if (
          e[field] &&
          contact[field] &&
          (e[field] || '').toLowerCase() ===
            (contact[field] || '').toLowerCase() &&
          e.id !== contact.id
        ) {
          isDuplicated = true;
          return true;
        }
      }
    });
    if (isDuplicated) {
      return true;
    }
  }

  /**
   * Returns the which fields are duplicated in this group
   * @param gIndex: Group Index
   * @returns
   */
  getDuplicateContactsText(gIndex: number): string {
    const emailGroups = _.groupBy(this.contactGroups[gIndex], (e: Contact2I) =>
      (e.email || '').toLowerCase()
    );
    const phoneGroups = _.groupBy(
      this.contactGroups[gIndex],
      (e: Contact2I) => e.cell_phone
    );
    const fnGroups = _.groupBy(this.contactGroups[gIndex], (e: Contact2I) =>
      (e.first_name || '').toLowerCase()
    );
    const lnGroups = _.groupBy(this.contactGroups[gIndex], (e: Contact2I) =>
      (e.last_name || '').toLowerCase()
    );
    const duplcatedFields = [];
    for (const email in emailGroups) {
      if (email && emailGroups[email].length > 1) {
        duplcatedFields.push('email');
        break;
      }
    }
    for (const phone in phoneGroups) {
      if (phone && phoneGroups[phone].length > 1) {
        duplcatedFields.push('phone');
        break;
      }
    }
    for (const name in fnGroups) {
      if (name && fnGroups[name].length > 1) {
        duplcatedFields.push('first name');
        break;
      }
    }
    for (const name in lnGroups) {
      if (name && lnGroups[name].length > 1) {
        duplcatedFields.push('last name');
        break;
      }
    }
    if (duplcatedFields.length) {
      return duplcatedFields.join(', ') + ' of contacts are duplicated';
    } else {
      return '';
    }
  }

  /**
   * Checking the selected status of the duplicated contact groups
   * @param gIndex: Duplicated Contact Group Index
   * @returns
   */
  isSelectedGroup(gIndex: number): boolean {
    return (
      this.groupActions[gIndex].selection.length ===
      this.contactGroups[gIndex].length
    );
  }

  isSelectedGroupContact(gIndex: number, id: string): boolean {
    return this.groupActions[gIndex].selection.indexOf(id) !== -1;
  }

  toggleGroupContact(gIndex: number, id: string): void {
    const pos = this.groupActions[gIndex].selection.indexOf(id);
    if (pos !== -1) {
      this.groupActions[gIndex].selection.splice(pos, 1);
    } else {
      this.groupActions[gIndex].selection.push(id);
    }
  }

  masterToggleGroup(gIndex: number): void {
    if (this.isSelectedGroup(gIndex)) {
      this.groupActions[gIndex].selection = [];
    } else {
      this.groupActions[gIndex].selection = this.contactGroups[gIndex].map(
        (e) => e.id
      );
    }
  }

  /**
   * Merge the selected contact in the group
   * @param gIndex: Duplicated contact group to merge
   * @returns
   */
  merge(gIndex: number): void {
    const contactIds = this.groupActions[gIndex].selection;
    if (!contactIds || !contactIds.length) {
      return;
    }
    const mergeContacts = this.contactGroups[gIndex].filter((e) => {
      return contactIds.indexOf(e.id) !== -1;
    });

    const dbContacts = mergeContacts.filter((e) => {
      return e._id;
    });
    const csvContactCount = mergeContacts.length - dbContacts.length;
    if (csvContactCount && dbContacts.length > 1) {
      this.dialog.open(NotifyComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          message: 'You can not merge more than 2 contacts and CSV'
        }
      });
      return;
    }
    if (!csvContactCount && dbContacts.length > 2) {
      this.dialog.open(NotifyComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          message: 'You can not merge more than 2 crmgrow contacts.'
        }
      });
      return;
    }

    this.dialog
      .open(ImportContactMergeComponent, {
        ...DialogSettings.UPLOAD,
        data: {
          contacts: mergeContacts,
          fields: Object.keys(this._pcMatching)
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.contactGroups[gIndex] = this.contactGroups[gIndex].filter(
            (e) => {
              if (contactIds.indexOf(e.id) === -1) {
                return true;
              }
            }
          );
          this.contactGroups[gIndex].push(res.merged);
          this.groupActions[gIndex].selection = [];
          this.groupActions[gIndex].selection.push(res.merged.id);
          // this.scrollToEl('dcs-' + res.merged.id);
          if (
            res.merged.secondary_email &&
            !this._pcMatching['secondary_email']
          ) {
            this._pcMatching['secondary_email'] = 'secondary_email';
          }
          if (
            res.merged.secondary_phone &&
            !this._pcMatching['secondary_phone']
          ) {
            this._pcMatching['secondary_phone'] = 'secondary_phone';
          }
        }
      });
  }

  /**
   * Check if there is duplicated group yet and move to next step
   * @returns
   */
  goToReview(): void {
    let hasDuplicated = false;
    let duplicatedGroupIndex = 0;
    this.contactGroups.some((group, index) => {
      if (group.length < 2) {
        return;
      }
      const emailGroup = _.groupBy(group, 'email');
      const cellPhoneGroup = _.groupBy(group, 'cell_phone');
      for (const email in emailGroup) {
        if (
          email &&
          email !== 'undefined' &&
          email !== 'null' &&
          emailGroup[email].length >= 2
        ) {
          hasDuplicated = true;
          break;
        }
      }
      for (const cell_phone in cellPhoneGroup) {
        if (
          cell_phone &&
          cell_phone !== 'undefined' &&
          cell_phone !== 'null' &&
          cellPhoneGroup[cell_phone].length >= 2
        ) {
          hasDuplicated = true;
          break;
        }
      }
      if (hasDuplicated) {
        duplicatedGroupIndex = index;
        return true;
      }
    });
    if (hasDuplicated) {
      // Ignore modal and Next step
      if (this.firstImport) {
        const confirmDlg = this.dialog.open(ConfirmComponent, {
          ...DialogSettings.CONFIRM,
          data: {
            title: 'Checking Duplicated Contacts',
            message:
              'There are duplicated contacts yet. Are you sure to ignore remained duplicated contacts and move to next step?',
            confirmLabel: 'Ignore & Next',
            additional: 'export the duplicated contacts'
          }
        });
        confirmDlg.afterClosed().subscribe((res) => {
          if (res) {
            // merge valid contacts and current contacts
            this.ignoreDuplicationStep();
          } else {
            this.groupPage = Math.floor(duplicatedGroupIndex / this.gPSize) + 1;
            setTimeout(() => {
              this.scrollToEl('contact-group-' + duplicatedGroupIndex);
            }, 100);
            return;
          }
        });
        confirmDlg.componentInstance.onOtherAction.subscribe((data) => {
          // Download the duplicated Contacts
          this.downloadDuplicatedContacts();
        });
      } else {
        // scroll to that element
        this.groupPage = Math.floor(duplicatedGroupIndex / this.gPSize) + 1;
        setTimeout(() => {
          this.scrollToEl('contact-group-' + duplicatedGroupIndex);
        }, 100);
      }
      return;
    }
    if (this.firstImport) {
      this.contactGroups.forEach((group) => {
        group.forEach((contact) => {
          this.contactsToUpload.push(contact);
        });
      });

      // Review the contacts to upload
      this.reviewPage = 1;
      this.step = 4;
      this.selectAllForce();
    } else {
      // Bulk Create the CSV contacts
      this.contactGroups.forEach((group) => {
        group.forEach((contact) => {
          if (!contact._id) {
            this.contactsToUpload.push(contact);
          }
        });
      });
      if (this.contactsToUpload.length) {
        // Review the contacts to upload
        this.reviewPage = 1;
        this.step = 4;
        this.selectAllForce();
      } else {
        this.dialog
          .open(ConfirmComponent, {
            ...DialogSettings.CONFIRM,
            data: {
              title: 'Contact Import',
              message:
                'All contacts are imported from csv successfully. Are you sure to close?',
              confirmLabel: 'Close'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              this.dialogRef.close({
                created: true
              });
            }
          });
      }
    }
  }

  ignoreDuplicationStep(): void {
    this.contactGroups.forEach((group) => {
      if (group.length < 2) {
        // Move to contacts to upload
        group.forEach((e) => {
          this.contactsToUpload.push(e);
        });
        return;
      }
      let hasDuplicated = false;
      const emailGroup = _.groupBy(group, 'email');
      const cellPhoneGroup = _.groupBy(group, 'cell_phone');
      for (const email in emailGroup) {
        if (
          email &&
          email !== 'undefined' &&
          email !== 'null' &&
          emailGroup[email].length > 1
        ) {
          hasDuplicated = true;
          break;
        }
      }
      for (const cell_phone in cellPhoneGroup) {
        if (
          cell_phone &&
          cell_phone !== 'undefined' &&
          cell_phone !== 'null' &&
          cellPhoneGroup[cell_phone].length > 1
        ) {
          hasDuplicated = true;
          break;
        }
      }
      if (!hasDuplicated) {
        // move to contacts to upload contacts
        group.forEach((e) => {
          this.contactsToUpload.push(e);
        });
      }
    });
    // Review the contacts to upload
    this.reviewPage = 1;
    this.step = 4;
    this.selectAllForce();
  }

  downloadDuplicatedContacts(): void {
    const duplicated: Contact2I[] = [];
    this.contactGroups.forEach((group) => {
      if (group.length < 2) {
        return;
      }
      let hasDuplicated = false;
      const emailGroup = _.groupBy(group, 'email');
      const cellPhoneGroup = _.groupBy(group, 'cell_phone');
      for (const email in emailGroup) {
        if (
          email &&
          email !== 'undefined' &&
          email !== 'null' &&
          emailGroup[email].length > 1
        ) {
          hasDuplicated = true;
          break;
        }
      }
      for (const cell_phone in cellPhoneGroup) {
        if (
          cell_phone &&
          cell_phone !== 'undefined' &&
          cell_phone !== 'null' &&
          cellPhoneGroup[cell_phone].length > 1
        ) {
          hasDuplicated = true;
          break;
        }
      }
      if (hasDuplicated) {
        // move to contacts to upload contacts
        group.forEach((e) => {
          duplicated.push(e);
        });
      }
      // console.log('emailGroup', emailGroup, cellPhoneGroup, hasDuplicated);
    });
    // download the duplicated
    this.downloadCSV(duplicated, 'crmgrow Import(Duplicated)');
  }

  confirmFailed(): void {
    this.firstImport = false;
    this.selectedImportContacts.clear();
    if (!this.failedData.length) {
      return;
    }
    this.contacts = [];
    this.contactGroups = [];
    this.groupActions = [];

    this.failedData.forEach((contact, index) => {
      if (!contact._id) {
        contact.id = 'csv_' + index;
      }
    });
    this.contacts = [...this.failedData];
    this.failedPage = 1;
    this.step = 8;
  }

  confirmDuplicates(): void {
    this.checkingDuplicate = true;
    this.groupContacts().then((res) => {
      if (res) {
        this.checkingDuplicate = false;
        // Review the Duplicated contacts
        this.groupPage = 1;
        this.step = 3;
      } else {
        this.checkingDuplicate = false;
        // Review the contacts to upload
        this.reviewPage = 1;
        this.step = 4;
        this.contactsToUpload = this.contacts;
      }
    });
  }

  upload(): void {
    if (
      this.selectedImportContacts.selected &&
      this.selectedImportContacts.selected.length <= 0
    ) {
      return;
    }
    if (!this.contactsToUpload.length) {
      return;
    }

    this.failedData = [];

    this.selectedContactsToUpload = this.contactsToUpload.filter((e) => {
      return this.selectedImportContacts.selected.indexOf(e.id) !== -1;
    });

    const labels = [];
    this.selectedContactsToUpload.forEach((e) => {
      if (
        this.labels.indexOf(e.label) !== -1 &&
        labels.indexOf(e.label) === -1
      ) {
        labels.push(e.label);
      }
    });
    this.overallContacts = this.selectedContactsToUpload.length;
    this.isCompleteUpload = false;
    this.uploadedContactsCount = 0;
    this.uploadPercent = 0;
    this.uploadingChunk = this.selectedContactsToUpload.splice(
      0,
      this.UPLOAD_ONCE
    );
    if (
      this._pcMatching['label'] &&
      this.labels.length &&
      this.labels.length <= 50
    ) {
      this.labelService.bulkCreateLabel(labels).subscribe((res) => {
        if (res['status']) {
          res.data.forEach((label) => {
            this.labelService.create$(label);
          });
          this.uploadRecursive();
          this.step = 5;
        }
      });
    } else {
      this.uploadRecursive();
      this.step = 5;
    }
  }

  uploadRecursive(): void {
    //Init first line of the chunk
    for (const key in this.properties) {
      if (key === 'notes' || key === 'tags') {
        this.uploadingChunk[0][key] = this.uploadingChunk[0][key] || [];
      } else {
        this.uploadingChunk[0][key] = this.uploadingChunk[0][key] || '';
      }
    }
    this.dataText = this.papa.unparse(this.uploadingChunk);
    console.log('uploading chunk', this.uploadingChunk, this.dataText);
    this.uploadCSV();
  }

  uploadCSV(): void {
    let file;
    try {
      file = new File([this.dataText], 'upload.csv');
    } catch {
      const blob = new Blob([this.dataText]);
      Object.assign(blob, {});
      file = blob as File;
    }
    this.uploader.addToQueue([file]);
    this.uploader.queue[0].withCredentials = false;
    this.uploader.uploadAll();
    this.uploading = true;
  }

  close(): void {
    if (!this.firstImport) {
      this.handlerService.bulkContactAdd$();
      this.dialogRef.close({ created: true });
    } else {
      this.dialogRef.close();
    }
  }

  // exceed(): void {
  //   this.step = 5;
  //   this.confirmDuplicates();
  // }

  backVaildation(): void {
    this.invalidContacts = [];
    this.step = 2;
  }

  back(): void {
    if (this.step === 3) {
      this.step--;
    } else if (this.step === 4) {
      if (this.contactGroups.length > 0) {
        this.step--;
      } else {
        this.step -= 2;
      }
    } else if (this.step === 9) {
      this.step = this.prevDealStep;
    } else {
      this.step--;
    }
  }

  selectPageContacts(): void {
    if (this.isSelectedPage()) {
      // Deselect
      const pageContacts = this.contactsToUpload.slice(
        (this.reviewPage - 1) * this.rPSize,
        this.reviewPage * this.rPSize
      );
      const pageContactIds = pageContacts.map((e) => e.id);
      pageContactIds.forEach((e) => {
        this.selectedImportContacts.deselect(e);
      });
    } else {
      // Select
      const pageContacts = this.contactsToUpload.slice(
        (this.reviewPage - 1) * this.rPSize,
        this.reviewPage * this.rPSize
      );
      const pageContactIds = pageContacts.map((e) => e.id);
      pageContactIds.forEach((e) => {
        this.selectedImportContacts.select(e);
      });
    }
  }

  isSelectedPage(): boolean {
    const pageContacts = this.contactsToUpload.slice(
      (this.reviewPage - 1) * this.rPSize,
      this.reviewPage * this.rPSize
    );
    const pageContactIds = pageContacts.map((e) => e.id);
    const pageSelection = _.intersectionBy(
      this.selectedImportContacts.selected,
      pageContactIds
    );
    return pageSelection.length === pageContactIds.length;
  }

  /**
   * Select Action of the contacts to upload
   */
  selectAllContacts(): void {
    if (this.isSelectedContacts()) {
      this.contactsToUpload.forEach((e) => {
        this.selectedImportContacts.deselect(e.id);
      });
    } else {
      this.contactsToUpload.forEach((e) => {
        this.selectedImportContacts.select(e.id);
      });
    }
  }

  selectAllForce(): void {
    this.contactsToUpload.forEach((e) => {
      if (!this.selectedImportContacts.isSelected(e.id)) {
        this.selectedImportContacts.select(e.id);
      }
    });
  }

  deselectAllForce(): void {
    this.selectedImportContacts.clear();
  }

  isSelectedContacts(): any {
    if (this.contactsToUpload.length) {
      for (let i = 0; i < this.contactsToUpload.length; i++) {
        const e = this.contactsToUpload[i];
        if (!this.selectedImportContacts.isSelected(e.id)) {
          return false;
        }
      }
    } else {
      return false;
    }
    return true;
  }

  selectedImportContactsCount(): any {
    let result = 0;
    for (let i = 0; i < this.contactsToUpload.length; i++) {
      const e = this.contactsToUpload[i];
      if (this.selectedImportContacts.isSelected(e.id)) {
        result++;
      }
    }
    return result;
  }

  changeExceedPage(event: number): void {
    this.exceedPage = event;
  }

  changeReviewPage(event: number): void {
    this.reviewPage = event;
  }

  changeGroupPage(event: number): void {
    this.groupPage = event;
  }

  changeInvalidPage(event: number): void {
    this.invalidPage = event;
  }

  changeFailedPage(event: number): void {
    this.failedPage = event;
  }

  /**
   * Edit the contact in duplicated contact group
   * @param gIndex: Group Index
   * @param contact: contact to edit
   */
  editContact(gIndex: number, contact: Contact2I): void {
    if (contact._id) {
      const dbContact = { ...contact };
      if (dbContact.label_id) {
        dbContact.label = dbContact.label_id;
      }
      this.dialog
        .open(ContactEditComponent, {
          width: '98vw',
          maxWidth: '600px',
          disableClose: true,
          data: {
            contact: { ...dbContact },
            type: 'main'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            const updated = new Contact2I().deserialize(res);
            let code = '';
            if (updated.cell_phone.includes('+')) {
              const tel = this.phoneUtil.parse(updated.cell_phone);
              updated.cell_phone = this.phoneUtil.format(
                tel,
                PhoneNumberFormat.E164
              );
            } else {
              code = this.selectedCountry['iso2'];
              updated.cell_phone = this.getInternationalPhone(
                updated.cell_phone,
                code
              );
            }
            // updated.cell_phone = this.getInternationalPhone(updated.cell_phone);
            if (updated.label) {
              const labels = this.labelService.labels.getValue();
              labels.some((e) => {
                if (e._id === updated.label) {
                  updated.label = e.name;
                  return true;
                }
              });
            }
            this.contactGroups[gIndex].some((e, index) => {
              if (e._id === contact._id) {
                this.contactGroups[gIndex].splice(index, 1, updated);
                return true;
              }
            });
          }
        });
    } else {
      this.dialog
        .open(ImportContactEditComponent, {
          data: {
            contact: { ...contact },
            fields: { ...this._pcMatching }
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res && res['contact']) {
            const updated = new Contact2I().deserialize({ ...res['contact'] });
            let code = '';
            if (updated.cell_phone.includes('+')) {
              const tel = this.phoneUtil.parse(updated.cell_phone);
              updated.cell_phone = this.phoneUtil.format(
                tel,
                PhoneNumberFormat.E164
              );
            } else {
              code = this.selectedCountry['iso2'];
              updated.cell_phone = this.getInternationalPhone(
                updated.cell_phone,
                code
              );
            }
            // updated.cell_phone = this.getInternationalPhone(updated.cell_phone);
            if (updated) {
              this.contactGroups[gIndex].some((e, index) => {
                if (e.id === contact.id) {
                  this.contactGroups[gIndex].splice(index, 1, updated);
                  return true;
                }
              });
            }
          }
        });
    }
  }

  /**
   * Remove the contact from duplicated contact group
   * @param contact: contact to remove
   * @param gIndex: duplicated contact group
   */
  removeContact(contact: Contact2I, gIndex: number): void {
    const dialog = this.dialog.open(ConfirmComponent, {
      ...DialogSettings.CONFIRM,
      data: {
        title: 'Delete contact',
        message: 'Are you sure you want to delete this contact?',
        confirmLabel: 'Delete'
      }
    });

    dialog.afterClosed().subscribe((res) => {
      if (res) {
        if (contact._id) {
          this.contactService.bulkDelete([contact._id]).subscribe((status) => {
            if (status) {
              this.contactGroups[gIndex].some((e, index) => {
                if (e.id === contact.id) {
                  this.contactGroups[gIndex].splice(index, 1);
                }
              });
              const pos = this.groupActions[gIndex].selection.indexOf(
                contact.id
              );
              if (pos !== -1) {
                this.groupActions[gIndex].selection.splice(pos, 1);
              }
            }
          });
        } else {
          this.contactGroups[gIndex].some((e, index) => {
            if (e.id === contact.id) {
              this.contactGroups[gIndex].splice(index, 1);
            }
          });
          const pos = this.groupActions[gIndex].selection.indexOf(contact.id);
          if (pos !== -1) {
            this.groupActions[gIndex].selection.splice(pos, 1);
          }

          // remove created deal
          let sameDeals = [];
          for (const groups of this.contactGroups) {
            const contacts = groups.filter(
              (item) => item['deal_id'] === contact['deal_id']
            );
            sameDeals = [...sameDeals, ...contacts];
          }
          if (sameDeals.length === 0) {
            this.dealsService
              .deleteDeal(contact['deal_id'])
              .subscribe((res) => {});
          }
        }
      }
    });
  }

  /**
   * Get the duplicated contact groups count (unmerged)
   * @returns: number
   */
  getDuplicateContactCount(): number {
    return _.countBy(this.contactGroups, (e) => e.length > 1);
  }

  /**
   * Delete the selected contacts from duplicated contact group
   * @param gIndex: Group Index
   */
  bulkRemove(gIndex: number): void {
    const contactIds = this.groupActions[gIndex].selection;
    const contactsToRemove = this.contactGroups[gIndex].filter((e) => {
      return contactIds.indexOf(e.id) !== -1;
    });
    const dialog = this.dialog.open(ConfirmComponent, {
      ...DialogSettings.CONFIRM,
      data: {
        title: 'Delete contacts',
        message: 'Are you sure you want to delete selected contacts?',
        confirmLabel: 'Delete'
      }
    });
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        const csvContactIds = [];
        const dbContactIds = [];
        contactsToRemove.forEach((e) => {
          if (e._id) {
            dbContactIds.push(e.id);
          } else {
            csvContactIds.push(e.id);
          }
        });
        this.contactGroups[gIndex] = this.contactGroups[gIndex].filter((e) => {
          if (csvContactIds.indexOf(e.id) === -1) {
            return true;
          }
        });
        this.groupActions[gIndex].selection = _.difference(
          this.groupActions[gIndex].selection,
          csvContactIds
        );
        if (dbContactIds.length > 0) {
          this.groupActions[gIndex].deleting = true;
          this.contactService.bulkDelete(dbContactIds).subscribe((status) => {
            this.groupActions[gIndex].deleting = false;
            if (status) {
              this.contactGroups[gIndex] = this.contactGroups[gIndex].filter(
                (e) => {
                  if (dbContactIds.indexOf(e.id) === -1) {
                    return true;
                  }
                }
              );
              this.groupActions[gIndex].selection = _.difference(
                this.groupActions[gIndex].selection,
                dbContactIds
              );
            }
          });
        }
      }
    });
  }

  /**
   * Download the Exceeded contacts as CSV file
   */
  downloadExceed(): void {
    const headers = [];
    for (const key in this.updateColumn) {
      if (this.updateColumn[key]) {
        headers.push(this.updateColumn[key]);
      }
    }
    const downloadContacts = [];
    for (const contact of this.exceedContacts) {
      const duplicate: any = Object.assign({}, contact);
      if (Array.isArray(duplicate['notes'])) {
        duplicate['notes'] = duplicate['notes'].join('     ');
      }
      if (Array.isArray(duplicate['tags'])) {
        duplicate['tags'] = duplicate['tags'].join(',');
      }
      downloadContacts.push(duplicate);
    }
    if (downloadContacts.length) {
      const replacer = (key, value) => (value === null ? '' : value); // specify how you want to handle null values here
      const csv = downloadContacts.map((row) =>
        headers
          .map((fieldName) => JSON.stringify(row[fieldName], replacer))
          .join(',')
      );
      csv.unshift(headers.join(','));
      const csvArray = csv.join('\r\n');

      const blob = new Blob([csvArray], { type: 'text/csv' });
      saveAs(blob, 'exceed.csv');
    }
  }

  /**
   * Download the Duplicated contacts as CSV file
   */
  downloadReview(): void {
    const headers = [];
    for (const key in this.updateColumn) {
      if (this.updateColumn[key]) {
        headers.push(this.updateColumn[key]);
      }
    }
    const downloadContacts = [];
    for (const contact of this.contactsToUpload) {
      const duplicate: any = Object.assign({}, contact);
      if (Array.isArray(duplicate['notes'])) {
        duplicate['notes'] = duplicate['notes'].join('     ');
      }
      if (Array.isArray(duplicate['tags'])) {
        duplicate['tags'] = duplicate['tags'].join(', ');
      }
      downloadContacts.push(duplicate);
    }
    if (downloadContacts.length) {
      const replacer = (key, value) => (value === null ? '' : value); // specify how you want to handle null values here
      const csv = downloadContacts.map((row) =>
        headers
          .map((fieldName) => JSON.stringify(row[fieldName], replacer))
          .join(',')
      );
      csv.unshift(headers.join(','));
      const csvArray = csv.join('\r\n');

      const blob = new Blob([csvArray], { type: 'text/csv' });
      saveAs(blob, 'review.csv');
    }
  }

  downloadCSV(contacts: Contact2I[], fileName: string): void {
    for (const key in this.properties) {
      if (key === 'notes' || key === 'tags') {
        contacts[0][key] = contacts[0][key] || [];
      } else {
        contacts[0][key] = contacts[0][key] || '';
      }
    }

    const csvText = this.papa.unparse(contacts);

    const blob = new Blob([csvText], { type: 'text/csv' });
    saveAs(blob, fileName + '.csv');
  }

  /**
   * Get the Matchable CRMGrow Properties
   * @returns
   */
  getColumnFields(): any {
    const selectedProperties = [];
    for (const key in this.updateColumn) {
      if (this.updateColumn[key] && this.updateColumn[key] !== 'notes') {
        selectedProperties.push(this.updateColumn[key]);
      }
    }
    const remainedProperties = this.fields.filter((field) => {
      return selectedProperties.indexOf(field.value) === -1;
    });
    return remainedProperties;
  }

  /**
   * Check if the contact field value is valid value.
   * @param value: Contact Field Data
   * @param field: Field to check the validation
   * @returns
   */
  isValidField(value: string, field: string): boolean {
    if (
      field !== 'email' &&
      field !== 'cell_phone' &&
      field !== 'secondary_email' &&
      field !== 'secondary_phone'
    ) {
      return true;
    }
    if (field === 'email' || field === 'secondary_email') {
      return this.isValidEmail(value);
    }
    if (field === 'cell_phone' || field === 'secondary_phone') {
      return this.isValidPhone(value + '');
    }
  }

  /**
   * Check if the phone number is valid
   * @param val: string
   * @returns
   */
  isValidPhone(val: string): boolean {
    if (val === '') {
      return true;
    } else {
      if (PhoneNumber(val).isValid() || this.matchUSPhoneNumber(val)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Phone Number to US Phone Number
   * @param phoneNumberString: String
   * @returns
   */
  matchUSPhoneNumber(phoneNumberString: string): string {
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
    let phoneNumber;
    if (match) {
      phoneNumber = '(' + match[2] + ') ' + match[3] + '-' + match[4];
    }
    return phoneNumber;
  }

  /**
   * Check if the string is email
   * @param val : Email Address String
   * @returns : check is email
   */
  isValidEmail(val: string): boolean {
    if (val !== '' && validateEmail(val)) {
      return true;
    }
    return false;
  }

  /**
   * Convert the General number to International Number
   * @param phoneNumber: Local number or international number
   * @returns: International Format number
   */
  getInternationalPhone(phoneNumber: string, code: string): any {
    if (phoneNumber) {
      try {
        const formatted = this.phoneUtil.format(
          this.phoneUtil.parse(phoneNumber, code),
          PhoneNumberFormat.E164
        );
        return formatted;
      } catch (err) {
        return '';
      }
    }
    return '';
  }

  /**
   * Byte to Human Read Size
   * @param bytes: Number (Bytes)
   * @param si: (1000 is 1024 in Per Unit)
   * @param dp:
   * @returns string
   */
  humanFileSize(bytes, si = true, dp = 1): any {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
      return bytes + ' B';
    }

    const units = si
      ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
      bytes /= thresh;
      ++u;
    } while (
      Math.round(Math.abs(bytes) * r) / r >= thresh &&
      u < units.length - 1
    );

    return bytes.toFixed(dp) + ' ' + units[u];
  }

  /**
   * Scroll to that element
   * @param id: element id to scroll
   */
  scrollToEl(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }

  checkDeal(): void {
    if (
      this.selectedImportContacts.selected &&
      this.selectedImportContacts.selected.length <= 0
    ) {
      return;
    }
    if (!this.contactsToUpload.length) {
      return;
    }

    this.selectedContactsToUpload = this.contactsToUpload.filter((e) => {
      return this.selectedImportContacts.selected.indexOf(e.id) !== -1;
    });

    // check duplicate deal
    this.checkDuplicateDeal();
    if (this.dealGroups.length > 0) {
      this.prevDealStep = this.step;
      this.step = 9;
    } else {
      this.upload();
    }
  }
  /**
   * Check duplicated contacts by deal and group by deal.
   */
  checkDuplicateDeal(): void {
    this.dealGroups = [];
    for (const contact of this.selectedContactsToUpload) {
      if (contact.deal && contact.deal !== '') {
        const index = this.dealGroups.findIndex(
          (item) => item['deal'] === contact.deal
        );
        if (index >= 0) {
          this.dealGroups[index]['contacts'].push(contact);
        } else {
          this.dealGroups.push({
            deal: contact.deal,
            contacts: [contact],
            primary: contact,
            deal_stage: this.stages[0]._id
          });
        }
      }
    }
    this.dealGroupPage = 1;
  }

  changeDealGroupPage(event: number): void {
    this.dealGroupPage = event;
  }

  setPrimaryOfDeal(group, contact): void {
    group['primary'] = contact;
  }

  isPrimaryOfDeal(group, contact): boolean {
    return group['primary'].id === contact.id;
  }

  skipCreateDeal(): void {}

  createDealRecursive(): void {
    const dealGroup = this.dealGroups.slice(0, 49);
    const data = {
      deals: dealGroup
    };
    this.dealsService.bulkCreate(data).subscribe((res) => {
      if (res && res.data) {
        // set deal id to contact
        const dealIds = res.data;
        for (const dealItem of dealGroup) {
          const index = dealIds.findIndex(
            (item) => item.deal_name === dealItem.deal
          );
          if (index >= 0) {
            const dealId = dealIds[index].deal_id;
            for (const contact of dealItem.contacts) {
              contact['deal_id'] = dealId;
              if (contact.id === dealItem.primary.id) {
                contact['primary_contact'] = true;
              }
              const uploadIndex = this.contactsToUpload.findIndex(
                (item) => item.id === contact.id
              );
              if (uploadIndex >= 0) {
                this.contactsToUpload[uploadIndex] = contact;
              }
            }
          }
        }
        this.createdDealCount += dealIds.length;
        this.createdDealPercent = Math.ceil(
          (this.createdDealCount / this.overallDealCount) * 100
        );
        this.dealGroups = this.dealGroups.slice(49);
        if (this.dealGroups.length > 0) {
          this.createDealRecursive();
        } else {
          setTimeout(() => {
            this.creatingDeals = false;
            this.upload();
          }, 1000);
        }
      }
    });
  }

  getOverflowContactsText(group): string {
    if (group.contacts && group.contacts.length > 10) {
      return 'Deal contains more less than 10 contacts.';
    }
    return '';
  }

  bulkCreateDeal(): void {
    // check overflow contacts count in same deal.
    let hasOverflowContacts = false;
    let overflowIndex = 0;
    for (let i = 0; i < this.dealGroups.length; i++) {
      if (this.dealGroups[i].contacts.length > 10) {
        hasOverflowContacts = true;
        overflowIndex = i;
        break;
      }
    }
    // scroll to that element
    if (hasOverflowContacts) {
      this.dealGroupPage = Math.floor(overflowIndex / this.dgPSize) + 1;
      setTimeout(() => {
        this.scrollToEl('deal-group-' + overflowIndex);
      }, 100);
    } else {
      this.step = 5;
      this.creatingDeals = true;
      this.overallDealCount = this.dealGroups.length;
      this.createDealRecursive();
    }
  }

  loadDealStage(): void {
    this.dealsService.easyLoad(true);
    this.dealStageLoadSubscription &&
      this.dealStageLoadSubscription.unsubscribe();
    this.dealStageLoadSubscription = this.dealsService.stages$.subscribe(
      (res) => {
        this.stages = [...res];
        if (this.stages.length === 0) {
          // this.dealsService.getStage(true);
          this.dealsService.easyLoadStage(
            true,
            this.dealsService.selectedPipeline.getValue()
          );
          this.dealsService.stages$.subscribe((response) => {
            this.stages = [...response];
          });
        }
      }
    );
  }

  removeContactFromDeal(contact, group, index): void {
    if (group.contacts.length === 1) {
      this.dealGroups.splice(index, 1);
    } else {
      const dealIndex = group.contacts.findIndex(
        (item) => item.id === contact.id
      );
      if (dealIndex >= 0) {
        group.contacts.splice(dealIndex, 1);
      }
      if (group.primary && group.primary.id === contact.id) {
        group.primary = group.contacts[0];
      }
    }
    const contactIndex = this.contactsToUpload.findIndex(
      (item) => item.id === contact.id
    );
    if (contactIndex >= 0) {
      this.contactsToUpload.splice(contactIndex, 1);
    }
  }

  bulkAssignAutomation(automation): void {
    if (
      this.selectedImportContacts.selected &&
      this.selectedImportContacts.selected.length <= 0
    ) {
      return;
    }
    this.selectedContactsToUpload = this.contactsToUpload.filter((e) => {
      return this.selectedImportContacts.selected.indexOf(e.id) !== -1;
    });
    for (let i = 0; i < this.selectedContactsToUpload.length; i++) {
      this.selectedContactsToUpload[i]['assign_automation'] = automation;
      if (automation) {
        this.selectedContactsToUpload[i]['automation_id'] = automation._id;
      } else {
        this.selectedContactsToUpload[i]['automation_id'] = null;
      }
    }
  }

  assignAutomation($event, contact): void {
    contact['assign_automation'] = $event;
    if ($event) {
      contact['automation_id'] = $event._id;
    } else {
      contact['automation_id'] = null;
    }
  }

  fields = [
    {
      value: 'first_name',
      label: 'First Name'
    },
    {
      value: 'last_name',
      label: 'Last Name'
    },
    {
      value: 'email',
      label: 'Primary Email'
    },
    {
      value: 'cell_phone',
      label: 'Primary Phone'
    },
    {
      value: 'secondary_email',
      label: 'Secondary Email'
    },
    {
      value: 'secondary_phone',
      label: 'Secondary Phone'
    },
    {
      value: 'brokerage',
      label: 'Company'
    },
    {
      value: 'website',
      label: 'Website'
    },
    {
      value: 'address',
      label: 'Address'
    },
    {
      value: 'country',
      label: 'Country'
    },
    {
      value: 'state',
      label: 'State'
    },
    {
      value: 'city',
      label: 'City'
    },
    {
      value: 'zip',
      label: 'Zipcode'
    },
    {
      value: 'tags',
      label: 'Tags'
    },
    {
      value: 'source',
      label: 'Source'
    },
    {
      value: 'label',
      label: 'Label'
    },
    {
      value: 'notes',
      label: 'Notes'
    },
    {
      value: 'deal',
      label: 'Deal'
    }
  ];
  properties = {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Primary Email',
    cell_phone: 'Primary Phone',
    secondary_email: 'Secondary Email',
    secondary_phone: 'Secondary Phone',
    brokerage: 'Company',
    website: 'Website',
    address: 'Address',
    country: 'Country',
    state: 'State',
    city: 'City',
    zip: 'Zipcode',
    tags: 'Tags',
    source: 'Source',
    label: 'Label',
    notes: 'Notes',
    deal: 'Deal',
    automation_id: 'Automation'
  };
  mainFields = [
    'first_name',
    'last_name',
    'email',
    'cell_phone',
    'secondary_email',
    'secondary_phone'
  ];

  orderOriginal = (a: string, b: string): number => {
    if (a == 'notes') {
      return -1;
    }
    return 0;
  };
}
