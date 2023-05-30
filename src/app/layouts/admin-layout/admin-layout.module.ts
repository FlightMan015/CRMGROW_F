import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgxAudioPlayerModule } from 'ngx-audio-player';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { OverlayModule } from '@angular/cdk/overlay';
// import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { StripeModule } from 'stripe-angular';
import { EmailEditorModule } from 'angular-email-editor';
import { NgCircleProgressModule } from 'ng-circle-progress';

import { AdminLayoutRoutes } from './admin-layout.routing.module';
import { SharedModule } from '../shared/shared.module';
import { ComponentsModule } from '../../components/components.module';
import { environment } from 'src/environments/environment';

import { HomeComponent } from '../../pages/home/home.component';
import { TasksComponent } from 'src/app/pages/tasks/tasks.component';
import { ContactsComponent } from 'src/app/pages/contacts/contacts.component';
import { MaterialsComponent } from 'src/app/pages/materials/materials.component';
import { MaterialsListComponent } from 'src/app/pages/materials-list/materials-list.component';
import { MaterialsLibComponent } from 'src/app/pages/materials-lib/materials-lib.component';
import { MaterialComponent } from 'src/app/pages/material/material.component';
import { ProfileComponent } from '../../pages/profile/profile.component';
import { GeneralProfileComponent } from '../../pages/general-profile/general-profile.component';
import { SignatureComponent } from '../../pages/signature/signature.component';
import { SecurityComponent } from '../../pages/security/security.component';
import { IntegrationComponent } from '../../pages/integration/integration.component';
import { PaymentComponent } from '../../pages/payment/payment.component';
import { ActivitiesComponent } from '../../pages/activities/activities.component';
import { AffiliateComponent } from '../../pages/affiliate/affiliate.component';
import { AutomationsComponent } from '../../pages/automations/automations.component';
import { AutomationsListComponent } from 'src/app/pages/automations-list/automations-list.component';
import { AutomationsLibComponent } from 'src/app/pages/automations-lib/automations-lib.component';
import { SettingsComponent } from '../../pages/settings/settings.component';
import { TeamsComponent } from '../../pages/teams/teams.component';
import { TemplatesComponent } from '../../pages/templates/templates.component';
import { TemplatesListComponent } from 'src/app/pages/templates-list/templates-list.component';
import { TemplatesLibComponent } from 'src/app/pages/templates-lib/templates-lib.component';
import { TemplateComponent } from '../../pages/template/template.component';
import { TeamComponent } from '../../pages/team/team.component';
import { CalendarComponent } from '../../pages/calendar/calendar.component';
import { CalendlyComponent } from '../../pages/calendly/calendly.component';
import { NotificationsComponent } from '../../pages/notifications/notifications.component';
import { AssistantComponent } from '../../pages/assistant/assistant.component';
import { LeadCaptureComponent } from '../../pages/lead-capture/lead-capture.component';
import { TagManagerComponent } from '../../pages/tag-manager/tag-manager.component';
import { LabelManagerComponent } from '../../pages/label-manager/label-manager.component';
import { StatusAutomationComponent } from '../../pages/status-automation/status-automation.component';
import { SocialProfileComponent } from '../../pages/social-profile/social-profile.component';
import { DealsComponent } from '../../pages/deals/deals.component';
import { DealsDetailComponent } from '../../pages/deals-detail/deals-detail.component';
import { AutoflowComponent } from '../../pages/autoflow/autoflow.component';
import { VideoCreateComponent } from '../../pages/video-create/video-create.component';
import { MoneyPipe } from '../../pipes/money.pipe';
import { AutoResendVideoComponent } from '../../pages/auto-resend-video/auto-resend-video.component';
import { AutoFollowUpComponent } from '../../pages/auto-follow-up/auto-follow-up.component';
import { ContactComponent } from '../../pages/contact/contact.component';
import { TeamListComponent } from '../../pages/team-list/team-list.component';
import { TeamCallComponent } from '../../pages/team-call/team-call.component';
import { AnalyticsVideoSentComponent } from '../../pages/analytics-video-sent/analytics-video-sent.component';
import { AnalyticsVideoWatchedComponent } from '../../pages/analytics-video-watched/analytics-video-watched.component';
import { AnalyticsContactsAddedComponent } from '../../pages/analytics-contacts-added/analytics-contacts-added.component';
import { ThemesComponent } from '../../pages/themes/themes.component';
import { ThemeComponent } from '../../pages/theme/theme.component';
import { AnalyticsMaterialComponent } from '../../pages/analytics-material/analytics-material.component';
import { NotificationsListComponent } from '../../pages/notifications-list/notifications-list.component';
import { SmartCodeComponent } from '../../pages/smart-code/smart-code.component';
import { SmsLimitsComponent } from '../../pages/sms-limits/sms-limits.component';
import { DealsSettingComponent } from '../../pages/deals-setting/deals-setting.component';
import { MessagesComponent } from 'src/app/pages/messages/messages.component';
import { TeamShareMaterialComponent } from '../../pages/team-share-material/team-share-material.component';
import { TeamShareContactComponent } from '../../pages/team-share-contact/team-share-contact.component';
import { TeamShareAutomationComponent } from '../../pages/team-share-automation/team-share-automation.component';
import { TeamShareTemplateComponent } from '../../pages/team-share-template/team-share-template.component';
import { TestComponent } from '../../pages/test/test.component';
import { VerifyEmailComponent } from '../../pages/verify-email/verify-email.component';
import { CampaignComponent } from '../../pages/campaign/campaign.component';
import { CampaignBulkMailingComponent } from '../../pages/campaign-bulk-mailing/campaign-bulk-mailing.component';
import { CampaignBulkMailingItemComponent } from '../../pages/campaign-bulk-mailing-item/campaign-bulk-mailing-item.component';
import { CampaignSmtpComponent } from '../../pages/campaign-smtp/campaign-smtp.component';
import { CompanyComponent } from '../../pages/company/company.component';
import { CampaignTemplatesComponent } from '../../pages/campaign-templates/campaign-templates.component';
import { NewsletterEditorComponent } from '../../pages/newsletter-editor/newsletter-editor.component';
import { EmailQueueComponent } from '../../pages/email-queue/email-queue.component';
import { ScheduledOneComponent } from '../../pages/scheduled-one/scheduled-one.component';
import { ScheduleTypesComponent } from '../../pages/schedule-types/schedule-types.component';
import { ScheduleTypeCreateComponent } from '../../pages/schedule-type-create/schedule-type-create.component';
import { CampaignCreateComponent } from '../../pages/campaign-create/campaign-create.component';
import { TextQueueComponent } from '../../pages/text-queue/text-queue.component';
import { AutomationQueueComponent } from '../../pages/automation-queue/automation-queue.component';
import { SubscriptionComponent } from '../../pages/subscription/subscription.component';
import { BillingComponent } from '../../pages/billing/billing.component';
import { IntegratedCalendarsComponent } from '../../pages/integrated-calendars/integrated-calendars.component';
import { ThemeSettingComponent } from '../../pages/theme-setting/theme-setting.component';
import { ScheduledEventsComponent } from '../../pages/scheduled-events/scheduled-events.component';
import { AnalyticsMaterialLibraryComponent } from '../../pages/analytics-material-library/analytics-material-library.component';
import { TaskManagerComponent } from '../../pages/task-manager/task-manager.component';
import { BusinessHourComponent } from 'src/app/pages/business-hour/business-hour.component';

