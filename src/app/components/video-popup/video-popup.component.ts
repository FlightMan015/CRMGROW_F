import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Material } from 'src/app/models/material.model';
import { Video } from 'src/app/models/video.model';
import { HelperService } from 'src/app/services/helper.service';
import { MaterialService } from 'src/app/services/material.service';
import { HtmlEditorComponent } from '../html-editor/html-editor.component';

@Component({
  selector: 'app-video-popup',
  templateUrl: './video-popup.component.html',
  styleUrls: ['./video-popup.component.scss']
})
export class VideoPopupComponent implements OnInit {
  _id = '';
  loading = false;
  submitted = false;
  saving = false;
  thumbnailLoading = false;
  video: Material = new Material();
  originalVideo: Material = new Material();
  loadSubscription: Subscription;

  @ViewChild('emailEditor') emailEditor: HtmlEditorComponent;

  constructor(
    private dialogRef: MatDialogRef<VideoPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toast: ToastrService,
    private materialService: MaterialService,
    private helperService: HelperService
  ) {
    if (this.data && this.data.id) {
      this._id = this.data.id;
      this.load();
    }
  }

  ngOnInit(): void {}

  load(): void {
    this.loading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.materialService
      .getVideoById(this._id)
      .subscribe((res) => {
        this.loading = false;
        this.video = new Material().deserialize(res);
        this.originalVideo = new Material().deserialize(res);
        if (this.video.description) {
          this.emailEditor.setValue(this.video.description);
        }
      });
  }

  save(): void {
    const videoId = this.video._id;
    const data = {};
    const keys = ['title', 'thumbnail', 'description', 'site_image'];
    keys.forEach((e) => {
      if (this.video[e] !== this.originalVideo[e]) {
        data[e] = this.video[e];
      }
    });
    this.saving = true;
    this.materialService.uploadVideoDetail(videoId, data).subscribe((res) => {
      if (res.status) {
        this.saving = false;
        // this.toast.success('Video is updated successfully');
        this.dialogRef.close(res.data);
      }
    });
  }

  openPreviewDialog(): void {
    this.helperService
      .promptForImage()
      .then((imageFile) => {
        this.thumbnailLoading = true;
        this.helperService
          .generateImageThumbnail(imageFile)
          .then((thumbnail) => {
            this.video['thumbnail'] = thumbnail;
            this.video['custom_thumbnail'] = true;
            this.helperService
              .generateImageThumbnail(imageFile, 'video_play')
              .then((image) => {
                this.thumbnailLoading = false;
                this.video['site_image'] = image;
              })
              .catch((err) => {
                this.thumbnailLoading = false;
              });
          })
          .catch(() => {
            this.thumbnailLoading = false;
            this.toast.error("Can't Load this image");
          });
      })
      .catch(() => {
        this.toast.error("Can't read this image");
      });
  }
}
