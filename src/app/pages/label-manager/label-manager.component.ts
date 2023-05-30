import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { LabelService } from '../../services/label.service';
import { ConfirmComponent } from '../../components/confirm/confirm.component';
import { MatDialog } from '@angular/material/dialog';
import { Label } from 'src/app/models/label.model';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { LabelEditColorComponent } from '../../components/label-edit-color/label-edit-color.component';
import { LabelEditComponent } from '../../components/label-edit/label-edit.component';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { StoreService } from 'src/app/services/store.service';
import { MatDrawer } from '@angular/material/sidenav';
import { Contact } from 'src/app/models/contact.model';
import { searchReg } from 'src/app/helper';
import { ContactService } from 'src/app/services/contact.service';
import { STATUS } from 'src/app/constants/variable.constants';

@Component({
  selector: 'app-label-manager',
  templateUrl: './label-manager.component.html',
  styleUrls: ['./label-manager.component.scss']
})
export class LabelManagerComponent implements OnInit, OnDestroy {
  loading = false;
  contentLoading = true;
  newLabel: Label = new Label().deserialize({
    color: '#000',
    name: ''
  });
  labelLength = 0;
  searchStr = '';
  page = 1;
  STATUS = STATUS;
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  NORMAL_COLUMNS = ['contact_name', 'label_name'];
  DISPLAY_COLUMNS = this.NORMAL_COLUMNS;
  pageSize = this.PAGE_COUNTS[3];
  saveSubscription: Subscription;
  loadLabelSubscription: Subscription;
  labelDetails = {}; // label_id: {contacts, count, loading, page}
  @ViewChild('drawer') drawer: MatDrawer;
  labelDetailSubscription: Subscription;
  label: Label = new Label();
  labels: Label[] = [];
  filteredResult = [];
  totalCount = 0;
  constructor(
    private dialog: MatDialog,
    public labelService: LabelService,
    public contactService: ContactService,
    public storeService: StoreService
  ) {}

  ngOnInit(): void {
    this.labelService.labels$.subscribe((labels) => {
      this.labelLength = 0;
      labels.forEach((e) => {
        if (e.role !== 'admin') {
          this.labelLength++;
        }
      });
    });

    this.labelService.labelItems$.subscribe((labels) => {
      labels
        ? this.labelService.loadStatus.next(STATUS.SUCCESS)
        : this.labelService.loadStatus.next(STATUS.FAILURE);
      labels.forEach((e) => {
        if (!this.labelDetails[e._id]) {
          this.labelDetails[e._id] = {
            contacts: [],
            page: 1,
            loading: false,
            count: parseInt(e.count + '')
          };
        } else {
          this.labelDetails[e._id].count = parseInt(e.count + '');
        }
      });
      this.contentLoading = false;
    });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('overflow-hidden');
  }

  editLabelColor(): void {
    this.dialog
      .open(LabelEditColorComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        maxHeight: '400px'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.newLabel.color = res;
        }
      });
  }

  saveLabel(form: NgForm): void {
    if (this.newLabel.name.replace(/\s/g, '').length == 0) {
      this.newLabel.name = '';
      return;
    }
    this.loading = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();
    this.saveSubscription = this.labelService
      .createLabel(
        this.newLabel.deserialize({ priority: (this.labelLength + 1) * 1000 })
      )
      .subscribe((newLabel) => {
        this.loading = false;
        if (newLabel) {
          this.labelService.create$(newLabel);
          this.newLabel = new Label().deserialize({
            color: '#000',
            name: ''
          });
          form.resetForm();
        }
      });
  }

  editLabel(label: Label): void {
    this.dialog
      .open(LabelEditComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        maxHeight: '400px',
        disableClose: true,
        data: label
      })
      .afterClosed()
      .subscribe((res) => {});
  }

  removeLabel(label: Label): void {
    const dialog = this.dialog.open(ConfirmComponent, {
      data: {
        title: 'Delete label',
        message: 'Are you sure to delete the label?',
        cancelLabel: 'No',
        confirmLabel: 'Delete'
      }
    });
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.labelService.deleteLabel(label._id).subscribe((status) => {
          if (status) {
            this.labelService.delete$(label._id);
          }
        });
      }
    });
  }
  changePageSize(type: any): void {
    this.page = 1;
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
  changePage(page: number): void {
    this.page = page;
    this.loadLabelPage(this.label._id);
    // this.contactService.customFieldSearch(
    //   this.page,
    //   this.customField,
    //   this.searchStr
    // );
  }
  pageChanged($event: number): void {
    this.changePage($event);
  }
  drop(event: CdkDragDrop<string[]>): void {
    this.labelService.changeOrder(event.previousIndex, event.currentIndex);
  }

  openContacts(label: Label): void {
    this.searchStr = '';
    this.drawer.open();
    this.label = label;
    if (!this.labelDetails[label._id]) {
      this.labelDetails[label._id] = {
        contacts: [],
        page: 1,
        loading: false,
        count: 0
      };
    }
    if (!this.labelDetails[label._id].contacts.length) {
      this.loadLabelPage(label._id);
    }
  }

  loadLabelPage(label: string): void {
    this.filteredResult = [];
    this.labelDetails[label].loading = true;
    this.loadLabelSubscription && this.loadLabelSubscription.unsubscribe();
    this.loadLabelSubscription = this.labelService
      .loadLabelContacts(label, this.page, this.pageSize.id, this.searchStr)
      .subscribe((res) => {
      this.labelDetails[label].loading = false;
      const contacts = [];
      res['data'].forEach((e) => {
        contacts.push(new Contact().deserialize(e));
      });
      this.labelDetails[label].contacts = contacts;
      const filtered = this.labelDetails[this.label._id].contacts.filter(
        (item) => {
          return item;
        }
      );
      this.labelService.loadDetailStatus.next(STATUS.SUCCESS);
      this.labelService.filteredResult.next(filtered);
      this.labelService.total.next(res['total']);
    });
  }

  toggleBody(event): void {
    if (event) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }
  changeSearchStr(): void {
    this.page = 1;
    this.loadLabelPage(this.label._id);
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.changeSearchStr();
  }
}
