import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CONTACT_SORT_OPTIONS,
  STATUS
} from 'src/app/constants/variable.constants';
import { Garbage } from 'src/app/models/garbage.model';
import { Contact, ContactActivity } from 'src/app/models/contact.model';
import { SearchOption } from 'src/app/models/searchOption.model';
import { UserService } from 'src/app/services/user.service';
import { ContactService } from 'src/app/services/contact.service';
import { StoreService } from 'src/app/services/store.service';
import { DealsService } from '../../services/deals.service';
import { HandlerService } from 'src/app/services/handler.service';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { CustomFieldAddComponent } from '../custom-field-add/custom-field-add.component';
import { CustomFieldDeleteComponent } from '../custom-field-delete/custom-field-delete.component';
import { User } from 'src/app/models/user.model';
import { MatDrawer } from '@angular/material/sidenav';

@Component({
  selector: 'app-custom-fields',
  templateUrl: './custom-fields.component.html',
  styleUrls: ['./custom-fields.component.scss']
})
export class CustomFieldsComponent implements OnInit {
  garbage: Garbage = new Garbage();
  STATUS = STATUS;
  NORMAL_COLUMNS = ['contact_name', 'custom_field'];
  SORTED_COLUMNS = ['contact_name', 'contact_label', 'contact_email'];
  DISPLAY_COLUMNS = this.NORMAL_COLUMNS;
  @ViewChild('cdrawer') cdrawer: MatDrawer;
  lead_fields: any[] = []; //sniper88t
  selection: Contact[] = [];
  pageSelection: Contact[] = [];
  pageContacts: ContactActivity[] = [];
  stageContacts = {};
  stageLoadSubscription: Subscription;
  garbageSubscription: Subscription; //sniper88t
  profileSubscription: Subscription;
  fieldsSubscription: Subscription;

  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  sortType = '';
  userId = '';
  user: User = new User();
  loading = false;
  isSearchByCustom = false;
  newFields = [];
  pageSize = this.PAGE_COUNTS[3];
  page = 1;
  searchOption: SearchOption = new SearchOption();
  initDropdownValue = {
    label: 'Select ALL',
    value: 'all'
  };
  selectedField = {
    id: '',
    name: '',
    placeholder: '',
    options: [],
    type: '',
    status: false
  };
  selectedDropdown = {
    label: 'Select ALL',
    value: 'all'
  };
  searchStr = '';
  customField = '';
  customFields = [];
  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private userService: UserService,
    public dealsService: DealsService,
    private handlerService: HandlerService,
    public contactService: ContactService,
    public storeService: StoreService
  ) {
    this.loading = true;
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      if (res && res._id) {
        this.userId = res._id;
        this.user = res;
      }
    });
  }

  ngOnInit(): void {
    this.handlerService.pageName.next('contacts');
    const pageSize = this.contactService.pageSize.getValue();
    this.pageSize = { id: pageSize, label: pageSize + '' };
    //sniper88t
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        this.lead_fields = _garbage.additional_fields.map((e) => e);
      }
    );
    const garbage = this.userService.garbage.getValue();
    if (
      !garbage ||
      !garbage.additional_fields ||
      !garbage.additional_fields.length
    ) {
      this.contactService.customAllFields();
    } else {
      this.contactService.garbage.next(garbage);
    }
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

  addField(): void {
    this.dialog
      .open(CustomFieldAddComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          type: 'contact',
          mode: 'create'
        }
      })
      .afterClosed()
      .subscribe(() => this.contactService.customAllFields());
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
    this.contactService.customFieldSearch(
      this.page,
      this.customField,
      this.searchStr
    );
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
   * Change the search str
   */
  changeSearchStr(): void {
    this.contactService.customFieldSearch(1, this.customField, this.searchStr);
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.contactService.customFieldSearch(1, this.customField, this.searchStr);
  }
  openContacts(editData: any) {
    this.storeService.pageContacts.next([]);
    this.contactService.total.next(0);
    this.cdrawer.open();
    this.viewContact(editData);
  }
  changeOption(option: any): void {
    this.sortType = option;
    this.selectedDropdown = option;
    this.contactService.customFieldSearch(1, this.customField, option.value);
  }

  openContact(contact: ContactActivity): void {
    this.router.navigate([`contacts/${contact._id}`]);
  }

  viewContact(editData: any): void {
    this.selectedField = JSON.parse(JSON.stringify(editData));
    if (editData.type === 'dropdown') {
      this.selectedField.options = [this.initDropdownValue].concat(
        editData.options
      );
      this.customField = editData.name;
      this.isSearchByCustom = true;
      this.contactService.customFieldSearch(1, this.customField, 'all');
    } else {
      this.customField = editData.name;
      this.isSearchByCustom = true;
      this.contactService.customFieldSearch(
        1,
        this.customField,
        this.searchStr
      );
    }
  }

  editField(editData: any): void {
    this.dialog
      .open(CustomFieldAddComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          type: 'contact',
          mode: 'edit',
          field: editData
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.customField = res.name;
          this.selectedField = JSON.parse(JSON.stringify(res));
          if (res.type === 'dropdown') {
            this.selectedField.options = [this.initDropdownValue].concat(
              res.options
            );
          }
          this.contactService.customFieldSearch(
            1,
            this.customField,
            this.searchStr
          );
        }
      });
  }

  deleteField(deleteData: any): void {
    this.dialog.open(CustomFieldDeleteComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '400px',
      disableClose: true,
      data: {
        type: 'contact',
        field: deleteData
      }
    });
  }
  toggleBody(event): void {
    if (event) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }
}
