import { Component, Inject, OnInit } from '@angular/core';
import { LabelService } from '../../services/label.service';
import { SearchOption } from 'src/app/models/searchOption.model';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FilterService } from 'src/app/services/filter.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-filter-add',
  templateUrl: './filter-add.component.html',
  styleUrls: ['./filter-add.component.scss']
})
export class FilterAddComponent implements OnInit {
  submitted = false;
  saving = false;
  saveSubscription: Subscription;
  filterName = '';
  filterCount = 0;
  selectedLabels = [];
  selectedAction = '';
  selectedMaterial = [];
  activityConditions = [];
  searchOption: SearchOption = new SearchOption();
  filterId = '';

  constructor(
    public labelService: LabelService,
    public filterService: FilterService,
    private dialogRef: MatDialogRef<FilterAddComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.searchOption = this.data.searchOption;
    if (this.data.material && this.data.material.length > 0) {
      this.selectedMaterial.push(this.data.material[0]);
    }
    if (this.data && this.data._id) {
      this.filterId = this.data._id;
      const filters = this.filterService.filters.getValue();
      filters.some((e) => {
        if (e._id === this.filterId) {
          this.filterName = e.title;
          return true;
        }
      });
    }
    const labels = this.labelService.allLabels.getValue();
    this.searchOption.labelCondition.forEach((selectLabel) => {
      labels.forEach((label) => {
        if (label._id == selectLabel) {
          this.selectedLabels.push(label);
        }
      });
      if (selectLabel == null) {
        this.selectedLabels.push(null);
      }
    });

    this.searchOption.activityCondition.forEach((e) => {
      this.activityConditions.push(this.activityDefine[e]);
    });
    if (this.searchOption.lastMaterial.send_video.flag) {
      this.activityConditions.push('Sent video');
    }
    if (this.searchOption.lastMaterial.send_pdf.flag) {
      this.activityConditions.push('Sent PDF');
    }
    if (this.searchOption.lastMaterial.send_image.flag) {
      this.activityConditions.push('Sent image');
    }
    if (this.searchOption.lastMaterial.watched_video.flag) {
      this.activityConditions.push('Watched video');
    }
    if (this.searchOption.lastMaterial.watched_pdf.flag) {
      this.activityConditions.push('Watched PDF');
    }
    if (this.searchOption.lastMaterial.watched_image.flag) {
      this.activityConditions.push('Watched image');
    }
  }

  ngOnInit(): void {}

  getMaterialType(): string {
    if (this.selectedMaterial.length > 0 && this.selectedMaterial[0].type) {
      if (this.selectedMaterial[0].type === 'application/pdf') {
        return 'PDF';
      } else if (this.selectedMaterial[0].type.includes('image')) {
        return 'Image';
      }
    }
    return 'Video';
  }

  saveFilter(): void {
    this.saving = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();
    if (!this.filterId) {
      this.saveSubscription = this.filterService
        .create({
          title: this.filterName,
          content: this.searchOption
        })
        .subscribe((result) => {
          this.saving = false;
          if (result) {
            this.filterService.create$(result);
            this.dialogRef.close();
          }
        });
    } else {
      this.saveSubscription = this.filterService
        .update(this.filterId, {
          title: this.filterName,
          content: this.searchOption
        })
        .subscribe((result) => {
          this.saving = false;
          if (result) {
            this.dialogRef.close();
            this.filterService.update$(this.filterId, {
              title: this.filterName,
              content: this.searchOption
            });
          }
        });
    }
  }

  activityDefine = {
    contacts: 'Just added',
    notes: 'Added note',
    follow_ups: 'Task added',
    phone_logs: 'Call',
    email_trackers: 'Opened email',
    emails: 'Sent email',
    clicked_link: 'Clicked link',
    videos: 'Sent video',
    pdfs: 'Sent PDF',
    images: 'Sent image',
    video_trackers: 'Watched Video',
    pdf_trackers: 'Reviewed PDF',
    image_trackers: 'Reviewed image'
  };
}
