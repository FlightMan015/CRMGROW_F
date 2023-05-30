import { DOCUMENT } from '@angular/common';
import { ApplicationRef, Component, Inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SwPush, SwUpdate } from '@angular/service-worker';
import { TranslateService } from '@ngx-translate/core';
import { concat, interval } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'crmgrow';
  langs = ['en', 'fr'];

  constructor(
    private appRef: ApplicationRef,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private translateService: TranslateService,
    private swUpdate: SwUpdate,
    private snackBar: MatSnackBar,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.translateService.addLangs(this.langs);
    this.translateService.setDefaultLang('en');

    const browserLang = this.translateService.getBrowserLang();
    this.translateService.use(browserLang.match(/en|fr/) ? browserLang : 'fr');

    // Check the app update stats:
    // 1. Check the App is statble status
    // 2. every 6 hours, check the update status
    const appIsStable$ = this.appRef.isStable.pipe(
      first((isStable) => isStable === true)
    );
    const everySixHour$ = interval(6 * 60 * 60 * 1000);
    const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHour$);
    everySixHoursOnceAppIsStable$.subscribe(() => {
      try {
        swUpdate.checkForUpdate();
      } catch (err) {
        console.log('Could not check the app update status');
      }
    });

    // Check the avaiable possible of the app update status
    swUpdate.available.subscribe((event) => {
      console.log('current version is', event.current);
      console.log('available version is', event.available);
      this.snackBar
        .open(
          `There is an update to crmgrow.  Please click Update to run the latest version.`,
          'Update',
          {
            verticalPosition: 'bottom',
            horizontalPosition: 'left'
          }
        )
        .onAction()
        .subscribe(() => {
          this.updateApp();
        });
    });
    // Check the updated status of the app
    swUpdate.activated.subscribe((event) => {
      console.log('old version was', event.previous);
      console.log('new version is', event.current);
      this.snackBar.open(
        `Thank you. crmgrow has been updated successfully.`,
        'Close',
        {
          verticalPosition: 'bottom',
          horizontalPosition: 'left'
        }
      );
    });

    window.onstorage = (e) => {
      if (e && e.key === 'token') {
        location.reload();
      }
    };
  }

  ngOnInit(): void {
    this.titleHandle();

    if (navigator.userAgent.indexOf('SamsungBrowser') !== -1) {
      this.document.body.classList.add('samsung-app');
    }
  }

  titleHandle(): void {
    const appTitle = this.titleService.getTitle();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let child = this.activatedRoute.firstChild;
          while (child.firstChild) {
            child = child.firstChild;
          }
          if (child.snapshot.data['title']) {
            return child.snapshot.data['title'];
          }
          return appTitle;
        })
      )
      .subscribe((ttl: string) => {
        const title = ttl ? `${ttl} | ${this.title}` : this.title;
        this.titleService.setTitle(title);
      });
  }

  /**
   * Update the app to new version
   */
  updateApp(): void {
    this.swUpdate.activateUpdate().then(() => {
      document.location.reload();
    });
  }
}
