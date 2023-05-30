import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AutomationService } from '../../services/automation.service';
import { TeamService } from '../../services/team.service';
import { UserService } from '../../services/user.service';
import { Automation } from '../../models/automation.model';
import * as _ from 'lodash';
import { searchReg } from 'src/app/helper';
import { STATUS } from '../../constants/variable.constants';

@Component({
  selector: 'app-automation-browser',
  templateUrl: './automation-browser.component.html',
  styleUrls: ['./automation-browser.component.scss']
})
export class AutomationBrowserComponent implements OnInit, OnDestroy {
  DISPLAY_COLUMNS = ['select', 'title', 'action-count', 'contacts'];
  STATUS = STATUS;
  automations: any[] = [];
  loading = false;
  loadSubscription: Subscription;

  filteredResult: Automation[] = [];
  hideAutomations: any[] = [];
  searchStr = '';
  sharing = false;
  selection: any[] = [];
  shareSubscription: Subscription;
  profileSubscription: Subscription;
  teamId = '';
  userId = '';

  constructor(
    private dialogRef: MatDialogRef<AutomationBrowserComponent>,
    public automationService: AutomationService,
    private teamService: TeamService,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.teamId = this.data.team_id;
    if (this.data.hideAutomations && this.data.hideAutomations.length > 0) {
      this.hideAutomations = this.data.hideAutomations;
    }
  }

  ngOnInit(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.userId = res._id;
    });

    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.automationService.automations$.subscribe(
      (automations) => {
        this.automations = automations.filter(
          (item) =>
            item.role === undefined ||
            (item.role === 'team' && item.user === this.userId)
        );
        if (this.hideAutomations.length > 0) {
          this.automations = this.automations.filter((e) => {
            if (this.hideAutomations.indexOf(e._id) >= 0) {
              return false;
            }
            return true;
          });
        }
        this.automations = _.uniqBy(this.automations, '_id');
        this.filteredResult = this.automations;
      }
    );
    this.automationService.loadAll(true);
  }

  ngOnDestroy(): void {
    this.teamId = this.data.team_id;
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
  }

  changeSearchStr(): void {
    this.filteredResult = this.automations.filter((automation) => {
      return searchReg(automation.title, this.searchStr);
    });
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.changeSearchStr();
  }

  isAllSelected(): boolean {
    const filteredAutomationIds = [];
    this.filteredResult.forEach((e) => {
      filteredAutomationIds.push(e._id);
    });
    const selectedAutomations = _.intersection(
      this.selection,
      filteredAutomationIds
    );
    return (
      this.filteredResult.length &&
      selectedAutomations.length === this.filteredResult.length
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

  toggleElement(element: Automation): void {
    const pos = this.selection.indexOf(element._id);
    if (pos !== -1) {
      this.selection.splice(pos, 1);
    } else {
      this.selection.push(element._id);
    }
  }

  isSelected(element: Automation): boolean {
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

  getAutomationById(id): any {
    const index = this.automations.findIndex((item) => item._id === id);
    if (index >= 0) {
      return this.automations[index];
    }
    return null;
  }

  share(): void {
    this.sharing = true;
    this.shareSubscription && this.shareSubscription.unsubscribe();
    this.shareSubscription = this.teamService
      .shareAutomations([this.teamId], this.selection)
      .subscribe(
        (res) => {
          this.sharing = false;
          this.dialogRef.close({
            automations: res[0]
          });
        },
        (err) => {
          this.sharing = false;
        }
      );
  }
}
