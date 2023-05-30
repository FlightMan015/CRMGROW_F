import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { TagDeleteComponent } from 'src/app/components/tag-delete/tag-delete.component';
import { TagEditComponent } from 'src/app/components/tag-edit/tag-edit.component';
import { PACKAGE_LEVEL, STATUS } from 'src/app/constants/variable.constants';
import { Contact } from 'src/app/models/contact.model';
import { TagService } from '../../services/tag.service';
import { LabelService } from '../../services/label.service';
import { StoreService } from 'src/app/services/store.service';
import { HandlerService } from 'src/app/services/handler.service';
import { MatDrawer } from '@angular/material/sidenav';
import { searchReg } from 'src/app/helper';
import { SearchOption } from 'src/app/models/searchOption.model';
import * as _ from 'lodash';
import { Automation } from 'src/app/models/automation.model';
import { SelectAutomationComponent } from 'src/app/components/select-automation/select-automation.component';
import { AutomationService } from 'src/app/services/automation.service';
import { Garbage } from 'src/app/models/garbage.model';
import { UserService } from 'src/app/services/user.service';
import { ContactService } from 'src/app/services/contact.service';
import { getUserLevel } from 'src/app/utils/functions';
import { NgForm } from '@angular/forms';

interface TagDetail {
  page?: number;
  contacts?: Contact[];
  loading?: boolean;
}
@Component({
  selector: 'app-tag-manager',
  templateUrl: './tag-manager.component.html',
  styleUrls: ['./tag-manager.component.scss']
})
export class TagManagerComponent implements OnInit {
  contentLoading = true;
  contactLoading = false;
  newTag: '';
  searchStr = '';
  loading = false;
  STATUS = STATUS;
  tags = [];
  filteredResult = [];
  tagDetails = {}; // {tagname: {page: number, contacts: [], loading: boolean}}
  // automations: Automation[] = [];
  @ViewChild('tdrawer') tdrawer: MatDrawer;
  garbage: Garbage = new Garbage();
  garbageSubscription: Subscription;
  loadSubscription: Subscription;
  loadTagSubscription: Subscription;
  // automationSubscription: Subscription;
  loadContactsSubscription: Subscription;
  saveSubscription: Subscription;
  searchOption: SearchOption = new SearchOption();
  openedTags = [];
  maxOpened = 2;
  tagPage = 1;
  tag: any;
  contactList = [];
  page = 1;
  totalCount = 0;
  totalTags = 0;
  pageSelection = [];
  // isShowAutomation = false;
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  NORMAL_COLUMNS = ['contact_name', 'tag_name'];
  DISPLAY_COLUMNS = this.NORMAL_COLUMNS;
  pageSize = this.PAGE_COUNTS[3];
  constructor(
    private dialog: MatDialog,
    public tagService: TagService,
    public labelService: LabelService,
    private storeService: StoreService,
    private handlerService: HandlerService,
    public contactService: ContactService,
    private userService: UserService,
    private automationService: AutomationService
  ) {
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = new Garbage().deserialize(res);
    });
  }

  ngOnInit(): void {
    if (
      !this.handlerService.previousUrl ||
      this.handlerService.previousUrl.indexOf('/settings') === -1
    ) {
      this.tagService.getAllTags();
      this.labelService.getAllLabels();
      // this.contactService.customAllFields();
      const pageSize = this.contactService.pageSize.getValue();
      this.pageSize = { id: pageSize, label: pageSize + '' };
      this.contactLoading = true;
      this.tagService.loadAllContacts(this.page).subscribe((res) => {
        this.contactLoading = false;
        const contacts = [];
        res.contacts.forEach((e) => {
          const contact = new Contact().deserialize(e);
          contact['canceling'] = false;
          contacts.push(contact);
        });
        this.contactList = contacts;
        this.totalCount = res.totalCount;
        this.contentLoading = false;
      });
    }
  }

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
    document.body.classList.remove('overflow-hidden');
    // this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  openDetail(tag: string): void {
    const pos = this.openedTags.indexOf(tag);
    if (pos === -1) {
      this.openedTags.push(tag);
    }
    if (this.openedTags.length > this.maxOpened) {
      this.openedTags.shift();
    }

    if (!this.tagDetails[tag]) {
      this.tagDetails[tag] = {
        contacts: [],
        page: 1,
        loading: false
      };
    }
    if (
      !this.tagDetails[tag].contacts ||
      !this.tagDetails[tag].contacts.length
    ) {
      this.tagDetails[tag].loading = true;
      this.tagService
        .loadTagContacts(tag, this.page, this.pageSize.id, this.searchStr)
        .subscribe((res) => {
          this.tagDetails[tag].loading = false;
          const contacts = [];
          res.forEach((e) => {
            const contact = new Contact().deserialize(e);
            contact['canceling'] = false;
            contacts.push(contact);
          });
          this.tagDetails[tag].contacts = contacts;
          const filtered = this.tagDetails[this.tag?._id].contacts.filter(
            (item) => {
              return item;
            }
          );
          this.filteredResult = filtered;
        });
    }
  }
  changeSearchStr(): void {
    // const filtered = this.tagDetails[this.tag._id].contacts.filter((item) => {
    //   return searchReg(item.fullName, this.searchStr);
    // });
    // this.filteredResult = filtered;
    this.page = 1;
    this.loadTagPage(this.tag?._id);
    // this.sort(this.selectedSort, true);
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.changeSearchStr();
  }
  closeDetail(tag: string): void {
    const pos = this.openedTags.indexOf(tag);
    if (pos !== -1) {
      this.openedTags.splice(pos, 1);
    }
  }
  changeTagValue(str: string): void {}

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
  changePage(page: number): void {
    this.page = page;
    this.loadTagPage(this.tag._id);
  }
  pageChanged($event: number): void {
    this.changePage($event);
  }
  saveTag(form: NgForm): void {
    if (this.newTag.replace(/\s/g, '').length == 0) {
      this.newTag = '';
      return;
    }
    this.loading = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();
    this.saveSubscription = this.tagService
      .createTag(this.newTag)
      .subscribe((res) => {
        if (res && res.status) {
          this.loading = false;
          const newTag = {
            _id: this.newTag,
            count: 0
          };
          this.tags.push(newTag);
          this.newTag = '';
          form.resetForm();
        } else {
          this.loading = false;
        }
      });
  }

  selectContactTag(contact: Contact): void {
    if (this.isCheckedContact(contact)) {
      const pos = this.pageSelection.indexOf(contact._id);
      this.pageSelection.splice(pos, 1);
    } else {
      this.pageSelection.push(contact._id);
    }
  }

  isCheckedContact(contact: Contact): boolean {
    return this.pageSelection.indexOf(contact._id) > -1;
  }

  editTag(editTag: any): void {
    this.checkToggle(editTag._id);
    this.dialog
      .open(TagEditComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: {
          tagName: editTag._id
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.tagDetails[res] = this.tagDetails[editTag._id];
          delete this.tagDetails[editTag._id];
          editTag._id = res;
        }
      });
  }

  deleteTag(deleteTag: any): void {
    this.checkToggle(deleteTag._id);
    this.dialog
      .open(TagDeleteComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: {
          tagName: deleteTag._id,
          type: 'all'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        const tags = this.tags.filter((tag) => tag._id != res);
        this.tags = [];
        this.tags = tags;
        delete this.tagDetails[deleteTag._id];
      });
  }

  deleteContactTag(tag: any, contact: any): void {
    this.dialog
      .open(TagDeleteComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: {
          tagName: tag._id,
          contact: contact._id,
          type: 'only'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const index = this.tagDetails[tag._id].contacts.findIndex(
            (item) => item._id === contact._id
          );
          if (index != -1) {
            // if (
            //   this.tagDetails[tag._id].contacts[index].tag_automation ==
            //   'running'
            // ) {
            //   this.unassignContact(
            //     tag._id,
            //     this.tagDetails[tag._id].contacts[index]._id
            //   );
            // }
            this.tagDetails[tag._id].contacts.splice(index, 1);
            tag.count -= 1;
          }
        }
      });
  }

  // changePage1(page: number): void {
  //   this.contactLoading = true;
  //   this.page = page;
  //   this.tagService.loadAllContacts(this.page).subscribe((res) => {
  //     this.contactLoading = false;
  //     const contacts = [];
  //     res.contacts.forEach((e) => {
  //       contacts.push(new Contact().deserialize(e));
  //     });
  //     this.contactList = contacts;
  //   });
  // }
  // changePage(page: number, tag: any): void {
  //   if (!this.tagDetails[tag]) {
  //     this.tagDetails[tag] = {
  //       contacts: [],
  //       page: page,
  //       loading: false
  //     };
  //   }
  //   this.tagDetails[tag].loading = true;
  //   this.tagDetails[tag].page = page;
  //   this.tagService
  //     .loadTagContacts(tag, this.tagDetails[tag].page)
  //     .subscribe((res) => {
  //       this.tagDetails[tag].loading = false;
  //       const contacts = [];
  //       res.forEach((e) => {
  //         contacts.push(new Contact().deserialize(e));
  //       });
  //       this.tagDetails[tag].contacts = contacts;
  //     });
  // }
  // // pageChanged1(page: number): void {
  // //   this.contactLoading = true;
  // //   this.page = page;
  // //   this.tagService.loadAllContacts(this.page).subscribe((res) => {
  // //     this.contactLoading = false;
  // //     const contacts = [];
  // //     res.contacts.forEach((e) => {
  // //       contacts.push(new Contact().deserialize(e));
  // //     });
  // //     this.contactList = contacts;
  // //   });
  // // }

  toggleBody(event): void {
    if (event) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }
  openContacts(tag: any): void {
    this.filteredResult = [];
    this.searchStr = '';
    this.tdrawer.open();
    this.tag = tag;
    if (!this.tagDetails[tag._id]) {
      this.tagDetails[tag._id] = {
        contacts: [],
        page: 1,
        loading: false,
        count: 0
      };
    }
    if (!this.tagDetails[tag._id].contacts.length) {
      this.loadTagPage(tag._id);
    }
  }
  loadTagPage(tag: string): void {
    this.totalTags = 0;
    this.filteredResult = [];
    this.tagDetails[tag].loading = true;
    this.loadTagSubscription && this.loadTagSubscription.unsubscribe();
    this.loadTagSubscription = this.tagService
      .loadTagContacts(tag, this.page, this.pageSize.id, this.searchStr)
      .subscribe((res) => {
        this.tagDetails[tag].loading = false;
        const contacts = [];
        res['data'].forEach((e) => {
          contacts.push(new Contact().deserialize(e));
        });
        this.tagDetails[tag].contacts = contacts;
        const filtered = this.tagDetails[this.tag._id].contacts.filter(
          (item) => {
            return item;
          }
        );
        this.tagService.total.next(res['total']);
        this.tagService.filteredResult.next(filtered);
        this.tagService.loadDetailStatus.next(STATUS.SUCCESS);
      });
  }
  checkToggle(id: string): void {
    if (this.openedTags.indexOf(id) === -1) {
      this.openedTags.push(id);
    } else {
      const pos = this.openedTags.indexOf(id);
      this.openedTags.splice(pos, 1);
    }
  }

  // assign(id: string): void {
  //   this.checkToggle(id);
  //   this.dialog
  //     .open(SelectAutomationComponent, {
  //       position: { top: '100px' },
  //       width: '100vw',
  //       maxWidth: '400px',
  //       data: {
  //         tag_id: id
  //       }
  //     })
  //     .afterClosed()
  //     .subscribe((automation) => {
  //       if (automation) {
  //         const tagIndex = this.tags.findIndex((tag) => tag._id == id);
  //         const automationIndex = this.automations.findIndex(
  //           (e) => e._id == automation
  //         );
  //         this.tags[tagIndex].automation = this.automations[
  //           automationIndex
  //         ].title;
  //       }
  //     });
  // }

  // unAssign(id: string): void {
  //   this.checkToggle(id);
  //   if (this.garbage.tag_automation[id]) {
  //     const dialog = this.dialog.open(ConfirmComponent, {
  //       data: {
  //         title: 'Confirm Unassign Automation',
  //         message: 'Are you sure unassigned automation from this tag?',
  //         cancelLabel: 'No',
  //         confirmLabel: 'Yes'
  //       }
  //     });
  //     dialog.afterClosed().subscribe((result) => {
  //       if (result) {
  //         const index = this.tags.findIndex((tag) => tag._id == id);
  //         this.tags[index].automation = '';
  //         delete this.garbage.tag_automation[id];
  //         this.userService
  //           .updateGarbage({ tag_automation: this.garbage.tag_automation })
  //           .subscribe(() => {
  //             this.toast.success('Tag Automation successfully unassigned.');
  //             this.userService.updateGarbageImpl({
  //               tag_automation: this.garbage.tag_automation
  //             });
  //           });
  //       } else {
  //         return;
  //       }
  //     });
  //   }
  // }

  // unassignContact(tag: string, id: string): void {
  //   const dialog = this.dialog.open(ConfirmComponent, {
  //     data: {
  //       title: 'Confirm Unassign Automation',
  //       message: 'Are you sure unassigned automation from this contact?',
  //       cancelLabel: 'No',
  //       confirmLabel: 'Yes'
  //     }
  //   });
  //   dialog.afterClosed().subscribe((result) => {
  //     if (result) {
  //       const index = this.tagDetails[tag].contacts.findIndex(
  //         (contact) => contact._id == id
  //       );
  //       const contact = this.tagDetails[tag].contacts[index];
  //       contact.canceling = true;
  //       this.automationService.unAssign(id).subscribe((status) => {
  //         contact.canceling = false;
  //         if (status) {
  //           contact.tag_automation = '';
  //         }
  //       });
  //     } else {
  //       return;
  //     }
  //   });
  // }
}
