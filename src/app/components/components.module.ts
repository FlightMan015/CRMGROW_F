import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { TopbarComponent } from 'src/app/partials/topbar/topbar.component';
import { NavbarComponent } from 'src/app/partials/navbar/navbar.component';
import { SidebarComponent } from 'src/app/partials/sidebar/sidebar.component';
import { SlideTabComponent } from './slide-tab/slide-tab.component';
import { TabOptionComponent } from './tab-option/tab-option.component';
import { ActionsBarComponent } from './actions-bar/actions-bar.component';
import { AvatarEditorComponent } from './avatar-editor/avatar-editor.component';
import { NgxCropperJsModule } from 'ngx-cropperjs-wrapper';
import { SharedModule } from '../layouts/shared/shared.module';
import { ConfirmComponent } from './confirm/confirm.component';
import { ConfirmBulkMaterialsComponent } from './confirm-bulk-materials/confirm-bulk-materials.component';
import { TeamEditComponent } from './team-edit/team-edit.component';
import { TeamDeleteComponent } from './team-delete/team-delete.component';
import { VideoShareComponent } from './video-share/video-share.component';
import { InputContactsComponent } from './input-contacts/input-contacts.component';
import { SelectContactComponent } from './select-contact/select-contact.component';
import { InputAutomationComponent } from './input-automation/input-automation.component';
import { InputTemplateComponent } from './input-template/input-template.component';
import { InputTeamComponent } from './input-team/input-team.component';
import { SelectUserComponent } from './select-user/select-user.component';
import { JoinCallRequestComponent } from './join-call-request/join-call-request.component';
import { SelectLeaderComponent } from './select-leader/select-leader.component';
import { CalendarDialogComponent } from './calendar-dialog/calendar-dialog.component';
import { CalendarEventComponent } from './calendar-event/calendar-event.component';
import { CalendarRecurringDialogComponent } from './calendar-recurring-dialog/calendar-recurring-dialog.component';
import { CallRequestCancelComponent } from './call-request-cancel/call-request-cancel.component';
import { DataEmptyComponent } from './data-empty/data-empty.component';
import { CampaignAddListComponent } from './campaign-add-list/campaign-add-list.component';
import { CampaignAddContactComponent } from './campaign-add-contact/campaign-add-contact.component';
import { UploadContactsComponent } from './upload-contacts/upload-contacts.component';
import { ContactCreateComponent } from './contact-create/contact-create.component';
import { TaskCreateComponent } from './task-create/task-create.component';
import { NoteCreateComponent } from './note-create/note-create.component';
import { CalendarDeclineComponent } from './calendar-decline/calendar-decline.component';
import { JoinTeamComponent } from './join-team/join-team.component';
import { InviteTeamComponent } from './invite-team/invite-team.component';
import { SearchUserComponent } from './search-user/search-user.component';
import { CaseConfirmComponent } from './case-confirm/case-confirm.component';
import { CaseConfirmPercentComponent } from './case-confirm-percent/case-confirm-percent.component';
import { LabelSelectComponent } from './label-select/label-select.component';
import { CampaignAddBroadcastComponent } from './campaign-add-broadcast/campaign-add-broadcast.component';
import { MailListComponent } from './mail-list/mail-list.component';
import { CustomFieldAddComponent } from './custom-field-add/custom-field-add.component';
import { CustomFieldDeleteComponent } from './custom-field-delete/custom-field-delete.component';
import { AutomationAssignComponent } from './automation-assign/automation-assign.component';
import { LinkContactAssignComponent } from './link-contact-assign/link-contact-assign.component';
import { MaterialAddComponent } from './material-add/material-add.component';
import { NotifyComponent } from './notify/notify.component';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { ShareSiteComponent } from './share-site/share-site.component';
import { AssistantCreateComponent } from './assistant-create/assistant-create.component';
import { AssistantPasswordComponent } from './assistant-password/assistant-password.component';
import { AssistantRemoveComponent } from './assistant-remove/assistant-remove.component';
import { TagEditComponent } from './tag-edit/tag-edit.component';
import { TagDeleteComponent } from './tag-delete/tag-delete.component';
import { MaterialEditTemplateComponent } from './material-edit-template/material-edit-template.component';
import { MaterialShareComponent } from './material-share/material-share.component';
import { VideoEditComponent } from './video-edit/video-edit.component';
import { PdfEditComponent } from './pdf-edit/pdf-edit.component';
import { ImageEditComponent } from './image-edit/image-edit.component';
import { CallRequestScheduledComponent } from './call-request-scheduled/call-request-scheduled.component';
import { CalendarOverlayComponent } from './calendar-overlay/calendar-overlay.component';
import { ManageLabelComponent } from './manage-label/manage-label.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { RecordSettingDialogComponent } from './record-setting-dialog/record-setting-dialog.component';
import { TeamCreateComponent } from './team-create/team-create.component';
import { AdvancedFilterComponent } from './advanced-filter/advanced-filter.component';
import { TaskFilterComponent } from './task-filter/task-filter.component';
import { ContactBulkComponent } from './contact-bulk/contact-bulk.component';
import { TaskTypeComponent } from './task-type/task-type.component';
import { InputTagComponent } from './input-tag/input-tag.component';
import { LabelEditColorComponent } from './label-edit-color/label-edit-color.component';
import { LabelEditComponent } from './label-edit/label-edit.component';
import { ContactMergeComponent } from './contact-merge/contact-merge.component';
import { InputSourceComponent } from './input-source/input-source.component';
import { InputCompanyComponent } from './input-company/input-company.component';
import { ImportContactEditComponent } from './import-contact-edit/import-contact-edit.component';
import { ImportContactMergeComponent } from './import-contact-merge/import-contact-merge.component';
import { AutomationShowFullComponent } from './automation-show-full/automation-show-full.component';
import { AutomationTreeOverlayComponent } from './automation-tree-overlay/automation-tree-overlay.component';
import { MaterialSendComponent } from './material-send/material-send.component';
import { ImportContactMergeConfirmComponent } from './import-contact-merge-confirm/import-contact-merge-confirm.component';
import { DealCreateComponent } from './deal-create/deal-create.component';
import { ScheduleSendComponent } from './schedule-send/schedule-send.component';
import { ScheduleSelectComponent } from './schedule-select/schedule-select.component';
import { DealTimeDurationComponent } from './deal-time-duration/deal-time-duration.component';
import { DealAutomationComponent } from './deal-automation/deal-automation.component';
import { HtmlEditorComponent } from './html-editor/html-editor.component';
import { AccordionComponent } from './accordion/accordion.component';
import { SubjectInputComponent } from './subject-input/subject-input.component';
import { SmartCodeAddComponent } from './smart-code-add/smart-code-add.component';
import { SmsEditorComponent } from './sms-editor/sms-editor.component';
import { TaskEditComponent } from './task-edit/task-edit.component';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { FilterAddComponent } from './filter-add/filter-add.component';
import { ContactAssignAutomationComponent } from './contact-assign-automation/contact-assign-automation.component';
import { TaskBulkComponent } from './task-bulk/task-bulk.component';
import { SendEmailComponent } from './send-email/send-email.component';
import { ContactEditComponent } from './contact-edit/contact-edit.component';
import { AdditionalEditComponent } from './additional-edit/additional-edit.component';
import { ActionsHeaderComponent } from './actions-header/actions-header.component';
import { NoteEditComponent } from './note-edit/note-edit.component';
import { TaskDeleteComponent } from './task-delete/task-delete.component';
import { AuthServiceConfig, GoogleLoginProvider } from 'angularx-social-login';
import { DealStageCreateComponent } from './deal-stage-create/deal-stage-create.component';
import { TextStatusComponent } from './text-status/text-status.component';
import { EmailStatusComponent } from './email-status/email-status.component';
import { TeamContactShareComponent } from './team-contact-share/team-contact-share.component';
import { SelectMemberComponent } from './select-member/select-member.component';
import { PlanSelectComponent } from './plan-select/plan-select.component';
import { PlanBuyComponent } from './plan-buy/plan-buy.component';
import { DealStageDeleteComponent } from './deal-stage-delete/deal-stage-delete.component';
import { DealEditComponent } from './deal-edit/deal-edit.component';
import { DateInputComponent } from './date-input/date-input.component';
import { DateCustomInputComponent } from './date-custom-input/date-custom-input.component';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { AutomationStatusComponent } from './automation-status/automation-status.component';
import { ContactMergeLabelComponent } from './contact-merge-label/contact-merge-label.component';
import { InputCountryComponent } from './input-country/input-country.component';
import { InputStateComponent } from './input-state/input-state.component';
import { DealContactComponent } from './deal-contact/deal-contact.component';
import { SelectTeamComponent } from './select-team/select-team.component';
import { ContactShareComponent } from './contact-share/contact-share.component';
import { FilterInputComponent } from './filter-input/filter-input.component';
import { StageInputComponent } from './stage-input/stage-input.component';
import { SelectCalendarComponent } from './select-calendar/select-calendar.component';
import { CallRequestDetailComponent } from './call-request-detail/call-request-detail.component';
import { FolderComponent } from './folder/folder.component';
import { MoveFolderComponent } from './move-folder/move-folder.component';
import { InputContactChipComponent } from './input-contact-chip/input-contact-chip.component';
import { ContactDetailComponent } from './contact-detail/contact-detail.component';
import { DetailErrorComponent } from './detail-error/detail-error.component';
import { MaterialBrowserComponent } from './material-browser/material-browser.component';
import { GlobalSearchComponent } from './global-search/global-search.component';
import { PurchaseMessageComponent } from './purchase-message/purchase-message.component';
import { AddPhoneComponent } from './add-phone/add-phone.component';
import { DeleteFolderComponent } from './delete-folder/delete-folder.component';
import { SendTextComponent } from './send-text/send-text.component';
import { ZapierDialogComponent } from './zapier-dialog/zapier-dialog.component';
import { CalendlyDialogComponent } from './calendly-dialog/calendly-dialog.component';
import { CalendlyListComponent } from './calendly-list/calendly-list.component';
import { InputEmailChipComponent } from './input-email-chip/input-email-chip.component';
import { TemplateCreateComponent } from './template-create/template-create.component';
import { SendBulkTextComponent } from './send-bulk-text/send-bulk-text.component';
import { SocialShareComponent } from './social-share/social-share.component';
import { TeamMaterialShareComponent } from './team-material-share/team-material-share.component';
import { TemplateBrowserComponent } from './template-browser/template-browser.component';
import { AutomationBrowserComponent } from './automation-browser/automation-browser.component';
import { AutomationDetailOverlayComponent } from './automation-detail-overlay/automation-detail-overlay.component';
import { TeamMemberProfileComponent } from './team-member-profile/team-member-profile.component';
import { AdditionalFieldsComponent } from './additional-fields/additional-fields.component';
import { AutomationShareComponent } from './automation-share/automation-share.component';
import { MemberSelectorComponent } from './member-selector/member-selector.component';
import { PaymentCardComponent } from './payment-card/payment-card.component';
import { CallOverlayComponent } from './call-overlay/call-overlay.component';
import { MaterialTimelinesComponent } from './material-timelines/material-timelines.component';
import { EmailTimelinesComponent } from './email-timelines/email-timelines.component';
import { TextTimelinesComponent } from './text-timelines/text-timelines.component';
import { PlayTimelinesComponent } from './play-timelines/play-timelines.component';
import { InputContactDealComponent } from './input-contact-deal/input-contact-deal.component';
import { SubscriptionCancelReasonComponent } from 'src/app/components/subscription-cancel-reason/subscription-cancel-reason.component';
import { StripeModule } from 'stripe-angular';
import { STRIPE_KEY } from '../constants/variable.constants';
import { UpgradePlanErrorComponent } from './upgrade-plan-error/upgrade-plan-error.component';
import { DialPlanComponent } from './dial-plan/dial-plan.component';
import { StopShareContactComponent } from './stop-share-contact/stop-share-contact.component';
import { VideoPopupComponent } from './video-popup/video-popup.component';
import { MessageFilesComponent } from './message-files/message-files.component';
import { ConnectNewCalendarComponent } from './connect-new-calendar/connect-new-calendar.component';
import { InputStageComponent } from './input-stage/input-stage.component';
import { CalendarMoreEventComponent } from './calendar-more-event/calendar-more-event.component';
import { ScheduleEventTypeComponent } from './schedule-event-type/schedule-event-type.component';
import { ScheduleLocationEditComponent } from './schedule-location-edit/schedule-location-edit.component';
import { SelectCompanyComponent } from './select-company/select-company.component';
import { AddUserComponent } from './add-user/add-user.component';
import { CodeInputModule } from 'angular-code-input';
import { VerifyCodeConfirmComponent } from './verify-code-confirm/verify-code-confirm.component';
import { CompanyInputComponent } from './company-input/company-input.component';
import { BuyAccountComponent } from './buy-account/buy-account.component';
import { FormatProfileComponent } from './format-profile/format-profile.component';
import { CaseMaterialConfirmComponent } from './case-material-confirm/case-material-confirm.component';
import { CalendarSettingComponent } from './calendar-setting/calendar-setting.component';
import { ImportTemplatesComponent } from './import-templates/import-templates.component';
import { ContactDeleteComponent } from './contact-delete/contact-delete.component';
import { LabelDisplayComponent } from './label-display/label-display.component';
import { ConfirmPrimaryContactComponent } from './confirm-primary-contact/confirm-primary-contact.component';
import { DialerLogComponent } from './dialer-log/dialer-log.component';
import { DialerReportComponent } from './dialer-report/dialer-report.component';
import { SelectAutomationComponent } from './select-automation/select-automation.component';
import { DialerCallComponent } from './dialer-call/dialer-call.component';
import { CreateCallLabelComponent } from './create-call-label/create-call-label.component';
import { ForwardEmailComponent } from './forward-email/forward-email.component';
import { AccountSettingComponent } from './account-setting/account-setting.component';
import { TemplatesBrowserComponent } from './templates-browser/templates-browser.component';
import { NotificationAlertComponent } from './notification-alert/notification-alert.component';
import { CustomFieldsComponent } from './custom-fields/custom-fields.component';
import { ToastrComponent } from './toastr/toastr.component';
import { IntroModalComponent } from './intro-modal/intro-modal.component';
import { UserInsightsComponent } from 'src/app/pages/user-insights/user-insights.component';
import { DealMoveComponent } from './deal-move/deal-move.component';
import { SelectContactListComponent } from './select-contact-list/select-contact-list.component';
import { UserflowCongratComponent } from './userflow-congrat/userflow-congrat.component';
import { LeadCaptureFormComponent } from './lead-capture-form/lead-capture-form.component';
import { CaptureFieldAddComponent } from './capture-field-add/capture-field-add.component';
import { LeadCaptureFormAddComponent } from './lead-capture-form-add/lead-capture-form-add.component';
import { AssetsManagerComponent } from './assets-manager/assets-manager.component';
import { AddActionComponent } from './add-action/add-action.component';
import { EditActionComponent } from './edit-action/edit-action.component';
import { SelectBranchComponent } from './select-branch/select-branch.component';
import { DealStageUpdateComponent } from './deal-stage-update/deal-stage-update.component';
import { PipelineCreateComponent } from './pipeline-create/pipeline-create.component';
import { EventTypeAutomationComponent } from './event-type-automation/event-type-automation.component';
import { EventTypeTagsComponent } from './event-type-tags/event-type-tags.component';
import { PipelineRenameComponent } from './pipeline-rename/pipeline-rename.component';
import { TaskRecurringDialogComponent } from './task-recurring-dialog/task-recurring-dialog.component';
import { DeletePipelineComponent } from './delete-pipeline/delete-pipeline.component';
import { ChangeFolderComponent } from './change-folder/change-folder.component';
import { RemoveFolderComponent } from './remove-folder/remove-folder.component';
import { ConfirmRemoveAutomationComponent } from './confirm-remove-automation/confirm-remove-automation.component';
import { CaseConfirmKeepComponent } from './case-confirm-keep/case-confirm-keep.component';
import { TaskSettingComponent } from './task-setting/task-setting.component';
import { InputEventTypeComponent } from './input-event-type/input-event-type.component';
import { InputSchedulerComponent } from './input-scheduler/input-scheduler.component';
import { SelectTimezoneComponent } from './select-timezone/select-timezone.component';
import { ScheduleSettingComponent } from './schedule-setting/schedule-setting.component';
import { ActionImpossibleNotificationComponent } from './action-impossible-notification/action-impossible-notification.component';
import { MaterialChangeComponent } from './material-change/material-change.component';
import { AudioNoteComponent } from './audio-note/audio-note.component';
import { ConfirmShareContactsComponent } from './confirm-share-contacts/confirm-share-contacts.component';
import { ConfirmBulkTemplatesComponent } from './confirm-bulk-templates/confirm-bulk-templates.component';

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
    TopbarComponent,
    NavbarComponent,
    SidebarComponent,
    SlideTabComponent,
    TabOptionComponent,
    ActionsBarComponent,
    AvatarEditorComponent,
    ConfirmComponent,
    ConfirmBulkMaterialsComponent,
    TeamEditComponent,
    TeamDeleteComponent,
    VideoShareComponent,
    InputContactsComponent,
    SelectContactComponent,
    InputAutomationComponent,
    InputTemplateComponent,
    InputTeamComponent,
    SelectUserComponent,
    JoinCallRequestComponent,
    SelectLeaderComponent,
    CallRequestCancelComponent,
    DataEmptyComponent,
    ConfirmComponent,
    SelectLeaderComponent,
    CalendarDialogComponent,
    CalendarEventComponent,
    CalendarRecurringDialogComponent,
    CampaignAddListComponent,
    CampaignAddContactComponent,
    UploadContactsComponent,
    ContactCreateComponent,
    TaskCreateComponent,
    NoteCreateComponent,
    CalendarDeclineComponent,
    JoinTeamComponent,
    InviteTeamComponent,
    SearchUserComponent,
    CaseConfirmComponent,
    CaseConfirmPercentComponent,
    LabelSelectComponent,
    CampaignAddBroadcastComponent,
    MailListComponent,
    CustomFieldAddComponent,
    CustomFieldDeleteComponent,
    AutomationAssignComponent,
    LinkContactAssignComponent,
    MaterialAddComponent,
    NotifyComponent,
    SafeHtmlPipe,
    ShareSiteComponent,
    AssistantCreateComponent,
    AssistantPasswordComponent,
    AssistantRemoveComponent,
    TagEditComponent,
    TagDeleteComponent,
    MaterialEditTemplateComponent,
    MaterialShareComponent,
    VideoEditComponent,
    PdfEditComponent,
    ImageEditComponent,
    CallRequestScheduledComponent,
    ManageLabelComponent,
    RecordSettingDialogComponent,
    TeamCreateComponent,
    CalendarOverlayComponent,
    AdvancedFilterComponent,
    TaskFilterComponent,
    ContactBulkComponent,
    TaskTypeComponent,
    InputTagComponent,
    LabelEditColorComponent,
    LabelEditComponent,
    ContactMergeComponent,
    InputSourceComponent,
    InputCompanyComponent,
    ImportContactEditComponent,
    ImportContactMergeComponent,
    AutomationShowFullComponent,
    AutomationTreeOverlayComponent,
    MaterialSendComponent,
    ImportContactMergeConfirmComponent,
    DealCreateComponent,
    ScheduleSendComponent,
    ScheduleSelectComponent,
    DealTimeDurationComponent,
    DealAutomationComponent,
    HtmlEditorComponent,
    AccordionComponent,
    SubjectInputComponent,
    SmartCodeAddComponent,
    SmsEditorComponent,
    FilterAddComponent,
    ContactAssignAutomationComponent,
    TaskEditComponent,
    FilterAddComponent,
    TaskBulkComponent,
    SendEmailComponent,
    ContactEditComponent,
    AdditionalEditComponent,
    ActionsHeaderComponent,
    NoteEditComponent,
    TaskDeleteComponent,
    DealStageCreateComponent,
    TextStatusComponent,
    EmailStatusComponent,
    TeamContactShareComponent,
    SelectMemberComponent,
    PlanSelectComponent,
    PlanBuyComponent,
    DealStageDeleteComponent,
    DealEditComponent,
    DateInputComponent,
    DateCustomInputComponent,
    AutomationStatusComponent,
    ContactMergeLabelComponent,
    InputCountryComponent,
    InputStateComponent,
    ContactMergeLabelComponent,
    DealContactComponent,
    SelectTeamComponent,
    ContactShareComponent,
    FilterInputComponent,
    StageInputComponent,
    SelectCalendarComponent,
    CallRequestDetailComponent,
    FolderComponent,
    MoveFolderComponent,
    InputContactChipComponent,
    ContactDetailComponent,
    DetailErrorComponent,
    MaterialBrowserComponent,
    GlobalSearchComponent,
    PurchaseMessageComponent,
    AddPhoneComponent,
    DeleteFolderComponent,
    SendTextComponent,
    ZapierDialogComponent,
    CalendlyDialogComponent,
    CalendlyListComponent,
    InputEmailChipComponent,
    TemplateCreateComponent,
    SendBulkTextComponent,
    SocialShareComponent,
    TeamMaterialShareComponent,
    TemplateBrowserComponent,
    AutomationBrowserComponent,
    AutomationDetailOverlayComponent,
    TeamMemberProfileComponent,
    AdditionalFieldsComponent,
    AutomationShareComponent,
    MemberSelectorComponent,
    PaymentCardComponent,
    CallOverlayComponent,
    MaterialTimelinesComponent,
    EmailTimelinesComponent,
    TextTimelinesComponent,
    PlayTimelinesComponent,
    InputContactDealComponent,
    UpgradePlanErrorComponent,
    DialPlanComponent,
    StopShareContactComponent,
    VideoPopupComponent,
    InputContactDealComponent,
    SubscriptionCancelReasonComponent,
    MessageFilesComponent,
    ConnectNewCalendarComponent,
    InputStageComponent,
    CalendarMoreEventComponent,
    ScheduleEventTypeComponent,
    ScheduleLocationEditComponent,
    SelectCompanyComponent,
    AddUserComponent,
    VerifyCodeConfirmComponent,
    CompanyInputComponent,
    BuyAccountComponent,
    FormatProfileComponent,
    CaseMaterialConfirmComponent,
    CalendarSettingComponent,
    ImportTemplatesComponent,
    ContactDeleteComponent,
    LabelDisplayComponent,
    ConfirmPrimaryContactComponent,
    DialerLogComponent,
    DialerReportComponent,
    SelectAutomationComponent,
    DialerCallComponent,
    CreateCallLabelComponent,
    ForwardEmailComponent,
    AccountSettingComponent,
    TemplatesBrowserComponent,
    NotificationAlertComponent,
    ToastrComponent,
    IntroModalComponent,
    UserInsightsComponent,
    CustomFieldsComponent,
    ToastrComponent,
    DealMoveComponent,
    SelectContactListComponent,
    UserflowCongratComponent,
    LeadCaptureFormComponent,
    CaptureFieldAddComponent,
    LeadCaptureFormAddComponent,
    AssetsManagerComponent,
    AddActionComponent,
    EditActionComponent,
    SelectBranchComponent,
    DealStageUpdateComponent,
    PipelineCreateComponent,
    EventTypeAutomationComponent,
    EventTypeTagsComponent,
    PipelineRenameComponent,
    TaskRecurringDialogComponent,
    DeletePipelineComponent,
    ChangeFolderComponent,
    RemoveFolderComponent,
    ConfirmRemoveAutomationComponent,
    CaseConfirmKeepComponent,
    TaskSettingComponent,
    InputEventTypeComponent,
    InputSchedulerComponent,
    SelectTimezoneComponent,
    ScheduleSettingComponent,
    ActionImpossibleNotificationComponent,
    MaterialChangeComponent,
    AudioNoteComponent,
    ConfirmShareContactsComponent,
    ConfirmBulkTemplatesComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule,
    TranslateModule.forChild({ extend: true }),
    NgxCropperJsModule,
    NgxGraphModule,
    MatCardModule,
    ColorPickerModule,
    NgCircleProgressModule.forRoot({
      // set defaults here
      radius: 100,
      outerStrokeWidth: 16,
      innerStrokeWidth: 8,
      outerStrokeColor: '#78C000',
      innerStrokeColor: '#C7E596',
      animationDuration: 300
    }),
    StripeModule.forRoot(STRIPE_KEY),
    CodeInputModule.forRoot({
      codeLength: 6,
      isCharsCode: true,
      code: ''
    }),
    PdfViewerModule,

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
  exports: [
    TopbarComponent,
    NavbarComponent,
    SidebarComponent,
    SlideTabComponent,
    TabOptionComponent,
    ActionsBarComponent,
    ActionsHeaderComponent,
    ConfirmComponent,
    ConfirmBulkMaterialsComponent,
    TeamEditComponent,
    TeamDeleteComponent,
    InputContactsComponent,
    SelectContactComponent,
    InputTemplateComponent,
    InputAutomationComponent,
    InputTeamComponent,
    InputTagComponent,
    SelectUserComponent,
    SelectLeaderComponent,
    CalendarDialogComponent,
    CampaignAddListComponent,
    CampaignAddContactComponent,
    UploadContactsComponent,
    DataEmptyComponent,
    SelectLeaderComponent,
    LabelSelectComponent,
    MailListComponent,
    CustomFieldAddComponent,
    CustomFieldDeleteComponent,
    TagEditComponent,
    TagDeleteComponent,
    MaterialEditTemplateComponent,
    CalendarOverlayComponent,
    VideoEditComponent,
    PdfEditComponent,
    ImageEditComponent,
    CalendarEventComponent,
    AdvancedFilterComponent,
    ContactBulkComponent,
    ManageLabelComponent,
    TaskFilterComponent,
    ContactMergeComponent,
    InputTagComponent,
    InputSourceComponent,
    InputCompanyComponent,
    AutomationShowFullComponent,
    AutomationTreeOverlayComponent,
    MaterialSendComponent,
    TaskTypeComponent,
    DealCreateComponent,
    DealTimeDurationComponent,
    HtmlEditorComponent,
    AccordionComponent,
    SendEmailComponent,
    ContactEditComponent,
    AdditionalEditComponent,
    SelectMemberComponent,
    DealStageCreateComponent,
    PlanSelectComponent,
    PlanBuyComponent,
    DealStageDeleteComponent,
    DealEditComponent,
    DateInputComponent,
    DateCustomInputComponent,
    AutomationStatusComponent,
    DealContactComponent,
    FilterInputComponent,
    StageInputComponent,
    SelectCalendarComponent,
    InputContactChipComponent,
    GlobalSearchComponent,
    PurchaseMessageComponent,
    AddPhoneComponent,
    ZapierDialogComponent,
    CalendlyDialogComponent,
    CalendlyListComponent,
    InputEmailChipComponent,
    TemplateCreateComponent,
    SocialShareComponent,
    TeamMaterialShareComponent,
    AutomationDetailOverlayComponent,
    AdditionalFieldsComponent,
    PaymentCardComponent,
    CallOverlayComponent,
    MemberSelectorComponent,
    MaterialTimelinesComponent,
    EmailTimelinesComponent,
    TextTimelinesComponent,
    PlayTimelinesComponent,
    DialPlanComponent,
    VideoPopupComponent,
    MessageFilesComponent,
    CalendarMoreEventComponent,
    ScheduleEventTypeComponent,
    ScheduleLocationEditComponent,
    SelectCompanyComponent,
    AddUserComponent,
    CompanyInputComponent,
    CalendarSettingComponent,
    ContactDeleteComponent,
    RecordSettingDialogComponent,
    LabelDisplayComponent,
    ConfirmPrimaryContactComponent,
    SelectAutomationComponent,
    AccountSettingComponent,
    IntroModalComponent,
    UserInsightsComponent,
    CustomFieldsComponent,
    AccountSettingComponent,
    DealMoveComponent,
    SelectContactListComponent,
    UserflowCongratComponent,
    LeadCaptureFormComponent,
    CaptureFieldAddComponent,
    LeadCaptureFormAddComponent,
    AddActionComponent,
    TemplatesBrowserComponent,
    EditActionComponent,
    SelectBranchComponent,
    DealStageUpdateComponent,
    PipelineCreateComponent,
    EventTypeAutomationComponent,
    EventTypeTagsComponent,
    PipelineRenameComponent,
    TaskRecurringDialogComponent,
    SubscriptionCancelReasonComponent,
    DeletePipelineComponent,
    ConfirmRemoveAutomationComponent,
    TaskSettingComponent,
    InputEventTypeComponent,
    InputSchedulerComponent,
    SelectTimezoneComponent,
    MaterialChangeComponent,
    AudioNoteComponent,
    ConfirmShareContactsComponent,
    ConfirmBulkTemplatesComponent
  ],
  bootstrap: [
    ContactCreateComponent,
    AvatarEditorComponent,
    VideoShareComponent,
    JoinCallRequestComponent,
    CallRequestCancelComponent,
    CallRequestDetailComponent,
    VideoShareComponent,
    SelectTeamComponent,
    DeleteFolderComponent,
    DeletePipelineComponent,
    ForwardEmailComponent
  ],
  providers: [
    {
      provide: MOMENT,
      useValue: moment
    }
  ]
})
export class ComponentsModule {}
