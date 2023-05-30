import { Routes } from '@angular/router';
import { PageExitGuard } from 'src/app/guards/page-exit.guard';
import { HomeComponent } from 'src/app/pages/home/home.component';
import { ProfileComponent } from 'src/app/pages/profile/profile.component';
import { DealsComponent } from 'src/app/pages/deals/deals.component';
import { ContactsComponent } from 'src/app/pages/contacts/contacts.component';
import { MaterialsComponent } from 'src/app/pages/materials/materials.component';
import { AutomationsComponent } from 'src/app/pages/automations/automations.component';
import { SettingsComponent } from 'src/app/pages/settings/settings.component';
import { AffiliateComponent } from 'src/app/pages/affiliate/affiliate.component';
import { TeamsComponent } from 'src/app/pages/teams/teams.component';
import { TemplatesComponent } from 'src/app/pages/templates/templates.component';
import { CalendarComponent } from 'src/app/pages/calendar/calendar.component';
import { CalendlyComponent } from 'src/app/pages/calendly/calendly.component';
import { ScheduleTypeCreateComponent } from 'src/app/pages/schedule-type-create/schedule-type-create.component';
import { DealsDetailComponent } from 'src/app/pages/deals-detail/deals-detail.component';
import { VideoCreateComponent } from 'src/app/pages/video-create/video-create.component';
import { AutoflowComponent } from 'src/app/pages/autoflow/autoflow.component';
import { TeamComponent } from 'src/app/pages/team/team.component';
import { TemplateComponent } from 'src/app/pages/template/template.component';
import { ContactComponent } from 'src/app/pages/contact/contact.component';
import { ThemesComponent } from 'src/app/pages/themes/themes.component';
import { ThemeComponent } from 'src/app/pages/theme/theme.component';
import { AnalyticsMaterialComponent } from '../../pages/analytics-material/analytics-material.component';
import { NotificationsListComponent } from 'src/app/pages/notifications-list/notifications-list.component';
import { MessagesComponent } from 'src/app/pages/messages/messages.component';
import { TestComponent } from 'src/app/pages/test/test.component';
import { VerifyEmailComponent } from '../../pages/verify-email/verify-email.component';
import { CampaignComponent } from 'src/app/pages/campaign/campaign.component';
import { CampaignBulkMailingItemComponent } from 'src/app/pages/campaign-bulk-mailing-item/campaign-bulk-mailing-item.component';
import { NewsletterEditorComponent } from 'src/app/pages/newsletter-editor/newsletter-editor.component';
import { EmailQueueComponent } from 'src/app/pages/email-queue/email-queue.component';
import { ScheduledOneComponent } from 'src/app/pages/scheduled-one/scheduled-one.component';
import { CampaignCreateComponent } from 'src/app/pages/campaign-create/campaign-create.component';
import { TextQueueComponent } from 'src/app/pages/text-queue/text-queue.component';
import { AutomationQueueComponent } from 'src/app/pages/automation-queue/automation-queue.component';
import { DealsSettingComponent } from 'src/app/pages/deals-setting/deals-setting.component';
import { AnalyticsMaterialLibraryComponent } from 'src/app/pages/analytics-material-library/analytics-material-library.component';
import { PageBuilderComponent } from 'src/app/pages/page-builder/page-builder.component';
import { TaskManagerComponent } from 'src/app/pages/task-manager/task-manager.component';
// import { EmailTextDetailComponent } from 'src/app/pages/email-text-detail/email-text-detail.component';