// const config: SocketIoConfig = {
//   url: environment.server + '/application',
//   options: {}
// };
import {
  CalendarDateFormatter,
  CalendarModule,
  CalendarMomentDateFormatter,
  DateAdapter,
  MOMENT
} from 'angular-calendar';
const moment = require('moment');
import { adapterFactory } from 'angular-calendar/date-adapters/moment';
export function momentAdapterFactory() {
  return adapterFactory(moment);
}

@NgModule({
  declarations: [
    TasksComponent,
    ContactsComponent,
    MaterialsComponent,
    MaterialsListComponent,
    MaterialsLibComponent,
    MaterialComponent,
    ProfileComponent,
    GeneralProfileComponent,
    SignatureComponent,
    SecurityComponent,
    IntegrationComponent,
    PaymentComponent,
    ActivitiesComponent,
    HomeComponent,
    AffiliateComponent,
    AutomationsComponent,
    AutomationsListComponent,
    AutomationsLibComponent,
    SettingsComponent,
    TeamsComponent,
    TemplatesComponent,
    TemplatesListComponent,
    TemplatesLibComponent,
    TemplateComponent,
    SocialProfileComponent,
    TeamComponent,
    CalendarComponent,
    CalendlyComponent,
    NotificationsComponent,
    AssistantComponent,
    LeadCaptureComponent,
    TagManagerComponent,
    LabelManagerComponent,
    StatusAutomationComponent,
    AutoResendVideoComponent,
    AutoFollowUpComponent,
    DealsComponent,
    DealsDetailComponent,
    AutoflowComponent,
    VideoCreateComponent,
    MoneyPipe,
    ContactComponent,
    TeamListComponent,
    TeamCallComponent,
    AnalyticsVideoSentComponent,
    AnalyticsVideoWatchedComponent,
    AnalyticsContactsAddedComponent,
    ThemesComponent,
    ThemeComponent,
    AnalyticsMaterialComponent,
    NotificationsListComponent,
    SmartCodeComponent,
    SmsLimitsComponent,
    DealsSettingComponent,
    MessagesComponent,
    TeamShareMaterialComponent,
    TeamShareContactComponent,
    TeamShareAutomationComponent,
    TeamShareTemplateComponent,
    TestComponent,
    VerifyEmailComponent,
    CampaignComponent,
    CampaignBulkMailingComponent,
    CampaignBulkMailingItemComponent,
    CampaignSmtpComponent,
    CompanyComponent,
    CampaignTemplatesComponent,
    NewsletterEditorComponent,
    EmailQueueComponent,
    ScheduledOneComponent,
    ScheduleTypesComponent,
    ScheduleTypeCreateComponent,
    CampaignCreateComponent,
    TextQueueComponent,
    AutomationQueueComponent,
    SubscriptionComponent,
    BillingComponent,
    IntegratedCalendarsComponent,
    ThemeSettingComponent,
    ScheduledEventsComponent,
    AnalyticsMaterialLibraryComponent,
    TaskManagerComponent,
    BusinessHourComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ComponentsModule,
    RouterModule.forChild(AdminLayoutRoutes),
    TranslateModule.forChild({ extend: true }),
    NgxSpinnerModule,
    DragDropModule,
    NgxGraphModule,
    PdfViewerModule,
    OverlayModule,
    EmailEditorModule,
    NgCircleProgressModule.forRoot({
      // set defaults here
      radius: 100,
      outerStrokeWidth: 16,
      innerStrokeWidth: 8,
      outerStrokeColor: '#78C000',
      innerStrokeColor: '#C7E596',
      animationDuration: 300
    }),
    NgxAudioPlayerModule,
    // SocketIoModule.forRoot(config),

    CalendarModule.forRoot(
      {
        provide: DateAdapter,
        useFactory: momentAdapterFactory
      },
      {
        dateFormatter: {
          provide: CalendarDateFormatter,
          useClass: CalendarMomentDateFormatter
        }
      }
    )
  ],
  providers: [
    {
      provide: MOMENT,
      useValue: moment
    }
  ],
  schemas: []
})
export class AdminLayoutModule {}
