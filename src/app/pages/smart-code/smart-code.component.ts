import _ from 'lodash';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { UserService } from 'src/app/services/user.service';
import { DialogSettings } from 'src/app/constants/variable.constants';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { SmartCodeAddComponent } from 'src/app/components/smart-code-add/smart-code-add.component';
import { Garbage } from 'src/app/models/garbage.model';
import { SmartCode } from 'src/app/models/smart-code.model';
import { Automation } from 'src/app/models/automation.model';
import { AutomationService } from 'src/app/services/automation.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MaterialService } from 'src/app/services/material.service';
import { StoreService } from 'src/app/services/store.service';

@Component({
  selector: 'app-smart-code',
  templateUrl: './smart-code.component.html',
  styleUrls: ['./smart-code.component.scss']
})
export class SmartCodeComponent implements OnInit {
  DISPLAY_COLUMNS = [
    'smart_code',
    'tags',
    'message',
    'materials',
    'automation',
    'actions'
  ];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];

  garbage: Garbage;
  smartCodes: SmartCode[] = [];
  automations: Automation[] = [];
  automationSubscription: Subscription;

  selection: SmartCode[] = [];
  pageSelection: SmartCode[] = [];
  pageSize = this.PAGE_COUNTS[3];
  page = 1;

  // Search Option
  filteredCodes: SmartCode[] = [];
  searchStr = '';

  loadSubscription: Subscription;
  materials: any[];

  constructor(
    private userService: UserService,
    private toast: ToastrService,
    private automationService: AutomationService,
    private materialService: MaterialService,
    private storeService: StoreService,
    private dialog: MatDialog
  ) {
    this.automationService.loadAll(false);
    this.automations = this.automationService.automations.getValue();
    this.materialService.loadOwn(true);
    this.materials = this.storeService.materials.getValue();
    this.userService.garbage$.subscribe((res) => {
      this.garbage = new Garbage().deserialize(res);
      this.smartCodes = [];
      if (this.garbage.smart_codes) {
        if (!this.automations.length) {
          this.initAutomation();
        } else {
          this.loadSmartCodes();
        }
      }
    });
  }

  ngOnInit(): void {}

  /**
   * Load the contacts: Advanced Search, Normal Search, API Call
   */
  load(): void {
    this.page = 1;
  }

  initAutomation(): void {
    this.automationSubscription && this.automationSubscription.unsubscribe();
    this.automationSubscription = this.automationService.automations$.subscribe(
      (automations) => {
        if (automations.length) {
          this.automations = automations;
          this.automations = _.uniqBy(this.automations, '_id');
          this.loadSmartCodes();
        }
      }
    );
  }

  loadSmartCodes(): void {
    for (const key in this.garbage.smart_codes) {
      const smart_code = new SmartCode().deserialize(
        this.garbage.smart_codes[key]
      );
      smart_code.code = key;
      if (this.garbage.smart_codes[key].automation) {
        const index = this.automations.findIndex(
          (e) => e._id == this.garbage.smart_codes[key].automation
        );
        if (index !== -1) {
          smart_code['automation_title'] = this.automations[index].title;
        } else {
          smart_code['automation_title'] = '';
        }
      }
      this.smartCodes.push(smart_code);
    }
    this.filter();
  }

  /**
   * Change the Page Size
   * @param type : Page size information element ({id: size of page, label: label to show UI})
   */
  changePageSize(type: any): void {
    this.pageSize = type;
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.filter();
  }

  filter(): void {
    this.selection = [];
    const words = _.uniqBy(
      this.searchStr.split(' ').sort((a, b) => (a.length > b.length ? -1 : 1)),
      (e) => e.toLowerCase()
    );
    const reg = new RegExp(words.join('|'), 'gi');
    this.filteredCodes = this.smartCodes.filter((smartCode) => {
      if (
        this.searchStr &&
        words.length &&
        _.uniqBy((smartCode.code || '').match(reg), (e) => e.toLowerCase())
          .length !== words.length
      ) {
        return false;
      }
      return true;
    });
  }

  openSmartCode(code: SmartCode): void {}

  addSmartCode(): void {
    this.dialog
      .open(SmartCodeAddComponent, {
        data: {
          garbage: this.garbage
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.created) {
        }
      });
  }

  editSmartCode(code: SmartCode): void {
    this.dialog
      .open(SmartCodeAddComponent, {
        data: {
          garbage: this.garbage,
          smartCode: code
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.created) {
        }
      });
  }

  deleteSmartCode(smartCode: SmartCode): void {
    const dialog = this.dialog.open(ConfirmComponent, {
      ...DialogSettings.CONFIRM,
      data: {
        title: 'Delete Smart Code',
        message: 'Are you sure you want to delete this smart code?',
        confirmLabel: 'Delete'
      }
    });
    dialog.afterClosed().subscribe((result) => {
      if (result) {
        const smart_codes = this.garbage.smart_codes;
        if (smartCode && smartCode.code) {
          delete smart_codes[smartCode.code];
          this.userService
            .updateGarbage({
              smart_codes
            })
            .subscribe((status) => {
              if (status) {
                this.garbage.smart_codes = smart_codes;
                this.userService.garbage.next(this.garbage);
                // this.toast.success('Smart code is deleted successfully.');
              }
            });
        }
      }
    });
  }
}
