import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import * as Storm from '@wavv/dialer';
import { UploadContactsComponent } from 'src/app/components/upload-contacts/upload-contacts.component';
import {
  BulkActions,
  CONTACT_SORT_OPTIONS,
  DialogSettings,
  STATUS
} from 'src/app/constants/variable.constants';
import { Contact, ContactActivity } from 'src/app/models/contact.model';
import { ContactService } from 'src/app/services/contact.service';
import { StoreService } from 'src/app/services/store.service';
import { SearchOption } from 'src/app/models/searchOption.model';
import { UserService } from '../../services/user.service';
import { DealsService } from '../../services/deals.service';
import * as _ from 'lodash';
import { saveAs } from 'file-saver';
import { MatDrawer } from '@angular/material/sidenav';
import { Subscription } from 'rxjs';
import { ContactBulkComponent } from 'src/app/components/contact-bulk/contact-bulk.component';
import { NoteCreateComponent } from 'src/app/components/note-create/note-create.component';
import { TaskCreateComponent } from 'src/app/components/task-create/task-create.component';
import { HandlerService } from 'src/app/services/handler.service';
import { ContactAssignAutomationComponent } from 'src/app/components/contact-assign-automation/contact-assign-automation.component';
import { ContactCreateComponent } from 'src/app/components/contact-create/contact-create.component';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { SendEmailComponent } from 'src/app/components/send-email/send-email.component';

