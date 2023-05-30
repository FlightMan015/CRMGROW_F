import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivityService } from '../../services/activity.service';
import { Subscription } from 'rxjs';
import { MaterialService } from '../../services/material.service';
import { LabelService } from '../../services/label.service';
import { HandlerService } from 'src/app/services/handler.service';
import { ROUTE_PAGE } from 'src/app/constants/variable.constants';
import { environment } from 'src/environments/environment';
import { UserService } from 'src/app/services/user.service';
import { MaterialSendComponent } from 'src/app/components/material-send/material-send.component';
import { LinkContactAssignComponent } from 'src/app/components/link-contact-assign/link-contact-assign.component';
import { MatDialog } from '@angular/material/dialog';
import { Material } from 'src/app/models/material.model';
import { Clipboard } from '@angular/cdk/clipboard';
import { ToastrService } from 'ngx-toastr';
import { ContactCreateComponent } from 'src/app/components/contact-create/contact-create.component';
import { MaterialEditTemplateComponent } from 'src/app/components/material-edit-template/material-edit-template.component';
import { LeadCaptureFormComponent } from 'src/app/components/lead-capture-form/lead-capture-form.component';
import { VideoEditComponent } from 'src/app/components/video-edit/video-edit.component';
import { PdfEditComponent } from 'src/app/components/pdf-edit/pdf-edit.component';
import { ImageEditComponent } from 'src/app/components/image-edit/image-edit.component';
import { SocialShareComponent } from 'src/app/components/social-share/social-share.component';
import { NotifyComponent } from 'src/app/components/notify/notify.component';
import { MoveFolderComponent } from 'src/app/components/move-folder/move-folder.component';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { TeamMaterialShareComponent } from 'src/app/components/team-material-share/team-material-share.component';
import { v4 as uuidv4 } from 'uuid';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-analytics-material',
  templateUrl: './analytics-material.component.html',
  styleUrls: ['./analytics-material.component.scss']
})
export class AnalyticsMaterialComponent implements OnInit {
  isLoading = false;
  material_id = '';
  material_type = '';
  user_id = '';
  siteUrl = environment.website;
  loadSubcription: Subscription;
  profileSubscription: Subscription;
  garbageSubscription: Subscription;
  analytics;
  material;
  topExpanded = true;
  lowExpanded = true;
  contacts = [];
  labels = [];
  tracks = [];
  trackActivity;
  activity;
  lead_fields: any[] = [];
  analytic_material: Material;
  selectedFolder: Material;
  materialDeleteSubscription: Subscription;
  routeSubscription: Subscription;
  constructor(
    private dialog: MatDialog,
    private myElement: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private materialService: MaterialService,
    private labelService: LabelService,
    private handlerService: HandlerService,
    private clipboard: Clipboard,
    private toast: ToastrService,
    private activityService: ActivityService
  ) {
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.user_id = profile._id;
      }
    );
  }

  ngOnInit(): void {
    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.routeSubscription = this.route.params.subscribe((params) => {
      this.material_id = params['id'];
      this.material_type = params['material_type'];
      if (params['activity']) {
        this.activity = params['activity'];
      }
      if (this.material_id) {
        this.loadData(this.material_id, this.material_type);
        this.getLabels();
        // if (this.trackActivity) {
        //   this.scrollToEl();
        // }
      }
    });
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        this.lead_fields = _garbage.additional_fields.map((e) => e);
      }
    );
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.routeSubscription && this.routeSubscription.unsubscribe();
  }
  generateTrackableLink(): void {
    let url;
    let tempData;
    const material = this.analytic_material;
    if (material.material_type == 'video') {
      tempData = {
        content: 'generated link',
        send_uuid: uuidv4(),
        type: 'videos',
        videos: [material._id]
      };
    } else if (material.material_type == 'pdf') {
      tempData = {
        content: 'generated link',
        send_uuid: uuidv4(),
        type: 'pdfs',
        pdfs: [material._id]
      };
    } else {
      tempData = {
        content: 'generated link',
        send_uuid: uuidv4(),
        type: 'images',
        images: [material._id]
      };
    }
    this.materialService.createActivity(tempData).subscribe((res) => {
      if (res) {
        if (material.material_type == 'video') {
          url = environment.website + '/video6/' + tempData.send_uuid;
        } else if (material.material_type == 'pdf') {
          url = environment.website + '/pdf6/' + tempData.send_uuid;
        } else if (material.material_type == 'image') {
          url = environment.website + '/image6/' + tempData.send_uuid;
        }
        this.clipboard.copy(url);
        this.toast.success('Generated the trackable link to clipboard');
      }
    });
  }
  loadData(id, type): void {
    this.isLoading = true;
    this.loadSubcription && this.loadSubcription.unsubscribe();
    const pageOption = this.materialService.pageOption.getValue();
    this.selectedFolder = pageOption['selectedFolder'];
    this.loadSubcription = this.materialService
      .getAnalytics(id, type)
      .subscribe((res) => {
        this.isLoading = false;
        if (res) {
          this.analytics = res;
          this.tracks = this.analytics.track_activity;
          this.trackActivity = this.tracks.find((e) => e._id === this.activity);
          this.analytic_material = { ...res[Object.keys(res)[0]] };
          this.analytic_material.material_type = this.getMaterialType().toLowerCase();
          for (const activity of this.analytics.watched_activity) {
            if (activity.contact && activity.contact.length) {
              if (this.analytic_material.material_type == 'pdf') {
                const contact = {
                  ...activity.contact[0],
                  read_pages: activity.read_pages ? activity.read_pages : 0,
                  total_pages: activity.total_pages
                };
                this.contacts.push(contact);
              } else {
                const contact = {
                  ...activity.contact[0],
                  duration: activity.duration ? activity.duration : 0
                };
                this.contacts.push(contact);
              }
            }
          }
        }
      });
  }
  sendMaterial(type: string): void {
    const material = this.analytic_material;
    this.dialog
      .open(MaterialSendComponent, {
        position: { top: '5vh' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          material: [this.analytic_material],
          type: type
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.redirect) {
          this.router.navigate(['/settings/integration']);
        }
      });
  }
  highlightElement(element_id) {
    if (this.trackActivity && this.trackActivity._id == element_id) {
      const element = document.getElementById(element_id);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
      return true;
    } else {
      return false;
    }
  }
  copyLink(): void {
    let url;
    const material = this.analytic_material;
    if (material.material_type == 'video') {
      url =
        environment.website +
        '/video?video=' +
        material._id +
        '&user=' +
        this.user_id;
    } else if (material.material_type == 'pdf') {
      url =
        environment.website +
        '/pdf?pdf=' +
        material._id +
        '&user=' +
        this.user_id;
    } else if (material.material_type == 'image') {
      url =
        environment.website +
        '/image?image=' +
        material._id +
        '&user=' +
        this.user_id;
    }
    this.clipboard.copy(url);
    this.toast.success('Copied the link to clipboard');
  }

  editMaterial(): void {
    if (this.analytic_material.material_type === 'video') {
      this.editVideo(this.analytic_material);
    } else if (this.analytic_material.material_type === 'pdf') {
      this.editPdf(this.analytic_material);
    } else if (this.analytic_material.material_type === 'image') {
      this.editImage(this.analytic_material);
    }
  }
  editVideo(video: any): void {
    this.dialog.open(VideoEditComponent, {
      position: { top: '5vh' },
      width: '100vw',
      maxWidth: '500px',
      disableClose: true,
      data: {
        material: { ...video },
        type: 'edit'
      }
    });
  }

  editPdf(pdf: any): void {
    this.dialog.open(PdfEditComponent, {
      position: { top: '5vh' },
      width: '100vw',
      maxWidth: '500px',
      disableClose: true,
      data: {
        material: { ...pdf },
        type: 'edit'
      }
    });
  }

  editImage(image: any): void {
    this.dialog.open(ImageEditComponent, {
      position: { top: '5vh' },
      width: '100vw',
      maxWidth: '500px',
      disableClose: true,
      data: {
        material: { ...image },
        type: 'edit'
      }
    });
  }

  editTemplate(): void {
    this.dialog.open(MaterialEditTemplateComponent, {
      position: { top: '10vh' },
      width: '100vw',
      maxWidth: '600px',
      disableClose: true,
      data: {
        id: this.analytic_material._id
      }
    });
  }
  leadCapture(): void {
    this.dialog.open(LeadCaptureFormComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '600px',
      disableClose: true,
      data: {
        type: 'single',
        material: this.analytic_material
      }
    });
  }
  duplicateMaterial(): void {
    const material = this.analytic_material;
    switch (material.material_type) {
      case 'video':
        this.dialog.open(VideoEditComponent, {
          position: { top: '5vh' },
          width: '100vw',
          maxWidth: '500px',
          disableClose: true,
          data: {
            material: { ...material },
            type: 'duplicate'
          }
        });
        break;
      case 'pdf':
        this.dialog.open(PdfEditComponent, {
          position: { top: '5vh' },
          width: '100vw',
          maxWidth: '500px',
          disableClose: true,
          data: {
            material: { ...material },
            type: 'duplicate'
          }
        });
        break;
      case 'image':
        this.dialog.open(ImageEditComponent, {
          position: { top: '5vh' },
          width: '100vw',
          maxWidth: '500px',
          disableClose: true,
          data: {
            material: { ...material },
            type: 'duplicate'
          }
        });
        break;
    }
  }
  shareMaterial(): void {
    const material = this.analytic_material;
    const url = `${this.siteUrl}/${material.material_type}?${material.material_type}=${material._id}&user=${this.user_id}`;
    this.dialog.open(SocialShareComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '600px',
      data: {
        url: url
      }
    });
  }

  shareTeam(): void {
    this.dialog.open(TeamMaterialShareComponent, {
      width: '98vw',
      maxWidth: '450px',
      data: {
        material: this.analytic_material,
        type: 'material'
      }
    });
  }
  download(): void {
    if (!this.analytic_material.bucket) {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = this.analytic_material.url;
      a.click();
    } else {
      this.materialService
        .downloadVideo(this.analytic_material._id)
        .subscribe((res) => {
          if (res['status']) {
            saveAs(res['data'], res['title'] + '.mp4');
          } else {
            this.toast.warning(`Downloading is failed.`);
          }
        });
    }
  }
  checkType(url: string): boolean {
    if (!url) {
      return true;
    }
    if (url.indexOf('youtube.com') == -1 && url.indexOf('vimeo.com') == -1) {
      return true;
    } else {
      return false;
    }
  }

  moveToFolder(): void {
    let selectMaterial = [];
    const material = this.analytic_material;
    selectMaterial = [material];

    if (!selectMaterial.length) {
      this.dialog.open(NotifyComponent, {
        width: '96vw',
        maxWidth: '360px',
        data: {
          message: 'You have to select material(s) to move those to the folder.'
        }
      });
      return;
    }
    if (selectMaterial.length > 0) {
      this.dialog
        .open(MoveFolderComponent, {
          width: '96vw',
          maxWidth: '400px',
          data: {
            materials: selectMaterial,
            currentFolder: this.selectedFolder
          }
        })
        .afterClosed()
        .subscribe((status) => {
          if (status) {
            console.log('Success');
          }
        });
    }
  }
  deleteMaterial(): void {
    const material = this.analytic_material;
    switch (material.material_type) {
      case 'video':
        const videoConfirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Delete Video',
            message: 'Are you sure to delete this video?',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel'
          }
        });
        if (material.role !== 'admin') {
          videoConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              this.materialDeleteSubscription &&
                this.materialDeleteSubscription.unsubscribe();
              this.materialDeleteSubscription = this.materialService
                .deleteVideo(material._id)
                .subscribe((res) => {
                  this.materialService.delete$([material._id]);
                  if (material.shared_video) {
                    this.materialService.update$(material.shared_video, {
                      has_shared: false,
                      shared_video: ''
                    });
                  }
                  // this.toast.success('Video has been deleted successfully.');
                });
            }
          });
        }
        break;
      case 'image':
        const imageConfirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Delete Image',
            message: 'Are you sure you want to delete this Image?',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel'
          }
        });
        if (material.role !== 'admin') {
          imageConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              this.materialDeleteSubscription &&
                this.materialDeleteSubscription.unsubscribe();
              this.materialDeleteSubscription = this.materialService
                .deleteImage(material._id)
                .subscribe((res) => {
                  this.materialService.delete$([material._id]);
                  if (material.shared_image) {
                    this.materialService.update$(material.shared_image, {
                      has_shared: false,
                      shared_image: ''
                    });
                  }
                  // this.toast.success('Image has been deleted successfully.');
                });
            }
          });
        }
        break;
      case 'pdf':
        const pdfConfirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Delete Pdf',
            message: 'Are you sure to delete this pdf?',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel'
          }
        });
        if (material.role !== 'admin') {
          pdfConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              this.materialDeleteSubscription &&
                this.materialDeleteSubscription.unsubscribe();
              this.materialDeleteSubscription = this.materialService
                .deletePdf(material._id)
                .subscribe((res) => {
                  this.materialService.delete$([material._id]);
                  if (material.shared_pdf) {
                    this.materialService.update$(material.shared_pdf, {
                      has_shared: false,
                      shared_pdf: ''
                    });
                  }
                  // this.toast.success('Pdf has been deleted successfully.');
                });
            }
          });
        }
        break;
    }
  }
  getMaterialType(): string {
    if (this.analytic_material.type) {
      if (this.analytic_material.type === 'application/pdf') {
        return 'PDF';
      } else if (this.analytic_material.type.includes('image')) {
        return 'Image';
      }
    }
    return 'Video';
  }

  getAvatarName(contact): any {
    if (contact.first_name && contact.last_name) {
      return contact.first_name[0] + contact.last_name[0];
    } else if (contact.first_name && !contact.last_name) {
      return contact.first_name[0];
    } else if (!contact.first_name && contact.last_name) {
      return contact.last_name[0];
    }
    return 'UC';
  }

  getLabels(): any {
    // this.isLoading = true;
    this.labelService.getLabels().subscribe(async (res: any) => {
      this.labels = res.sort((a, b) => {
        return a.priority - b.priority;
      });
    });
  }

  getLabelById(id): any {
    let retVal = { color: 'white', font_color: 'black' };
    let i;
    for (i = 0; i < this.labels.length; i++) {
      if (this.labels[i]._id === id) {
        retVal = this.labels[i];
      }
    }
    return retVal;
  }

  changeExpanded(): void {
    this.topExpanded = !this.topExpanded;
  }
  changeTrackExpanded(): void {
    this.lowExpanded = !this.lowExpanded;
  }

  toContact(id: string): void {
    this.router.navigate(['/contacts/' + id]);
  }

  goToBack(): void {
    this.handlerService.goBack('/materials');
  }

  getPrevPage(): string {
    if (!this.handlerService.previousUrl) {
      return 'to Materials';
    }
    if (
      this.handlerService.previousUrl.includes('/team/') &&
      this.handlerService.previousUrl.includes('/materials')
    ) {
      return 'to Team Materials';
    }
    for (const route in ROUTE_PAGE) {
      if (this.handlerService.previousUrl === route) {
        return 'to ' + ROUTE_PAGE[route];
      }
    }
    return '';
  }
  createContact(track): void {
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
          const contactId = res['contact']._id;
          const contacts = [];
          contacts.push(contactId);
          this.activityService
            .assignContact(track, contacts)
            .subscribe((res) => {
              if (res) {
                Object.assign(track, res['data']);
              }
            });
        }
      });
  }
  assignContact(track): void {
    this.dialog
      .open(LinkContactAssignComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: { track: track }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          Object.assign(track, res['data']);
        }
      });
  }
  copyTrackLink(track): void {
    let url;
    if (track.send_uuid) {
      if (track.videos && track.videos.length) {
        url = environment.website + '/video6/' + track.send_uuid;
      } else if (track.pdfs && track.pdfs.length) {
        url = environment.website + '/pdf6/' + track.send_uuid;
      } else if (track.images && track.images.length) {
        url = environment.website + '/image6/' + track.send_uuid;
      }
    } else {
      if (track.videos && track.videos.length) {
        url = environment.website + '/video1/' + track._id;
      } else if (track.pdfs && track.pdfs.length) {
        url = environment.website + '/pdf1/' + track._id;
      } else if (track.images && track.images.length) {
        url = environment.website + '/image/' + track._id;
      }
    }
    this.clipboard.copy(url);
    this.toast.success('Copied trackable link');
  }
}
