import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { Cookie } from 'src/app/utils/cookie';
import { environment } from 'src/environments/environment';
import { Clipboard } from '@angular/cdk/clipboard';
import { ToastrService } from 'ngx-toastr';
import { STATUS } from 'src/app/constants/variable.constants';

@Component({
  selector: 'app-page-builder',
  templateUrl: './page-builder.component.html',
  styleUrls: ['./page-builder.component.scss']
})
export class PageBuilderComponent implements OnInit {
  // Page builder api base url
  PageBuilder = environment.pageBuilder;
  PageBuilderApi = environment.pageBuilderAPI;
  builer_token = '';
  pages = [];
  isLoading = false;

  callStatus = {};

  profileSubscription: Subscription;
  siteVolumn = 0;
  STATUS = STATUS;
  loadSubscription: Subscription;
  constructor(
    public userService: UserService,
    private clipboard: Clipboard,
    private toastService: ToastrService
  ) {
    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      if (user?._id) {
        if (user.landing_page_info?.is_enabled) {
          this.siteVolumn = user.landing_page_info?.max_count;
        }
      }
    });
  }

  ngOnInit(): void {
    this.builer_token = Cookie.get('_pages_session');
    if (this.builer_token) {
      this.userService.loadPages(this.builer_token, true);
      this.loadSubscription && this.loadSubscription.unsubscribe();
      this.loadSubscription = this.userService.pages$.subscribe((res) => {
        if (res['errors']) {
          this.toastService.error(
            res['errors'][0]?.message ||
              res['errors']?.message ||
              res['errors'] ||
              'Unknown third party error.'
          );
          return;
        } else {
          this.pages = res || [];
          this.pages.forEach((e) => {
            if (e.editorUrl && e.editorUrl.startsWith(this.PageBuilderApi)) {
              e.editorUrl = e.editorUrl.replace(
                this.PageBuilderApi,
                this.PageBuilder
              );
            }
            if (e.previewUrl && e.previewUrl.startsWith(this.PageBuilderApi)) {
              e.previewUrl = e.previewUrl.replace(
                this.PageBuilderApi,
                this.PageBuilder
              );
            }
          });
        }
      });
    }
  }

  deleteSite(site): void {
    const token = Cookie.get('_pages_session');
    if (token) {
      this.callStatus[site.id] = 'Deleting site...';
      this.userService.deleteSite(token, site.id).then((res) => {
        delete this.callStatus[site.id];
        if (res.errors) {
          this.toastService.error(
            res.errors[0]?.message ||
              res.errors?.message ||
              res.errors ||
              'Unknown third party error.'
          );
          return;
        }
        this.toastService.success('Site is removed successfully');
        const pos = this.pages.findIndex((e) => e.id === site.id);
        if (pos !== -1) {
          this.pages.splice(pos, 1);
          this.userService.pages.next(this.pages);
        }
      });
    }
  }

  publishSite(site): void {
    const token = Cookie.get('_pages_session');
    if (token) {
      this.callStatus[site.id] = 'Publishing site...';
      this.userService.publishSite(token, site.id).then((res) => {
        delete this.callStatus[site.id];
        if (res.errors) {
          this.toastService.error(
            res.errors[0]?.message ||
              res.errors?.message ||
              res.errors ||
              'Unknown third party error.'
          );
          return;
        }
        // this.toastService.success('Site is published successfully');
        site.state = 'published';
      });
    }
  }

  copySite(site): void {
    this.clipboard.copy(site.siteUrl);
    this.toastService.success('Copied site address.');
  }
}