import { ToastrService } from 'ngx-toastr';
import { SendTextComponent } from 'src/app/components/send-text/send-text.component';
import { ContactDeleteComponent } from 'src/app/components/contact-delete/contact-delete.component';
import { ContactShareComponent } from 'src/app/components/contact-share/contact-share.component';
import { DealCreateComponent } from 'src/app/components/deal-create/deal-create.component';
import { User } from 'src/app/models/user.model';
import { CalendarDialogComponent } from 'src/app/components/calendar-dialog/calendar-dialog.component';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit, OnDestroy {
  STATUS = STATUS;
  ACTIONS = BulkActions.Contacts;
  NORMAL_COLUMNS = [
    'select',
    'contact_name',
    'shared_with',
    'contact_label',
    'activity',
    'contact_tags',
    'contact_stages',
    'contact_email',
    'contact_phone',
    'contact_address'
  ];
  SORTED_COLUMNS = [
    'select',
    'contact_name',
    'shared_with',
    'contact_label',
    'activity_added',
    'contact_tags',
    'contact_stages',
    'contact_email',
    'contact_phone',
    'contact_address'
  ];
  DISPLAY_COLUMNS = this.NORMAL_COLUMNS;
  SORT_TYPES = [
    { id: 'alpha_up', label: 'Alphabetical Z-A' },
    { id: 'alpha_down', label: 'Alphabetical A-Z' },
    { id: 'last_added', label: 'Last added' },
    { id: 'last_activity', label: 'Last activity' }
  ];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];

  userId = '';
  user: User = new User();
  loading = false;
  @ViewChild('drawer') drawer: MatDrawer;
  @ViewChild('editPanel') editPanel: ContactBulkComponent;
  panelType = '';

  sortType = this.SORT_TYPES[1];
  pageSize = this.PAGE_COUNTS[3];
  page = 1;
  searchOption: SearchOption = new SearchOption();
  searchStr = '';

  all_ids = [];
  deleteDlgRef;
  deletePercent = 0;
  deleteChunk = 0;
  DELETE_ONCE = 100;

  lead_fields: any[] = []; //sniper88t
  selecting = false;
  selectSubscription: Subscription;
  selectSource = '';
  selection: Contact[] = [];
  pageSelection: Contact[] = [];
  pageContacts: ContactActivity[] = [];

  // Variables for Label Update
  isUpdating = false;
  updateSubscription: Subscription;
  profileSubscription: Subscription;
  disableActions = [];
  isPackageGroupEmail = true;
  isPackageText = true;
  isPackageAutomation = true;
  isPackageDialer = true;
  isPurchasedDialer = false;
  indexOfFile = 0;

  deals = [];

  stageContacts = {};
  stageLoadSubscription: Subscription;
  garbageSubscription: Subscription; //sniper88t

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    public storeService: StoreService,
    public contactService: ContactService,
    public userService: UserService,
    public dealsService: DealsService,
    private handlerService: HandlerService,
    private dialog: MatDialog,
    private toast: ToastrService
  ) {
    this.loading = true;
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      if (res && res._id) {
        this.isPackageAutomation = res.automation_info?.is_enabled;
        this.isPackageGroupEmail = res.email_info?.mass_enable;
        this.isPackageText = res.text_info?.is_enabled;
        this.isPackageDialer = res.dialer_info?.is_enabled || false;

        this.userId = res._id;
        this.user = res;
        this.loading = false;

        this.disableActions = [];
        if (!this.isPackageAutomation) {
          this.disableActions.push({
            label: 'Add automation',
            type: 'button',
            icon: 'i-automation',
            command: 'automation',
            loading: false
          });
        }
        if (!this.isPackageGroupEmail) {
          this.disableActions.push({
            label: 'Send email',
            type: 'button',
            icon: 'i-message',
            command: 'message',
            loading: false
          });
        }
        // if (!this.isPackageDialer) {
        //   this.disableActions.push({
        //     label: 'New Call',
        //     type: 'button',
        //     icon: 'i-phone',
        //     command: 'call',
        //     loading: false
        //   });
        // }

        if (res.dialer_info && res.dialer_info.is_enabled) {
          this.isPurchasedDialer = true;
        } else if (
          !res.is_primary &&
          (res['dialer'] ||
            res['parent_company'] === 'EVO' ||
            res.company === 'EVO')
        ) {
          this.isPurchasedDialer = true;
        } else {
          this.isPurchasedDialer = false;
        }
      }
    });

    this.stageLoadSubscription && this.stageLoadSubscription.unsubscribe();
    this.stageLoadSubscription = this.dealsService.stageContacts$.subscribe(
      (data) => {
        this.stageContacts = data || {};
      }
    );
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.stageLoadSubscription && this.stageLoadSubscription.unsubscribe();
    this.handlerService.pageName.next('');
  }

  ngOnInit(): void {
    this.handlerService.pageName.next('contacts');
    const pageSize = this.contactService.pageSize.getValue();
    this.pageSize = { id: pageSize, label: pageSize + '' };
    this.dealsService.getStageWithContact();
    this.storeService.pageContacts$.subscribe((contacts) => {
      this.pageContacts = contacts;
      this.pageSelection = _.intersectionBy(
        this.selection,
        this.pageContacts,
        '_id'
      );
    });

    this.contactService.searchOption$.subscribe((option: SearchOption) => {
      this.searchOption = option;
      if (this.searchOption.searchStr) {
        this.searchStr = this.searchOption.searchStr;
      }
      this.pageSelection = [];
      this.selection = [];
      this.load();
    });

    const forceReload = this.contactService.forceReload.getValue();
    if (forceReload) {
      this.contactService.reloadPage();
      this.contactService.forceReload.next(false);
    }

    const path = this.route.snapshot.routeConfig['path'];
    if (path.includes('import-csv')) {
      this.importContacts();
    }

    this.contactService.reloadPage();

    const sortInfo = this.contactService.sort.getValue();
    this.SORT_TYPES.some((e) => {
      if (e.id === sortInfo.name) {
        this.sortType = e;
        if (e.id === 'last_activity') {
          this.DISPLAY_COLUMNS = this.SORTED_COLUMNS;
        } else {
          this.DISPLAY_COLUMNS = this.NORMAL_COLUMNS;
        }
        return true;
      }
    });
    if (!this.storeService.contactPage.getValue()) {
      this.storeService.contactPage.next(1);
    }
    //sniper88t
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        this.lead_fields = _garbage.additional_fields.map((e) => e);
      }
    );
  }

  ngAfterViewInit(): void {
    if (this.handlerService.previousUrl) {
      const urlArr = this.handlerService.previousUrl.split('/');
      if (urlArr[1] == 'contacts') {
        const page = this.storeService.contactPage.getValue();
        this.changePage(page);
      }
    }
  }

  /**
   * Load the contacts: Advanced Search, Normal Search, API Call
   */
  load(): void {
    this.page = 1;
  }
  /**
   * Load the page contacts
   * @param page : Page Number to load
   */
  changePage(page: number): void {
    this.page = page;
    this.storeService.contactPage.next(page);
    if (this.searchOption.isEmpty()) {
      // Normal Load by Page
      let skip = (page - 1) * this.pageSize.id;
      skip = skip < 0 ? 0 : skip;
      this.contactService.load(skip);
    } else {
      this.contactService.advancedSearch(page);
    }
  }
  /**
   * Change the Page Size
   * @param type : Page size information element ({id: size of page, label: label to show UI})
   */
  changePageSize(type: any): void {
    const currentSize = this.pageSize.id;
    this.pageSize = type;
    this.contactService.pageSize.next(this.pageSize.id);
    // Check with the Prev Page Size
    if (currentSize < this.pageSize.id) {
      // If page size get bigger
      const loaded = this.page * currentSize;
      let newPage = Math.floor(loaded / this.pageSize.id);
      newPage = newPage > 0 ? newPage : 1;
      this.changePage(newPage);
    } else {
      this.changePage(this.page);
    }
  }
  /**
   * Change the sort column and dir
   * @param type: Sort Type
   */
  changeSort(type: any): void {
    this.sortType = type;
    this.contactService.sort.next({
      ...CONTACT_SORT_OPTIONS[type.id],
      page: this.page
    });
    if (type.id === 'last_activity') {
      this.DISPLAY_COLUMNS = this.NORMAL_COLUMNS;
    } else {
      this.DISPLAY_COLUMNS = this.SORTED_COLUMNS;
    }
  }

  /**
   * Change the search str
   */
  changeSearchStr(): void {
    // this.contactService.searchStr.next(this.searchStr);
    const searchOption = this.contactService.searchOption.getValue();
    searchOption.searchStr = this.searchStr;
    this.contactService.searchOption.next(
      new SearchOption().deserialize(searchOption)
    );
  }

  clearSearchStr(): void {
    this.searchStr = '';
    const searchOption = this.contactService.searchOption.getValue();
    searchOption.searchStr = '';
    this.contactService.searchOption.next(
      new SearchOption().deserialize(searchOption)
    );
    // this.contactService.searchStr.next('');
  }

  /**
   * Toggle All Elements in Page
   */
  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection = _.differenceBy(
        this.selection,
        this.pageSelection,
        '_id'
      );
      this.pageSelection = [];
      if (this.selection.length > 1) {
        this.disableActions.push({
          label: 'New Text',
          type: 'button',
          icon: 'i-sms-sent',
          command: 'text',
          loading: false
        });
        // if (!this.isPackageDialer) {
        //   this.disableActions.push({
        //     label: 'New Call',
        //     type: 'button',
        //     icon: 'i-phone',
        //     command: 'call',
        //     loading: false
        //   });
        // }
      } else {
        this.disableActions = [];
      }
      return;
    }
    this.pageContacts.forEach((e) => {
      if (!this.isSelected(e)) {
        this.pageSelection.push(e.mainInfo);
        this.selection.push(e.mainInfo);
      }
    });
    if (this.selection.length > 1) {
      this.disableActions.push({
        label: 'New Text',
        type: 'button',
        icon: 'i-sms-sent',
        command: 'text',
        loading: false
      });
      // if (!this.isPackageDialer) {
      //   this.disableActions.push({
      //     label: 'New Call',
      //     type: 'button',
      //     icon: 'i-phone',
      //     command: 'call',
      //     loading: false
      //   });
      // }
    } else {
      this.disableActions = [];
    }
  }
  /**
   * Toggle Element
   * @param contact : Contact
   */
  toggle(contact: ContactActivity): void {
    const selectedContact = contact.mainInfo;
    const toggledSelection = _.xorBy(
      this.pageSelection,
      [selectedContact],
      '_id'
    );
    this.pageSelection = toggledSelection;

    const toggledAllSelection = _.xorBy(
      this.selection,
      [selectedContact],
      '_id'
    );
    this.selection = toggledAllSelection;
    if (this.selection.length > 1) {
      this.disableActions.push({
        label: 'New Text',
        type: 'button',
        icon: 'i-sms-sent',
        command: 'text',
        loading: false
      });
    } else {
      this.disableActions = [];
    }
    // if (!this.isPackageDialer) {
    //   this.disableActions.push({
    //     label: 'New Call',
    //     type: 'button',
    //     icon: 'i-phone',
    //     command: 'call',
    //     loading: false
    //   });
    // }
  }
  /**
   * Check contact is selected.
   * @param contact : ContactActivity
   */
  isSelected(contact: ContactActivity): boolean {
    return _.findIndex(this.pageSelection, contact.mainInfo, '_id') !== -1;
  }
  /**
   * Check all contacts in page are selected.
   */
  isAllSelected(): boolean {
    if (this.selection.length === this.contactService.total.getValue()) {
      this.updateSelectActionStatus(false);
    } else {
      this.updateSelectActionStatus(true);
    }
    return this.pageSelection.length === this.pageContacts.length;
  }

  openFilter(): void {}

  createContact(): void {
    //sniper88t
    this.dialog
      .open(ContactCreateComponent, {
        width: '98vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          contact: {},
          lead_fields: this.lead_fields
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.created) {
          this.handlerService.reload$();
        }
        if (res && res.redirect) {
          this.router.navigate(['/settings/sms-limits']);
        }
      });
  }

  importContacts(): void {
    this.dialog
      .open(UploadContactsComponent, DialogSettings.UPLOAD)
      .afterClosed()
      .subscribe((res) => {
        if (res && res.created) {
        }
      });
  }

  /**
   * Open the contact detail page
   * @param contact : contact
   */
  openContact(contact: ContactActivity): void {
    this.router.navigate([`contacts/${contact._id}`]);
  }

  /**
   * Update the Label of the current contact or selected contacts.
   * @param label : Label to update
   * @param _id : id of contact to update
   */
  updateLabel(label: string, _id: string): void {
    const newLabel = label ? label : null;
    let ids = [];
    this.selection.forEach((e) => {
      ids.push(e._id);
    });
    if (ids.indexOf(_id) === -1) {
      ids = [_id];
    }
    this.isUpdating = true;
    this.contactService
      .bulkUpdate(ids, { label: newLabel }, {})
      .subscribe((status) => {
        this.isUpdating = false;
        if (status) {
          this.handlerService.bulkContactUpdate$(ids, { label: newLabel }, {});
        }
      });
  }

  /**
   * Run the bulk action
   * @param event Bulk Action Command
   */
  doAction(event: any): void {
    switch (event.command) {
      case 'deselect':
        this.deselectAll();
        break;
      case 'select':
        this.selectAll(true);
        break;
      case 'delete':
        this.deleteConfirm();
        break;
      case 'edit':
        this.bulkEdit();
        break;
      case 'download':
        this.downloadCSV();
        break;
      case 'message':
        this.openMessageDlg();
        break;
      case 'add_note':
        this.openNoteDlg();
        break;
      case 'add_task':
        this.openTaskDlg();
        break;
      case 'automation':
        this.openAutomationDlg();
        break;
      case 'deal':
        this.openDealDlg();
        break;
      case 'appointment':
        this.openAppointmentDlg();
        break;
      case 'call':
        this.call();
        break;
      case 'text':
        this.openTextDlg();
        break;
      case 'share':
        this.shareContacts();
        break;
    }
  }

  /**
   * Update the Command Status
   * @param command :Command String
   * @param loading :Whether current action is running
   */
  updateActionsStatus(command: string, loading: boolean): void {
    this.ACTIONS.some((e) => {
      if (e.command === command) {
        e.loading = loading;
        return true;
      }
    });
  }

  updateSelectActionStatus(status: boolean): void {
    this.ACTIONS.some((e) => {
      if (e.command === 'select') {
        e.spliter = status;
      }
    });
  }

  /**
   * Download CSV
   */
  call(): void {
    // if (this.isPackageDialer) {
    // } else {
    //   this.dialog.open(DialPlanComponent, {
    //     width: '100vw',
    //     maxWidth: '800px'
    //   });
    // }
    const contacts = [];
    this.selection.forEach((e) => {
      const contactObj = new Contact().deserialize(e);
      const contact = {
        contactId: contactObj._id,
        numbers: [contactObj.cell_phone],
        name: contactObj.fullName
      };
      contacts.push(contact);
    });
    this.handlerService.callCommand.next({
      contacts,
      type: 'bulk'
    });
  }

  purchaseDialer(): void {
    Storm.purchaseDialer();
  }

  shareContacts(): void {
    this.dialog
      .open(ContactShareComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          contacts: this.selection
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res.data) {
          this.selection.forEach((contact) => {
            const e = new ContactActivity().deserialize(contact);
            this.toggle(e);
          });
          this.handlerService.reload$();
        }
      });
  }

  /**
   * Download CSV
   */
  csvEngin(contacts: any): void {
    this.indexOfFile += 1;
    const replacer = (key, value) => (value === null ? '' : value); // specify how you want to handle null values here
    const header = Object.keys(contacts[0]);
    const csv = contacts.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(',')
    );
    csv.unshift(header.join(','));
    const csvArray = csv.join('\r\n');

    const blob = new Blob([csvArray], { type: 'text/csv' });
    const date = new Date();
    const fileName = `crmgrow Contacts-${this.indexOfFile}(${date.getDate()}-${
      date.getMonth() + 1
    }-${date.getFullYear()} ${date.getHours()}-${date.getMinutes()})`;
    saveAs(blob, fileName + '.csv');
  }
  downloadCSV(): void {
    let contacts = [];
    let cnt = 0;
    for (let i = 0; i < Math.ceil(this.selection.length / 1000); i += 1) {
      const ids = [];
      this.selection.forEach((e, index) => {
        if (
          index >= 1000 * i &&
          index <
            (1000 * (i + 1) < this.selection.length
              ? 1000 * (i + 1)
              : this.selection.length)
        ) {
          ids.push(e._id);
        }
      });
      this.updateActionsStatus('download', true);
      this.contactService.downloadCSV(ids).subscribe((data) => {
        data.forEach((e) => {
          const contact = {
            first_name: e.contact.first_name,
            last_name: e.contact.last_name,
            email: e.contact.email,
            phone: e.contact.cell_phone,
            source: e.contact.source,
            brokerage: e.contact.brokerage,
            city: e.contact.city,
            state: e.contact.state,
            zip: e.contact.zip,
            address: e.contact.address,
            secondary_email: e.contact.secondary_email,
            secondary_phone: e.contact.secondary_phone
          };
          const notes = [];
          if (e.note && e.note.length) {
            e.note.forEach((note) => {
              notes.push(note.content);
            });
          }
          let label = '';
          if (e.contact.label) {
            label = e.contact.label.name || '';
          }
          contact['note'] = notes.join('     ');
          contact['note'] = contact['note'].replace(/<[^>]+>/g, '');
          contact['tags'] = e.contact.tags.join(', ');
          contact['label'] = label;
          contacts.push(contact);
          cnt += 1;
          if ((cnt > 0 && cnt % 10000 === 0) || cnt === this.selection.length) {
            this.csvEngin(contacts);
            contacts = [];
          }
        });
        this.updateActionsStatus('download', false);
      });
    }
  }

  /**
   * Select All Contacts
   */
  selectAll(source = false): void {
    if (source) {
      this.updateActionsStatus('select', true);
      this.selectSource = 'header';
    } else {
      this.selectSource = 'page';
    }
    if (this.searchOption.isEmpty()) {
      this.selecting = true;
      this.selectSubscription && this.selectSubscription.unsubscribe();
      this.selectSubscription = this.contactService
        .selectAll()
        .subscribe((contacts) => {
          this.selecting = false;
          this.selection = _.unionBy(this.selection, contacts, '_id');
          this.pageSelection = _.intersectionBy(
            this.selection,
            this.pageContacts,
            '_id'
          );
          this.updateActionsStatus('select', false);
          this.updateSelectActionStatus(false);
        });
    } else {
      this.selecting = true;
      this.selectSubscription && this.selectSubscription.unsubscribe();
      this.selectSubscription = this.contactService
        .advancedSelectAll(this.searchOption)
        .subscribe((contacts) => {
          this.selecting = false;
          this.selection = _.unionBy(this.selection, contacts, '_id');
          this.pageSelection = _.intersectionBy(
            this.selection,
            this.pageContacts,
            '_id'
          );
          this.updateActionsStatus('select', false);
          this.updateSelectActionStatus(false);
        });
    }
  }

  deselectAll(): void {
    this.pageSelection = [];
    this.selection = [];
    this.updateSelectActionStatus(true);
  }

  /**
   * Delete Selected Contacts
   */
  deleteConfirm(): void {
    const dialog = this.dialog.open(ConfirmComponent, {
      ...DialogSettings.CONFIRM,
      data: {
        title: 'Delete contacts',
        message: 'Are you sure you want to delete selected contacts?',
        confirmLabel: 'Delete'
      }
    });
    dialog.afterClosed().subscribe((result) => {
      if (result) {
        if (this.selection.length > 50) {
          this.all_ids = [];
          this.selection.forEach((e) => {
            this.all_ids.push(e._id);
          });
          this.deleteDlgRef = this.dialog.open(ContactDeleteComponent, {
            width: '98vw',
            maxWidth: '840px',
            disableClose: true
          });
          this.deleteDlgRef.componentInstance.allCount = this.all_ids.length;
          this.delete();
        } else {
          const ids = [];
          this.selection.forEach((e) => {
            ids.push(e._id);
          });
          this.contactService.bulkDelete(ids).subscribe((status) => {
            if (!status) {
              return;
            }

            if (this.searchStr || !this.searchOption.isEmpty()) {
              // Searched Contacts
              this.pageSelection = [];
              this.contactService.delete$([...this.selection]);
              this.selection = [];
            } else {
              // Pages Contacts
              this.pageSelection = [];
              const { total, page } = this.contactService.delete$([
                ...this.selection
              ]);
              this.selection = [];
              if (page) {
                this.handlerService.reload$();
              }
              const maxPage =
                total % this.pageSize.id
                  ? Math.floor(total / this.pageSize.id) + 1
                  : total / this.pageSize.id;
              if (maxPage >= this.page) {
                this.changePage(this.page);
              }
            }
            // this.toast.success('Seleted contacts are deleted successfully.');
          });
        }
      }
    });
  }

  delete(): void {
    const all = [...this.all_ids];
    const ids = all.splice(
      this.deleteChunk,
      this.deleteChunk + this.DELETE_ONCE
    );
    if (this.deleteChunk + this.DELETE_ONCE > this.all_ids.length) {
      this.deleteChunk = this.all_ids.length;
      this.DELETE_ONCE = this.all_ids.length % this.DELETE_ONCE;
    } else {
      this.deleteChunk += this.DELETE_ONCE;
    }
    this.deleteImpl(ids);
  }

  deleteImpl(ids: any): void {
    this.contactService.bulkDelete(ids).subscribe((status) => {
      if (!status) {
        return;
      }

      if (this.searchStr || !this.searchOption.isEmpty()) {
        // Searched Contacts
        const selection = [...this.selection.splice(0, this.DELETE_ONCE)];
        this.pageSelection = [];
        this.contactService.delete$([...selection]);
      } else {
        // Pages Contacts
        const selection = this.selection.splice(0, this.DELETE_ONCE);
        this.pageSelection = [];
        const { total, page } = this.contactService.delete$([...selection]);
        if (page) {
          this.handlerService.reload$();
        }
        const maxPage =
          total % this.pageSize.id
            ? Math.floor(total / this.pageSize.id) + 1
            : total / this.pageSize.id;
        if (maxPage >= this.page) {
          this.changePage(this.page);
        }
      }

      this.deletePercent = Math.round(
        (this.deleteChunk / this.all_ids.length) * 100
      );
      this.deleteDlgRef.componentInstance.deletePercent = this.deletePercent;
      this.deleteDlgRef.componentInstance.deletedCount = this.deleteChunk;
      if (this.deleteChunk !== this.all_ids.length) {
        this.delete();
      } else {
        this.deleteChunk = 0;
        this.deletePercent = 0;
        this.DELETE_ONCE = 100;
        this.deleteDlgRef.componentInstance.dialogRef.close();
        // this.toast.success('Seleted contacts are deleted successfully.');
      }
    });
  }

  /**
   * Bulk Edit Open
   */
  bulkEdit(): void {
    this.panelType = 'editor';
    this.drawer.open();
  }

  openMessageDlg(): void {
    this.dialog.open(SendEmailComponent, {
      position: {
        bottom: '0px',
        right: '0px'
      },
      width: '100vw',
      panelClass: 'send-email',
      backdropClass: 'cdk-send-email',
      disableClose: false,
      data: {
        contacts: this.selection
      }
    });
  }

  openTextDlg(): void {
    const contact = this.pageContacts.filter(
      (e) => e._id == this.selection[0]._id
    )[0];
    this.dialog.open(SendTextComponent, {
      position: {
        bottom: '0px',
        right: '0px'
      },
      width: '100vw',
      panelClass: 'send-email',
      backdropClass: 'cdk-send-email',
      disableClose: false,
      data: {
        type: 'single',
        contact: contact
      }
    });
  }

  openNoteDlg(): void {
    this.dialog.open(NoteCreateComponent, {
      ...DialogSettings.NOTE,
      data: {
        contacts: this.selection
      }
    });
  }

  openTaskDlg(): void {
    this.dialog.open(TaskCreateComponent, {
      ...DialogSettings.TASK,
      data: {
        contacts: this.selection
      }
    });
  }

  openAutomationDlg(): void {
    this.dialog.open(ContactAssignAutomationComponent, {
      ...DialogSettings.AUTOMATION,
      data: {
        contacts: this.selection
      }
    });
  }

  openDealDlg(): void {
    // if (this.selection.length > 10) {
    //   this.toast.warning(
    //     'Please select less or equal than 10 contacts to create a new deal with them.',
    //     'Too many contacts'
    //   );
    //   return;
    // }
    this.dialog
      .open(DealCreateComponent, {
        ...DialogSettings.DEAL,
        data: {
          contacts: this.selection
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          // Response Handler
        }
      });
  }

  openAppointmentDlg(): void {
    this.dialog.open(CalendarDialogComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '600px',
      maxHeight: '700px',
      data: {
        contacts: this.selection
      }
    });
  }

  /**
   * Handler when page number get out of the bound after remove contacts.
   * @param $event : Page Number
   */
  pageChanged($event: number): void {
    this.changePage($event);
  }

  /**
   * Panel Open and Close event
   * @param $event Panel Open Status
   */
  setPanelType($event: boolean): void {
    if (!$event) {
      this.panelType = '';
    } else {
      this.editPanel.clearForm();
    }
  }

  getSharedMembers(contact): any {
    _.remove(contact.shared_members, { _id: this.userId });
    return _.uniqBy(contact.shared_members, '_id');
  }

  getSharedUsers(contact): any {
    return _.uniqBy(contact.user, '_id');
  }

  userAvatarName(user_name = ''): string {
    const names = user_name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[1][0];
    } else {
      return names[0][0];
    }
  }

  // Reset the Selection without current Contact page to fix when merge
  // this.selection = _.differenceBy(this.selection, this.pageContacts, '_id');
  // Merge the All Selection with page Selection
  // this.selection = _.unionBy(this.selection, this.pageSelection, '_id');
}
