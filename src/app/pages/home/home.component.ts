import { Location } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TaskCreateComponent } from 'src/app/components/task-create/task-create.component';
import {
  DialogSettings,
  STATISTICS_DURATION
} from 'src/app/constants/variable.constants';
import { HandlerService } from 'src/app/services/handler.service';
import { TabItem } from 'src/app/utils/data.types';
import { Subscription } from 'rxjs';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SelectCompanyComponent } from 'src/app/components/select-company/select-company.component';
import { ToastrService } from 'ngx-toastr';
import { IntroModalComponent } from 'src/app/components/intro-modal/intro-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  STATISTICS_DURATION = STATISTICS_DURATION;
  tabs: TabItem[] = [
    { label: 'Tasks', id: 'tasks', icon: '' },
    { label: 'Activity', id: 'activities', icon: '' }
  ];
  selectedTab: TabItem = this.tabs[0];
  // Statistics
  duration = STATISTICS_DURATION[0];
  profileSubscription: Subscription;
  routeChangeSubscription: Subscription;

  constructor(
    private location: Location,
    private handlerService: HandlerService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    // this.routeChangeSubscription = this.route.queryParams.subscribe(
    //   (params) => {
    //     const mode = params['prev'];
    //     // this.location.replaceState('/home');
    //     // if (mode == 'signup') {
    //     //   this.dialog
    //     //     .open(SelectCompanyComponent, {
    //     //       position: { top: '100px' },
    //     //       width: '100vw',
    //     //       maxWidth: '450px',
    //     //       disableClose: true
    //     //     })
    //     //     .afterClosed()
    //     //     .subscribe((res) => {
    //     //       if (res) {
    //     //         const company = res['company'];
    //     //         const job = res['job'];
    //     //         this.userService
    //     //           .updateProfile({ company, job })
    //     //           .subscribe((res) => {
    //     //             if (res) {
    //     //               this.userService.updateProfileImpl({ company, job });
    //     //               this.toast.success('Company is changed successfully.');
    //     //             }
    //     //           });
    //     //       }
    //     //     });
    //     // }
    //     if (mode == 'signup') {
    //       this.router.navigate(['/user-insight']);
    //     }
    //   }
    // );
    this.handlerService.pageName.next('dashboard');
    // Load the Last Tab Variable from Storage
    const page = localStorage.getItem('homeTab');
    if (page === 'activities') {
      this.selectedTab = this.tabs[1];
    }
    // this.dialog.open(IntroModalComponent, {
    //   width: '98vw',
    //   maxWidth: '700px',
    //   disableClose: true
    // });
    // userflow.init('ct_opamqimbtjhorkvifeujsaaajq');
    // userflow.identify('test-d08fe1df-9963-44a3-9d03-a5de6cf7c3ba');
    // userflow.identify('test-d08fe1df-9963-44a3-9d03-a5de6cf7c3ba', {
    //   // This will be consumed as a string, even though its value
    //   // is a number here
    //   connect_email: { set: this.user.is_primary, data_type: 'boolean' }
    // });
  }

  ngOnDestroy(): void {
    this.handlerService.pageName.next('');
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
  }

  /**
   * Change the Tab -> This will change the view
   * @param tab : TabItem for the Task and Activity
   */
  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    this.location.replaceState(tab.id);
    // Set the storage for the active tab
    localStorage.setItem('homeTab', tab.id);
  }
  /**
   * Change Duration
   * @param value : Duration Value -> monthly | weekly | yearly
   */
  changeDuration(value: string): void {
    this.duration = value;
  }

  /**
   * Open the create task dialog
   */
  createTask(): void {
    this.dialog.open(TaskCreateComponent, DialogSettings.TASK);
  }
}
