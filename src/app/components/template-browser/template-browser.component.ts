import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TemplatesService } from '../../services/templates.service';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { Template } from 'src/app/models/template.model';
import { STATUS } from 'src/app/constants/variable.constants';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';
import { TeamService } from '../../services/team.service';
import { searchReg } from 'src/app/helper';

@Component({
  selector: 'app-template-browser',
  templateUrl: './template-browser.component.html',
  styleUrls: ['./template-browser.component.scss']
})
export class TemplateBrowserComponent implements OnInit, OnDestroy {
  DISPLAY_COLUMNS = ['select', 'title', 'template-content', 'template-type'];
  STATUS = STATUS;

  userId = '';
  emailDefault = '';
  smsDefault = '';
  deleting = false;

  templates: Template[] = [];
  filteredResult: Template[] = [];
  searchStr = '';

  profileSubscription: Subscription;
  garbageSubscription: Subscription;
  loadSubscription: Subscription;

  selection: any[] = [];
  sharing = false;
  shareSubscription: Subscription;
  hideTemplates: any[] = [];
  teamId = '';

  constructor(
    private dialogRef: MatDialogRef<TemplateBrowserComponent>,
    public templatesService: TemplatesService,
    private userService: UserService,
    private teamService: TeamService,
    private toast: ToastrService,
    private dialog: MatDialog,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.teamId = this.data.team_id;
    this.hideTemplates = this.data.hideTemplates;
  }

  ngOnInit(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (garbage) => {
        if (garbage && garbage.canned_message) {
          this.emailDefault = garbage.canned_message.email;
          this.smsDefault = garbage.canned_message.sms;
        }
      }
    );
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.userId = profile._id;
      }
    );
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.templatesService.templates$.subscribe(
      (templates) => {
        // this.templates = templates;
        this.templates = templates.filter(
          (item) =>
            item.role === undefined ||
            (item.role === 'team' && item.user === this.userId)
        );
        if (this.hideTemplates.length > 0) {
          this.templates = this.templates.filter((e) => {
            if (this.hideTemplates.indexOf(e._id) >= 0) {
              return false;
            }
            return true;
          });
        }
        this.templates = _.uniqBy(this.templates, '_id');
        this.filteredResult = this.templates;
      }
    );
    this.templatesService.loadAll(true);
  }

  ngOnDestroy(): void {
    this.teamId = this.data.team_id;
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
  }

  changeSearchStr(): void {
    this.filteredResult = this.templates.filter((template) => {
      const str =
        template.title + ' ' + template.content + ' ' + template.subject;
      return searchReg(str, this.searchStr);
    });
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.changeSearchStr();
  }

  isAllSelected(): boolean {
    const filteredTemplateIds = [];
    this.filteredResult.forEach((e) => {
      filteredTemplateIds.push(e._id);
    });
    const selectedTemplates = _.intersection(
      this.selection,
      filteredTemplateIds
    );
    return (
      this.filteredResult.length &&
      selectedTemplates.length === this.filteredResult.length
    );
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.filteredResult.forEach((e) => {
        const pos = this.selection.indexOf(e._id);
        if (pos !== -1) {
          this.selection.splice(pos, 1);
        }
      });
    } else {
      this.filteredResult.forEach((e) => {
        const pos = this.selection.indexOf(e._id);
        if (pos === -1) {
          this.selection.push(e._id);
        }
      });
    }
  }

  toggleElement(element: Template): void {
    const pos = this.selection.indexOf(element._id);
    if (pos !== -1) {
      this.selection.splice(pos, 1);
    } else {
      this.selection.push(element._id);
    }
  }

  isSelected(element: Template): boolean {
    const pos = this.selection.indexOf(element._id);
    if (pos !== -1) {
      return true;
    } else {
      return false;
    }
  }

  clearSelection(): void {
    this.selection = [];
  }

  getTemplateById(id): any {
    const index = this.templates.findIndex((item) => item._id === id);
    if (index >= 0) {
      return this.templates[index];
    }
    return null;
  }

  share(): void {
    this.sharing = true;
    this.shareSubscription && this.shareSubscription.unsubscribe();
    this.shareSubscription = this.teamService
      .shareTemplates([this.teamId], this.selection)
      .subscribe(
        (res) => {
          this.sharing = false;
          this.dialogRef.close({
            templates: res[0]
          });
        },
        (err) => {
          this.sharing = false;
        }
      );
  }
}
