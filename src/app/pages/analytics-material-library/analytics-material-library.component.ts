import { Component, OnInit } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { Material } from 'src/app/models/material.model';
import { Clipboard } from '@angular/cdk/clipboard';
import { ToastrService } from 'ngx-toastr';
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
import { saveAs } from 'file-saver';
import { StoreService } from 'src/app/services/store.service';

@Component({
  selector: 'app-analytics-material-library',
  templateUrl: './analytics-material-library.component.html',
  styleUrls: ['./analytics-material-library.component.scss']
})
export class AnalyticsMaterialLibraryComponent implements OnInit {
  isLoading = false;
  material_id = '';
  material_type = '';
  user_id = '';
  siteUrl = environment.website;
  loadSubcription: Subscription;
  profileSubscription: Subscription;
  analytics;
  material;
  topExpanded = true;
  contacts = [];
  labels = [];
  analytic_material: Material;
  selectedFolder: Material;
  materialDeleteSubscription: Subscription;
  selectedLibrary: any;
  libraries: any[];
  routeSubscription: Subscription;

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private materialService: MaterialService,
    private labelService: LabelService,
    private handlerService: HandlerService,
    private clipboard: Clipboard,
    private toast: ToastrService,
    private storeService: StoreService
  ) {
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.user_id = profile._id;
      }
    );
    this.storeService.libraries$.subscribe((libraries) => {
      this.libraries = libraries.filter((e) => e._id == this.material_id);
      this.selectedLibrary = this.libraries[0];
    });
  }

  ngOnInit(): void {
    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.routeSubscription = this.route.params.subscribe((params) => {
      this.materialService.loadLibrary(true);
      this.material_id = params['id'];
      this.material_type = params['material_type'];
    });
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
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

  getMaterialType(type: string): string {
    if (type.includes('video')) return 'Video';
    if (type.includes('image')) return 'Image';
    if (type.includes('pdf')) return 'PDF';
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

  getOwner(user: any): string {
    if (!user || !user._id) return 'Admin';
    else if (user._id == this.user_id) return 'Me';
    else return user.name;
  }
}
