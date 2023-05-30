import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { TaskService } from 'src/app/services/task.service';
import { CampaignService } from 'src/app/services/campaign.service';
import { NotificationService } from 'src/app/services/notification.service';
import { STATUS } from 'src/app/constants/variable.constants';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SocketService } from 'src/app/services/socket.service';
import { AutomationService } from 'src/app/services/automation.service';
import { Contact } from 'src/app/models/contact.model';
import { Automation } from 'src/app/models/automation.model';

interface AutomationTask {
  contact?: Contact;
  detail?: Automation;
  due_date?: Date;
}

@Component({
  selector: 'app-task-manager',
  templateUrl: './task-manager.component.html',
  styleUrls: ['./task-manager.component.scss']
})
export class TaskManagerComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer: MatDrawer;
  typeName: string;
  emailCount: number = 0;
  textCount: number = 0;
  campaignCount: number = 0;

  automationCount: number = 0;
  automationPage: number = 1;
  automationPageSize: number = 50;
  automations: AutomationTask[] = [];
  automationLoading: boolean = false;
  DISPLAY_COLUMNS = [
    'contact_name',
    // 'contact_label',
    'automation',
    'due_date',
    'action'
  ];

  tasks: any[];
  drawerListData: any[];
  searchStr: string;
  STATUS = STATUS;
  loadStatus = STATUS.NONE;
  automationTasks: any[];
  textTasks: any[];
  emailTasks: any[];
  campaignTasks: any[];
  notificationCommandSubscription: Subscription;
  automationCountLoadSubscription: Subscription;
  automationLoadSubscription: Subscription;

  constructor(
    private taskService: TaskService,
    private campaignService: CampaignService,
    private router: Router,
    private notificationService: NotificationService,
    private automationService: AutomationService,
    private socketService: SocketService
  ) {
    this.loadTasks();

    this.campaignService.loadAwaitCampaigns().subscribe((res) => {
      if (res) {
        this.campaignTasks = res;
      }
    });

    this.notificationCommandSubscription &&
      this.notificationCommandSubscription.unsubscribe();
    this.notificationCommandSubscription = this.socketService.command$.subscribe(
      (res) => {
        if (res) {
          this.executeRealtimeCommand(res);
        }
      }
    );

    this.automationCountLoadSubscription &&
      this.automationCountLoadSubscription.unsubscribe();
    this.automationCountLoadSubscription = this.automationService
      .getActivatedTimelinesCount()
      .subscribe((res) => {
        this.automationCount = res['data'] || 0;
      });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.notificationCommandSubscription &&
      this.notificationCommandSubscription.unsubscribe();
  }

  toggleBody(event): void {
    // if (event) {
    //   document.body.classList.add('overflow-hidden');
    // } else {
    //   document.body.classList.remove('overflow-hidden');
    // }
  }

  openDrawer(name: string): void {
    this.typeName = name;
    window.scrollTo({ top: 0 });
    this.drawer.open();
    if (this.typeName === 'Automation') {
      this.loadAutomationTasks(this.automationPage);
    }
  }

  closeDrawer(): void {
    this.drawer.close();
  }

  getDueDate(date: string): string {
    let start_date;
    if (date)
      start_date = date.split('T')[0] + ' ' + date.split('T')[1].split('.')[0];
    else start_date = '';
    return start_date;
  }

  /**
   * Go to Task Detail Page
   * @param task Email Task Data
   */
  goToQueuePage(task: any, type = 'email'): void {
    if (type === 'email') {
      this.router.navigate(['/email-queue/' + task._id]);
    } else if (type === 'text') {
      this.router.navigate(['/text-queue/' + task._id]);
    } else if (type === 'automation') {
      this.router.navigate(['/automation-queue/' + task._id]);
    } else if (type === 'campaign') {
      this.router.navigate(['/campaign/bulk/' + task._id]);
    }
  }

  /**
   * Remove the task
   * @param evt: html click event
   * @param type: task type : email | text | campaign | automation
   * @param task: task object data
   */
  removeTask(evt, type: string, task: any): void {
    evt.stopPropagation();
    if (type === 'campaign') {
      // remove all campaign jobs and campaign with the campaign id
      this.campaignService.remove(task._id).subscribe((res) => {
        if (res?.data) {
          const pos = this.campaignTasks.findIndex((e) => e._id === task._id);
          if (pos !== -1) {
            this.campaignTasks.splice(pos, 1);
          }
        }
      });
    } else {
      // remove all tasks with the task process
      this.notificationService.removeTask(task._id).subscribe((res) => {
        if (res?.data) {
          if (type === 'automation') {
            const pos = this.automationTasks.findIndex(
              (e) => e._id === task._id
            );
            if (pos !== -1) {
              this.automationTasks.splice(pos, 1);
            }
          } else if (type === 'text') {
            const pos = this.textTasks.findIndex((e) => e._id === task._id);
            if (pos !== -1) {
              this.textTasks.splice(pos, 1);
            }
          } else if (type === 'email') {
            const pos = this.emailTasks.findIndex((e) => e._id === task._id);
            if (pos !== -1) {
              this.emailTasks.splice(pos, 1);
            }
          }
        }
      });
    }
  }

  loadTasks(): void {
    this.notificationService.getAllTasks().subscribe((res) => {
      if (res) {
        const automations = res['automations'];
        const tasks = res['data'];
        this.emailTasks = tasks.filter((e) => e.type === 'send_email');
        this.emailTasks.forEach((e) => {
          if (e.set_recurrence && e.recurrence_mode) {
            e.task_type = e.recurrence_mode;
          } else if (e.set_recurrence == false) {
            e.task_type = 'Scheduled';
          } else {
            e.task_type = 'Bulk Email';
          }
        });
        this.textTasks = tasks.filter(
          (e) =>
            (e.type === 'send_text' || e.type === 'bulk_sms') &&
            e.set_recurrence != null
        );
        this.textTasks.forEach((e) => {
          if (e.set_recurrence && e.recurrence_mode) {
            e.task_type = e.recurrence_mode;
          } else if (e.set_recurrence == false) {
            e.task_type = 'Scheduled';
          }
        });
        this.automationTasks = tasks.filter(
          (e) => e.type === 'assign_automation'
        );
        (this.automationTasks || []).forEach((e) => {
          if (!e.details) {
            return;
          }
          const automationId = e.details.automation
            ? e.details.automation
            : e.details.automation_id;
          if (!automationId) {
            return;
          }
          if (automationId && automations[automationId]) {
            e.details.title = automations[automationId].title;
            e.details._id = automations[automationId]._id;
          }
        });
      }
    });
  }

  /**
   * Load running automations by page
   * @param page: page number
   */
  loadAutomationTasks(page: number): void {
    this.automationPage = page;
    const skip = (page - 1) * this.automationPageSize;
    const limit = this.automationPageSize;

    this.automationLoading = true;
    this.automationLoadSubscription &&
      this.automationLoadSubscription.unsubscribe();
    this.automationLoadSubscription = this.automationService
      .loadActivatedTimelines({ skip, limit })
      .subscribe((res) => {
        this.automationLoading = false;
        this.automations = res['data'] || [];
        this.automations.forEach((e) => {
          e.contact = new Contact().deserialize(e.contact);
        });
      });
  }

  /**
   * Cancel the automation from contact or deal
   * @param automation: Automation to cancel
   */
  cancelAutomation(automation: AutomationTask): void {
    this.automationService
      .unAssign(automation.contact?._id)
      .subscribe((res) => {
        this.automationCount--;
        this.loadAutomationTasks(this.automationPage);
      });
  }

  /**
   * Open Contact Page
   * @param automation
   */
  openContact(automation: AutomationTask): void {
    this.router.navigate(['/contacts/' + automation.contact?._id]);
  }

  /**
   * Open Automation page
   * @param automation
   */
  openAutomation(automation: AutomationTask): void {
    this.router.navigate(['/autoflow/edit/' + automation.detail?._id]);
  }

  executeRealtimeCommand(_c): void {
    const COMMANDS = [
      'bulk_email_progress',
      'bulk_email',
      'bulk_text_progress',
      'bulk_text',
      'assign_automation_progress'
    ];
    if (COMMANDS.includes(_c.command)) {
      this.loadTasks();
    }
  }
}