export const AdminLayoutRoutes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
    data: {
      title: 'Tasks'
    }
  },
  {
    path: 'activities',
    component: HomeComponent,
    data: {
      title: 'Activities'
    }
  },
  {
    path: 'tasks',
    component: HomeComponent,
    data: {
      title: 'Tasks'
    }
  },
  // {
  //   path: 'tasks/:id',
  //   component: EmailTextDetailComponent,
  //   data: {
  //     title: 'Task'
  //   }
  // },
  {
    path: 'deals',
    component: DealsComponent,
    data: {
      title: 'Deals'
    }
  },
  {
    path: 'deals/:id',
    component: DealsDetailComponent,
    data: {
      title: 'Deals'
    }
  },
  {
    path: 'deals/stage/:id',
    component: DealsComponent,
    data: {
      title: 'Deals'
    }
  },
  {
    path: 'deals/pipeline/:id',
    component: DealsComponent,
    data: {
      title: 'Deals'
    }
  },
  {
    path: 'pipeline-manager',
    component: DealsSettingComponent,
    data: {
      title: 'Deals Setting'
    }
  },
  {
    path: 'contacts',
    component: ContactsComponent,
    data: {
      title: 'Contacts'
    }
  },
  {
    path: 'contacts/import-csv',
    component: ContactsComponent,
    data: {
      title: 'Contacts'
    }
  },
  {
    path: 'contacts/:id',
    component: ContactComponent,
    data: {
      title: 'Detail Contact'
    }
  },
  {
    path: 'materials',
    component: MaterialsComponent,
    data: {
      title: 'Materials'
    }
  },
  {
    path: 'materials/create/:mode',
    component: VideoCreateComponent,
    data: {
      title: 'Materials'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'materials/create/:mode/:folder',
    component: VideoCreateComponent,
    data: {
      title: 'Materials'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'materials/analytics/:material_type',
    component: AnalyticsMaterialComponent,
    data: {
      title: 'Materials'
    }
  },
  {
    path: 'materials/analytics/:material_type/:id',
    component: AnalyticsMaterialComponent,
    data: {
      title: 'Materials'
    }
  },
  {
    path: 'materials/analytics/:material_type/:id/:activity',
    component: AnalyticsMaterialComponent,
    data: {
      title: 'Materials'
    }
  },
  {
    path: 'materials/library/:material_type/:id',
    component: AnalyticsMaterialLibraryComponent,
    data: {
      title: 'Material Libraries'
    }
  },

  {
    path: 'materials/:page',
    component: MaterialsComponent,
    data: {
      title: 'Materials'
    }
  },
  {
    path: 'materials/:page/:folder',
    component: MaterialsComponent,
    data: {
      title: 'Materials'
    }
  },
  {
    path: 'automations',
    component: AutomationsComponent,
    data: {
      title: 'Automations'
    }
  },
  {
    path: 'automations/:tab',
    component: AutomationsComponent,
    data: {
      title: 'Automations'
    }
  },
  {
    path: 'automations/:tab/:folder',
    component: AutomationsComponent,
    data: {
      title: 'Automations'
    }
  },
  {
    path: 'autoflow/new',
    component: AutoflowComponent,
    data: {
      title: 'Automations'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'autoflow/create/',
    component: AutoflowComponent,
    data: {
      title: 'Automations'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'autoflow/:mode/:id',
    component: AutoflowComponent,
    data: {
      title: 'Automation'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    data: {
      title: 'Settings'
    }
  },
  {
    path: 'settings/:page',
    component: SettingsComponent,
    data: {
      title: 'Settings'
    }
  },
  {
    path: 'teams',
    component: TeamsComponent,
    data: {
      title: 'Your Teams'
    }
  },
  {
    path: 'teams/:tab',
    component: TeamsComponent,
    data: {
      title: 'Group Call'
    }
  },
  {
    path: 'teams/:tab/:group',
    component: TeamsComponent,
    data: {
      title: 'Group Call'
    }
  },
  {
    path: 'teams/:tab/:group/:id',
    component: TeamsComponent,
    data: {
      title: 'Group Call'
    }
  },
  {
    path: 'team/:id',
    component: TeamComponent,
    data: {
      title: 'Team Detail'
    }
  },
  {
    path: 'team/:id/:tab/:folder',
    component: TeamComponent,
    data: {
      title: 'Team Detail'
    }
  },
  {
    path: 'templates-list',
    component: TemplatesComponent,
    data: {
      title: 'Templates'
    }
  },
  {
    path: 'templates-list/:tab',
    component: TemplatesComponent,
    data: {
      title: 'Templates'
    }
  },
  {
    path: 'templates-list/:tab/:folder',
    component: TemplatesComponent,
    data: {
      title: 'Templates'
    }
  },
  {
    path: 'profile',
    component: ProfileComponent,
    data: {
      title: 'Profile'
    }
  },
  {
    path: 'profile/outlook',
    component: SettingsComponent,
    data: {
      title: 'Settings'
    }
  },
  {
    path: 'profile/gmail',
    component: SettingsComponent,
    data: {
      title: 'Settings'
    }
  },
  {
    path: 'profile/zoom',
    component: SettingsComponent,
    data: {
      title: 'Settings'
    }
  },
  {
    path: 'profile/:page',
    component: ProfileComponent,
    data: {
      title: 'Profile'
    }
  },
  {
    path: 'profile/:page/:action',
    component: ProfileComponent,
    data: {
      title: 'Profile'
    }
  },
  {
    path: 'affiliate',
    component: AffiliateComponent,
    data: {
      title: 'Affiliate'
    }
  },
  {
    path: 'templates/new',
    component: TemplateComponent,
    data: {
      title: 'Template'
    }
  },
  {
    path: 'templates/:page',
    component: TemplatesComponent,
    data: {
      title: 'Templates'
    }
  },
  {
    path: 'templates/:mode/:id',
    component: TemplateComponent,
    data: {
      title: 'Template'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'calendar',
    component: CalendarComponent,
    data: {
      title: 'Calendar'
    }
  },
  {
    path: 'calendar/:action',
    component: CalendarComponent,
    data: {
      title: 'Calendar'
    }
  },
  {
    path: 'calendar/:mode/:year/:month/:day',
    component: CalendarComponent,
    data: {
      title: 'Calendar'
    }
  },
  {
    path: 'scheduler',
    component: CalendlyComponent,
    data: {
      title: 'Scheduler'
    }
  },
  {
    path: 'scheduler/event-type/:id',
    component: ScheduleTypeCreateComponent,
    data: {
      title: 'Scheduler Event Type'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'theme',
    component: ThemesComponent,
    data: {
      title: 'Themes'
    }
  },
  {
    path: 'theme/new',
    component: ThemeComponent,
    data: {
      title: 'Theme'
    }
  },
  {
    path: 'theme/:mode/:id',
    component: ThemeComponent,
    data: {
      title: 'Theme'
    }
  },
  {
    path: 'notifications',
    component: NotificationsListComponent,
    data: {
      title: 'Notifications'
    }
  },
  {
    path: 'to-do',
    component: TaskManagerComponent,
    data: {
      title: 'TO-DO'
    }
  },
  {
    path: 'messages',
    component: MessagesComponent,
    data: {
      title: 'Messages'
    }
  },
  {
    path: 'test',
    component: TestComponent
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent,
    data: {
      title: 'Verify Email'
    }
  },
  {
    path: 'campaign',
    component: CampaignComponent,
    data: {
      title: 'Campaign'
    }
  },
  {
    path: 'campaign/bulk/create',
    component: CampaignCreateComponent,
    data: {
      title: 'New campaign'
    }
  },
  {
    path: 'campaign/bulk/draft/:id',
    component: CampaignCreateComponent,
    data: {
      title: 'Campaign Draft'
    }
  },
  {
    path: 'campaign/:page',
    component: CampaignComponent,
    data: {
      title: 'Campaign'
    }
  },
  {
    path: 'campaign/bulk/:id',
    component: CampaignBulkMailingItemComponent,
    data: {
      title: 'Campaign'
    }
  },
  {
    path: 'newsletter',
    component: NewsletterEditorComponent,
    data: {
      title: 'Newsletter'
    }
  },
  {
    path: 'newsletter/:mode/:id',
    component: NewsletterEditorComponent,
    data: {
      title: 'Newsletter'
    }
  },
  {
    path: 'email-queue/:id',
    component: EmailQueueComponent,
    data: {
      title: 'Email Queue'
    }
  },
  {
    path: 'text-queue/:id',
    component: EmailQueueComponent,
    data: {
      title: 'Text Queue'
    }
  },
  {
    path: 'automation-queue/:id',
    component: AutomationQueueComponent,
    data: {
      title: 'Automation Assign Queue'
    }
  },
  {
    path: 'oneonone-scheduled',
    component: ScheduledOneComponent,
    data: {
      title: 'Scheduled'
    }
  },
  {
    path: 'page-builder',
    component: PageBuilderComponent,
    data: {
      title: 'Page Builder'
    }
  }
];
