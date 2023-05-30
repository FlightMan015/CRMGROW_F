import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { STATUS } from 'src/app/constants/variable.constants';
import { Theme } from 'src/app/models/theme.model';
import * as _ from 'lodash';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-campaign-templates',
  templateUrl: './campaign-templates.component.html',
  styleUrls: ['./campaign-templates.component.scss']
})
export class CampaignTemplatesComponent implements OnInit {
  newsletters = [];
  DISPLAY_COLUMNS = [
    'thumbnail',
    'title',
    'videos',
    'pdfs',
    'images',
    'time',
    'actions'
  ];
  ACTIONS = [];
  STATUS = STATUS;

  selectedLists = new SelectionModel<any>(true, []);
  isLoading = false;

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.themeService.getNewsletters(true);
    this.themeService.newsletters$.subscribe((newsletters) => {
      this.isLoading = false;
      if (newsletters) {
        this.newsletters = newsletters;
        this.newsletters = _.uniqBy(this.newsletters, '_id');
      }
    });
  }

  isSelectedPage(): any {
    if (this.newsletters.length) {
      for (let i = 0; i < this.newsletters.length; i++) {
        const e = this.newsletters[i];
        if (!this.selectedLists.isSelected(e._id)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  selectAllPage(): void {
    if (this.isSelectedPage()) {
      this.newsletters.forEach((e) => {
        if (this.selectedLists.isSelected(e._id)) {
          this.selectedLists.deselect(e._id);
        }
      });
    } else {
      this.newsletters.forEach((e) => {
        if (!this.selectedLists.isSelected(e._id)) {
          this.selectedLists.select(e._id);
        }
      });
    }
  }

  selectAll(): void {
    this.newsletters.forEach((e) => {
      if (!this.selectedLists.isSelected(e._id)) {
        this.selectedLists.select(e._id);
      }
    });
  }

  deselectAll(): void {
    this.newsletters.forEach((e) => {
      if (this.selectedLists.isSelected(e._id)) {
        this.selectedLists.deselect(e._id);
      }
    });
  }

  openTemplate(template: Theme): void {
    this.router.navigate(['/newsletter/edit/' + template._id]);
  }

  duplicateTemplate(template: Theme): void {
    this.router.navigate(['/newsletter/clone/' + template._id]);
  }

  deleteTemplate(template: Theme): void {
    const dialog = this.dialog.open(ConfirmComponent, {
      data: {
        title: 'Delete newsletter',
        message: 'Are you sure to delete this newsletter?',
        confirmLabel: 'Delete'
      }
    });

    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.themeService.deleteNewsletter(template._id);
      }
    });
  }
}
