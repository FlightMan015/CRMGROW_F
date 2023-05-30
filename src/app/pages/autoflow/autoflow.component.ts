import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ViewContainerRef
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { DagreNodesOnlyLayout } from '../../variables/customDagreNodesOnly';
import { stepRound } from '../../variables/customStepCurved';
import { Layout, Edge, Node, GraphComponent } from '@swimlane/ngx-graph';
import { MatDialog } from '@angular/material/dialog';
import {
  ACTION_CAT,
  ACTION_METHOD,
  AUTOMATION_ICONS,
  BRANCH_COUNT,
  BulkActions,
  DialogSettings,
  ROUTE_PAGE
} from 'src/app/constants/variable.constants';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { CaseConfirmComponent } from 'src/app/components/case-confirm/case-confirm.component';
import { AutomationService } from 'src/app/services/automation.service';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { PageCanDeactivate } from 'src/app/variables/abstractors';
import { UserService } from '../../services/user.service';
import { TabItem } from '../../utils/data.types';
import { SelectionModel } from '@angular/cdk/collections';
import { AutomationAssignComponent } from '../../components/automation-assign/automation-assign.component';
import { Contact, ContactActivity } from 'src/app/models/contact.model';
import { ContactService } from 'src/app/services/contact.service';
import { HandlerService } from 'src/app/services/handler.service';
import { saveAs } from 'file-saver';
import { SendEmailComponent } from 'src/app/components/send-email/send-email.component';
import { NoteCreateComponent } from 'src/app/components/note-create/note-create.component';
import { ContactAssignAutomationComponent } from 'src/app/components/contact-assign-automation/contact-assign-automation.component';
import { NotifyComponent } from 'src/app/components/notify/notify.component';
import { MatDrawer } from '@angular/material/sidenav';
import { Automation } from '../../models/automation.model';
import { OverlayService } from 'src/app/services/overlay.service';
import { TeamMaterialShareComponent } from '../../components/team-material-share/team-material-share.component';
import { CaseMaterialConfirmComponent } from '../../components/case-material-confirm/case-material-confirm.component';
import { environment } from '../../../environments/environment';
import { AddActionComponent } from '../../components/add-action/add-action.component';
import { StoreService } from '../../services/store.service';
import { EditActionComponent } from '../../components/edit-action/edit-action.component';
import { SelectBranchComponent } from '../../components/select-branch/select-branch.component';
import { CaseConfirmPercentComponent } from 'src/app/components/case-confirm-percent/case-confirm-percent.component';
import { User } from 'src/app/models/user.model';
import { ConfirmRemoveAutomationComponent } from 'src/app/components/confirm-remove-automation/confirm-remove-automation.component';
import { MaterialService } from '../../services/material.service';
import { CaseConfirmKeepComponent } from '../../components/case-confirm-keep/case-confirm-keep.component';
import { Pipeline } from '../../models/pipeline.model';
import { DealsService } from '../../services/deals.service';
@Component({
  selector: 'app-autoflow',
  templateUrl: './autoflow.component.html',
  styleUrls: ['./autoflow.component.scss']
})
export class AutoflowComponent
  extends PageCanDeactivate
  implements OnInit, OnDestroy, AfterViewInit {
  layoutSettings = {
    orientation: 'TB'
  };
  center$: Subject<boolean> = new Subject();
  panToNode$: Subject<string> = new Subject();
  curve = stepRound;
  public layout: Layout = new DagreNodesOnlyLayout();

  initEdges = [];
  initNodes = [{ id: 'start', label: '' }];
  TYPES = [
    { id: 'contact', label: 'Contact' },
    { id: 'deal', label: 'Deal' },
    { id: 'deal stage', label: 'Deal Stage' },
    { id: 'lead capture', label: 'Lead Capture' },
    { id: 'scheduler', label: 'Scheduler' },
    { id: 'smarter', label: 'Smarter' },
    { id: 'modular', label: 'Modular' }
  ];
  contactTypes = [
    { id: 'contact', label: 'Contact' },
    { id: 'lead capture', label: 'Lead Capture' },
    { id: 'scheduler', label: 'Scheduler' },
    { id: 'smarter', label: 'Smarter' },
    { id: 'modular', label: 'Modular' }
  ];
  dealTypes = [
    { id: 'deal', label: 'Deal' },
    { id: 'deal stage', label: 'Deal Stage' },
    { id: 'modular', label: 'Modular' }
  ];
  type;
  edges = [];
  nodes = [];
  automations: Automation[] = [];
  _id;
  automation;
  label = 'contact';
  automation_id;
  automation_title = '';
  automation_type = 'contact';
  isSaving = false;
  user_id;
  owner_id;
  auth;
  created_at;
  identity = 1;
  submitted = false;
  saved = true;
  autoZoom = true;
  zoomLevel = 1;
  autoCenter = true;
  editMode = 'new';
  contacts = 0;
  selectedContacts = new SelectionModel<any>(true, []);
  labels = [];
  assignedContactLoading = false;
  deleting = false;
  loadSubscription: Subscription;
  automationsSubscription: Subscription;
  lastUpdatedAction = null;
  lastUpdatedLink = null;
  libraries: Automation[] = [];
  isMine = false;

  tabs: TabItem[] = [
    { icon: '', label: 'Activity', id: 'activity' },
    { icon: '', label: 'Assigned Contacts', id: 'contacts' }
  ];

  selectedTab: TabItem = this.tabs[0];

  CONTACT_ACTIONS = BulkActions.Contacts;
  DISPLAY_COLUMNS = [
    'select',
    'contact_name',
    'contact_label',
    'contact_tags',
    'contact_email',
    'contact_phone',
    'contact_address'
  ];
  DEAL_DISPLAY_COLUMNS = ['deal_title', 'deal_stage', 'deal_contacts'];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[0];
  page = 1;
  searchStr = '';
  selecting = false;
  selectSubscription: Subscription;
  selectSource = '';
  selection: Contact[] = [];
  pageSelection: Contact[] = [];
  pageContacts: ContactActivity[] = [];
  user: User = new User();
  // Variables for Label Update
  isUpdating = false;
  updateSubscription: Subscription;
  searchSubscription: Subscription;

  @ViewChild('drawer') drawer: MatDrawer;
  @ViewChild('graphWrapper') graphWrapper: GraphComponent;
  panelType = '';
  @ViewChild('wrapper') wrapper: ElementRef;
  wrapperWidth = 0;
  wrapperHeight = 0;
  offsetX = 0;
  offsetY = 0;
  profileSubscription: Subscription;
  routeSubscription: Subscription;
  disableActions = [];
  isPackageGroupEmail = true;
  isPackageAutomation = true;
  prevNode;

  loadingAutomation = false;

  deals = [];
  totalDeals = 0;
  loadingDeals = false;
  pageDeals = [];
  isSafari = false;

  @ViewChild('addDrawer') addDrawer: MatDrawer;
  @ViewChild('addPanel') addPanel: AddActionComponent;
  @ViewChild('editDrawer') editDrawer: MatDrawer;
  @ViewChild('editPanel') editPanel: EditActionComponent;

  receiveActionSubscription: Subscription;
  actionMethod = '';
  actionParam;
  isFullScreen = false;

  casePercentConfirmDialog = null;
  caseViewConfirmDialog = null;

  materials = [];
  stages: any[] = [];
  pipelines: Pipeline[] = [];

  constructor(
    private dialog: MatDialog,
    private automationService: AutomationService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private userService: UserService,
    public contactService: ContactService,
    private overlayService: OverlayService,
    private handlerService: HandlerService,
    private viewContainerRef: ViewContainerRef,
    public storeService: StoreService,
    public materialService: MaterialService,
    private dealsService: DealsService
  ) {
    super();
    this.receiveActionSubscription &&
      this.receiveActionSubscription.unsubscribe();
    this.receiveActionSubscription = this.storeService.actionOutputData$.subscribe(
      (res) => {
        if (res) {
          this.runAction(res);
        }
      }
    );
    // this.automationService.loadAll(true);
    this.automationService.loadOwn(true);
  }

  ngOnInit(): void {
    this.type = 'contact';
    this.materialService.loadOwn(true);
    this.storeService.materials$.subscribe((materials) => {
      this.materials = materials;
    });

    this.stages = [];
    this.dealsService.getStage(true);
    this.dealsService.stages$.subscribe((res) => {
      this.stages = [...res];
    });

    this.pipelines = [];
    this.dealsService.getPipeLine().subscribe((pipelines) => {
      this.pipelines = pipelines;
    });

    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.routeSubscription = this.route.params.subscribe((params) => {
      this.isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent
      );
      this.profileSubscription && this.profileSubscription.unsubscribe();
      this.profileSubscription = this.userService.profile$.subscribe((res) => {
        this.user = res;
        this.user_id = res._id;
        this.isPackageGroupEmail = res.email_info?.mass_enable;
        this.isPackageAutomation = res.automation_info?.is_enabled;
        this.disableActions = [];
        if (!this.isPackageGroupEmail) {
          this.disableActions.push({
            label: 'Send email',
            type: 'button',
            icon: 'i-message',
            command: 'message',
            loading: false
          });
        }
        if (!this.isPackageAutomation) {
          this.disableActions.push({
            label: 'Add automation',
            type: 'button',
            icon: 'i-automation',
            command: 'automation',
            loading: false
          });
        }
        this.arrangeAutomationData();
      });
      this.automationsSubscription &&
        this.automationsSubscription.unsubscribe();
      this.automationsSubscription = this.automationService.automations$.subscribe(
        (res) => {
          this.automations = res;
        }
      );
      this.automation_id = params['id'];
      const title = params['title'];
      const mode = params['mode'] || 'new';
      this.editMode = mode;
      console.log('editMode', this.editMode);
      let page = '';

      if (this.editMode !== 'new') {
        page = localStorage.getItem('automation') || '';
      }

      if (this.editMode === 'edit') {
        if (page === 'contacts') {
          this.selectedTab = this.tabs[1];
        }
      }

      if (title) {
        this.automation_title = title;
      }
      if (this.automation_id) {
        this.automationService
          .get(this.automation_id, this.pageSize.id, 0)
          .subscribe((res) => {
            if (res) {
              this.automation_type = res['type'] || 'contact';
              this.storeService.automationType.next(this.automation_type); // Conflicted
              this.label = res['label'] || 'contact';
              if (
                page === 'activity' ||
                page === '' ||
                (this.automation_type === 'contact' && page === 'deals') ||
                (this.automation_type === 'deal' && page === 'contacts')
              ) {
                this.loadAutomation(this.automation_id, this.pageSize.id, 0);
              } else {
                if (this.automation_type === 'contact') {
                  this.loadContacts(this.automation_id, this.pageSize.id, 0);
                } else {
                  this.tabs.splice(1, 1);
                  this.tabs.push({
                    icon: '',
                    label: 'Assigned deals',
                    id: 'deals'
                  });
                  this.selectedTab = this.tabs[1];
                  this.loadDeals(this.automation_id, this.pageSize.id, 0);
                }
              }
            }
          });
      } else {
        this.auth = 'owner';
        const curDate = new Date();
        this.created_at = curDate.toISOString();

        // insert start action
        this.nodes.push({
          category: ACTION_CAT.START,
          id: 'a_10000',
          index: 10000,
          label: 'START',
          leaf: true,
          type: 'start'
        });
      }

      window['confirmReload'] = true;

      // disable auto center for flipping issue when add action.
      setTimeout(() => {
        this.autoCenter = false;
        this.autoZoom = false;
        this.center$.next(false);
      }, 500);
    });
  }

  ngOnDestroy(): void {
    // this.storeData();
    this.receiveActionSubscription &&
      this.receiveActionSubscription.unsubscribe();
    this.routeSubscription && this.routeSubscription.unsubscribe();
    window['confirmReload'] = false;
  }

  ngAfterViewInit(): void {
    this.onResize(null);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event): void {
    if (this.wrapper) {
      this.wrapperWidth = this.wrapper.nativeElement.offsetWidth;
      this.wrapperHeight = this.wrapper.nativeElement.offsetHeight;
    }
  }

  loadAutomation(id: string, count: number, page: number): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadingAutomation = true;
    this.loadingDeals = true;
    this.loadSubscription = this.automationService.libraries$.subscribe(
      (libraries) => {
        this.libraries = libraries;
      }
    );
    this.loadSubscription = this.automationService
      .get(id, count, page)
      .subscribe(
        (res) => {
          if (res) {
            this.automation = res;
            this.automation_type = this.automation.type || 'contact';
            this.storeService.automationType.next(this.automation_type); // conflicted
            this.label = this.automation.label;
            const mode = this.editMode;
            if (this.editMode == 'edit') {
              if (this.automation_type == 'contact') {
                this.TYPES = this.contactTypes;
              } else {
                this.TYPES = this.dealTypes;
              }
            }
            this.arrangeAutomationData();
            this.owner_id = this.automation.user;
            if (this.automation_type === 'contact') {
              this.contacts = this.automation.contacts
                ? this.automation.contacts.count
                : null;

              if (this.automation.contacts.contacts.length) {
                this.assignedContactLoading = true;
                this.automationService
                  .getStatus(
                    this.automation._id,
                    this.automation.contacts.contacts
                  )
                  .subscribe((contacts) => {
                    this.assignedContactLoading = false;
                    this.pageContacts = [];
                    if (this.editMode !== 'new') {
                      for (let i = 0; i < contacts.length; i++) {
                        const newContact = new ContactActivity().deserialize(
                          contacts[i]
                        );
                        this.pageContacts.push(newContact);
                      }
                    }
                  });
              }
            } else {
              this.tabs.splice(1, 1);
              this.tabs.push({
                icon: '',
                label: 'Assigned deals',
                id: 'deals'
              });

              this.loadingDeals = false;
              this.deals = this.automation.deals
                ? this.automation.deals.deals
                : [];
              this.totalDeals = this.automation.deals
                ? this.automation.deals.count
                : 0;

              this.pageDeals = [];
              for (const item of this.deals) {
                const contacts = [];
                if (item.contacts && item.contacts.length > 0) {
                  for (const contact of item.contacts) {
                    contacts.push(new Contact().deserialize(contact));
                  }
                }
                this.pageDeals.push({
                  deal: item.deal,
                  contacts
                });
              }
            }

            if (mode === 'edit') {
              this.automation_id = res['_id'];
              this.automation_title = res['title'];
              this.label = res['label'];
            }

            const actions = res['automations'];
            this.composeGraph(actions);
            this.selectedTab = this.tabs[0];
          } else {
            this.loadingAutomation = false;
          }
        },
        (err) => {
          this.loadingAutomation = false;
        }
      );
  }

  loadContacts(id: string, count: number, page: number): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.automationService
      .get(id, count, page)
      .subscribe(
        (res) => {
          this.automation = res;
          this.contacts = this.automation.contacts.count;
          const mode = this.route.snapshot.params['mode'];
          if (this.automation.contacts.contacts.length) {
            this.assignedContactLoading = true;
            this.automationService
              .getStatus(this.automation._id, this.automation.contacts.contacts)
              .subscribe((contacts) => {
                this.assignedContactLoading = false;
                this.pageContacts = [];
                for (let i = 0; i < contacts.length; i++) {
                  const newContact = new ContactActivity().deserialize(
                    contacts[i]
                  );
                  this.pageContacts.push(newContact);
                }
              });
          }

          if (mode === 'edit') {
            this.automation_id = res['_id'];
          }
          this.automation_title = res['title'];
        },
        (err) => {}
      );
  }
  onChange(value): void {
    if (value == 'deal' || value == 'deal stage') {
      this.automation_type = 'deal';
    } else if (value == 'contact') {
      this.automation_type = 'contact';
    } else if (
      value == 'lead capture' ||
      value == 'scheduler' ||
      value == 'smarter'
    ) {
      this.automation_type = 'contact';
    }
  }

  loadDeals(id: string, count: number, page: number): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadingDeals = true;
    this.loadSubscription = this.automationService
      .get(id, count, page)
      .subscribe((res) => {
        this.loadingDeals = false;
        this.automation = res;
        this.deals = this.automation.deals ? this.automation.deals.deals : [];
        this.totalDeals = this.automation.deals
          ? this.automation.deals.count
          : 0;
        this.pageDeals = [];
        for (const item of this.deals) {
          const contacts = [];
          if (item.contacts && item.contacts.length > 0) {
            for (const contact of item.contacts) {
              contacts.push(new Contact().deserialize(contact));
            }
          }
          this.pageDeals.push({
            deal: item.deal,
            contacts
          });
        }
      });
  }

  arrangeAutomationData(): void {
    if (this.automation) {
      if (this.automation.role === 'admin') {
        this.auth = 'admin';
      } else if (this.automation.role === 'team') {
        if (this.automation.user === this.user_id) {
          this.auth = 'team';
        } else {
          this.auth = 'shared';
        }
      }
      this.created_at = this.automation.created_at;
    } else {
      this.auth = 'owner';
      const curDate = new Date();
      this.created_at = curDate.toISOString();
    }
  }

  composeGraph(actions): void {
    this.autoZoom = true;
    let maxId = 0;
    const ids = [];
    let missedIds = [];
    const currentIds = [];
    const nodes = [];
    const edges = [];
    const caseNodes = {}; // Case nodes pair : Parent -> Sub case actions
    const edgesBranches = []; // Edge Branches
    if (actions) {
      // check multiple branch version.
      let isMultipleVersion = false;
      const index = actions.findIndex((item) => item.parent === 'a_10000');
      if (index >= 0) {
        isMultipleVersion = true;
      }

      nodes.push({
        category: ACTION_CAT.START,
        id: 'a_10000',
        index: 10000,
        label: 'START',
        leaf: true,
        type: 'start'
      });

      //if this automation is not multiple branch version, change parents to start node.
      if (!isMultipleVersion) {
        for (const action of actions) {
          if (action.parent === '0') {
            action.parent = 'a_10000';
          }
        }
      }

      actions.forEach((e) => {
        const idStr = (e.id + '').replace('a_', '');
        const id = parseInt(idStr);
        if (maxId < id) {
          maxId = id;
        }
        currentIds.push(id);
      });
    }
    for (let i = 1; i <= maxId; i++) {
      ids.push(i);
    }
    missedIds = ids.filter(function (n) {
      return currentIds.indexOf(n) === -1;
    });

    if (actions) {
      actions.forEach((e) => {
        if (e.condition) {
          const node = {
            id: e.id,
            index: this.genIndex(e.id),
            period: e.period
          };
          if (e.action) {
            if (
              e.type === 'deal' &&
              e.action.type !== 'deal' &&
              this.automation_type !== 'deal'
            ) {
              node['parent_type'] = 'deal';
            }
            let type = e.action.type;
            const videos = e.action.videos ? e.action.videos : [];
            const pdfs = e.action.pdfs ? e.action.pdfs : [];
            const images = e.action.images ? e.action.images : [];
            const materials = [...videos, ...pdfs, ...images];

            if (e.action.type === 'text') {
              if (materials.length === 0) {
                type = 'text';
              } else {
                if (materials.length === 1) {
                  if (videos.length > 0) {
                    type = 'send_text_video';
                  }
                  if (pdfs.length > 0) {
                    type = 'send_text_pdf';
                  }
                  if (images.length > 0) {
                    type = 'send_text_image';
                  }
                } else if (materials.length > 1) {
                  type = 'send_text_material';
                }
              }
            } else if (e.action.type === 'email') {
              if (materials.length === 0) {
                type = 'email';
              } else {
                if (materials.length === 1) {
                  if (videos.length > 0) {
                    type = 'send_email_video';
                  }
                  if (pdfs.length > 0) {
                    type = 'send_email_pdf';
                  }
                  if (images.length > 0) {
                    type = 'send_email_image';
                  }
                } else if (materials.length > 1) {
                  type = 'send_email_material';
                }
              }
            }

            node['type'] = type;
            node['task_type'] = e.action.task_type;
            node['content'] = e.action.content;
            node['subject'] = e.action.subject;
            node['deal_name'] = e.action.deal_name;
            node['deal_stage'] = e.action.deal_stage;
            node['voicemail'] = e.action.voicemail;
            node['automation_id'] = e.action.automation_id;
            node['appointment'] = e.action.appointment;
            node['due_date'] = e.action.due_date;
            node['timezone'] = e.action.timezone;
            node['due_duration'] = e.action.due_duration;
            node['videos'] = e.action.videos;
            node['pdfs'] = e.action.pdfs;
            node['images'] = e.action.images;
            node['label'] = this.ACTIONS[type];
            node['category'] = ACTION_CAT.NORMAL;
            if (e.action.commands) {
              node['commands'] = e.action.commands;
            } else {
              node['command'] = e.action.command;
            }
            node['ref_id'] = e.action.ref_id;
            node['group'] = e.action.group;
            node['attachments'] = e.action.attachments;
          }
          nodes.push(node);

          if (e.condition.answer) {
            const actionCondition = {
              case: e.condition.case,
              answer: true,
              percent: e.condition.percent
            };
            if (e.condition.type) {
              actionCondition['type'] = e.condition.type;
            }
            const yesNodeIndex = missedIds.splice(-1)[0];
            const yesNodeId = 'a_' + yesNodeIndex;
            const yesNode = {
              id: yesNodeId,
              index: yesNodeIndex,
              label: 'YES',
              leaf: false,
              category: ACTION_CAT.CONDITION,
              condition: actionCondition
            };
            nodes.push(yesNode);
            const bSource = e.parent;
            const bTarget = yesNodeId;
            const target = e.id;
            edges.push({
              id: bSource + '_' + bTarget,
              source: bSource,
              target: bTarget,
              category: 'case',
              answer: 'yes',
              data: {
                category: 'case',
                answer: 'yes'
              }
            });
            edges.push({
              id: bTarget + '_' + target,
              source: bTarget,
              target: target,
              data: {}
            });
            edgesBranches.push(bSource);
            edgesBranches.push(bTarget);
            if (caseNodes[bSource]) {
              caseNodes[bSource].push(yesNode);
            } else {
              caseNodes[bSource] = [yesNode];
            }
          }
          if (!e.condition.answer) {
            const actionCondition = {
              case: e.condition.case,
              answer: false,
              percent: e.condition.percent
            };
            if (e.condition.type) {
              actionCondition['type'] = e.condition.type;
            }
            const noNodeIndex = missedIds.splice(-1)[0];
            const noNodeId = 'a_' + noNodeIndex;
            const noNode = {
              id: noNodeId,
              index: noNodeIndex,
              label: 'NO',
              leaf: false,
              category: ACTION_CAT.CONDITION,
              condition: actionCondition
            };
            nodes.push(noNode);
            const bSource = e.parent;
            const bTarget = noNodeId;
            const target = e.id;
            edges.push({
              id: bSource + '_' + bTarget,
              source: bSource,
              target: bTarget,
              category: 'case',
              answer: 'no',
              hasLabel: true,
              type: actionCondition.case,
              percent: e.condition.percent,
              data: {
                category: 'case',
                answer: 'no',
                hasLabel: true,
                type: actionCondition.case,
                percent: e.condition.percent
              }
            });
            edges.push({
              id: bTarget + '_' + target,
              source: bTarget,
              target: target,
              data: {}
            });
            edgesBranches.push(bSource);
            edgesBranches.push(bTarget);
            if (caseNodes[bSource]) {
              caseNodes[bSource].push(noNode);
            } else {
              caseNodes[bSource] = [noNode];
            }
          }
        } else {
          const node = {
            id: e.id,
            index: this.genIndex(e.id),
            period: e.period
          };

          if (
            e.type === 'deal' &&
            e.action.type !== 'deal' &&
            this.automation_type !== 'deal'
          ) {
            node['parent_type'] = 'deal';
          }

          let type = e.action.type;
          const videos = e.action.videos ? e.action.videos : [];
          const pdfs = e.action.pdfs ? e.action.pdfs : [];
          const images = e.action.images ? e.action.images : [];
          const materials = [...videos, ...pdfs, ...images];

          if (e.action.type === 'text') {
            if (materials.length === 0) {
              type = 'text';
            } else {
              if (materials.length === 1) {
                if (videos.length > 0) {
                  type = 'send_text_video';
                }
                if (pdfs.length > 0) {
                  type = 'send_text_pdf';
                }
                if (images.length > 0) {
                  type = 'send_text_image';
                }
              } else if (materials.length > 1) {
                type = 'send_text_material';
              }
            }
          } else if (e.action.type === 'email') {
            if (materials.length === 0) {
              type = 'email';
            } else {
              if (materials.length === 1) {
                if (videos.length > 0) {
                  type = 'send_email_video';
                }
                if (pdfs.length > 0) {
                  type = 'send_email_pdf';
                }
                if (images.length > 0) {
                  type = 'send_email_image';
                }
              } else if (materials.length > 1) {
                type = 'send_email_material';
              }
            }
          }

          if (e.action) {
            node['type'] = type;
            node['task_type'] = e.action.task_type;
            node['content'] = e.action.content;
            node['subject'] = e.action.subject;
            node['deal_name'] = e.action.deal_name;
            node['deal_stage'] = e.action.deal_stage;
            node['voicemail'] = e.action.voicemail;
            node['automation_id'] = e.action.automation_id;
            node['appointment'] = e.action.appointment;
            node['due_date'] = e.action.due_date;
            node['timezone'] = e.action.timezone;
            node['due_duration'] = e.action.due_duration;
            node['videos'] = e.action.videos;
            node['pdfs'] = e.action.pdfs;
            node['images'] = e.action.images;
            node['label'] = this.ACTIONS[type];
            node['category'] = ACTION_CAT.NORMAL;
            if (e.action.commands) {
              node['commands'] = e.action.commands;
            } else {
              node['command'] = e.action.command;
            }
            node['ref_id'] = e.action.ref_id;
            node['group'] = e.action.group;
            node['attachments'] = e.action.attachments;
          }
          nodes.push(node);
          if (e.parent !== '0') {
            const source = e.parent;
            const target = e.id;
            edges.push({ id: source + '_' + target, source, target, data: {} });
            edgesBranches.push(source);
          }
        }
      });
    }

    // Uncompleted Case Branch Make
    for (const branch in caseNodes) {
      if (caseNodes[branch].length === 1) {
        let newNodeIndex = missedIds.splice(-1)[0];
        if (!newNodeIndex) {
          newNodeIndex = maxId;
          maxId++;
        }
        const newNodeId = 'a_' + newNodeIndex;
        const conditionType = caseNodes[branch][0].condition.case;
        if (caseNodes[branch][0].condition.answer) {
          // Insert False case
          const noNode = {
            id: newNodeId,
            index: newNodeIndex,
            label: 'NO',
            leaf: true,
            condition: { case: conditionType, answer: false },
            category: ACTION_CAT.CONDITION
          };
          nodes.push(noNode);
          const bSource = branch;
          const bTarget = newNodeId;
          edges.push({
            id: bSource + '_' + bTarget,
            source: bSource,
            target: bTarget,
            category: 'case',
            answer: 'no',
            hasLabel: true,
            type: conditionType,
            data: {
              category: 'case',
              answer: 'no',
              hasLabel: true,
              type: conditionType
            }
          });
        } else {
          // Insert true case
          const yesNode = {
            id: newNodeId,
            index: newNodeIndex,
            label: 'YES',
            leaf: false,
            condition: { case: conditionType, answer: true },
            category: ACTION_CAT.CONDITION
          };
          nodes.push(yesNode);
          const bSource = branch;
          const bTarget = newNodeId;
          edges.push({
            id: bSource + '_' + bTarget,
            source: bSource,
            target: bTarget,
            category: 'case',
            answer: 'yes',
            data: {
              category: 'case',
              answer: 'yes'
            }
          });
        }
      }
    }
    // Leaf Setting
    nodes.forEach((e) => {
      if (edgesBranches.indexOf(e.id) !== -1 || e.type === 'automation') {
        e.leaf = false;
      } else {
        e.leaf = true;
      }
    });
    this.identity = maxId;
    this.nodes = [...nodes];
    this.edges = [...edges];
    this.loadingAutomation = false;

    // disable auto center for flipping issue when add action.
    setTimeout(() => {
      this.autoCenter = false;
      this.autoZoom = false;
      this.center$.next(false);
    }, 500);
  }

  genIndex(id): any {
    const idStr = (id + '').replace('a_', '');
    return parseInt(idStr);
  }

  insertAction(link = null): void {
    if (link) {
      this.closeEditAction();

      this.lastUpdatedLink = link;
      const source = link.source;
      const target = link.target;
      const lastIndex = this.identity;
      const newId = 'a_' + (lastIndex + 1);

      const parents = this.getParents(source);
      const prevFollowUps = [];
      this.nodes.forEach((e) => {
        if (e.type === 'follow_up' && parents.indexOf(e.id) !== -1) {
          prevFollowUps.push(e);
        }
      });
      const prevAppointments = [];
      this.nodes.forEach((e) => {
        if (e.type === 'appointment' && parents.indexOf(e.id) !== -1) {
          prevAppointments.push(e);
        }
      });

      //has new deal node in automation
      let isNewDeal = false;
      if (this.automation_type === 'deal') {
        isNewDeal = true;
      } else {
        const index = this.nodes.findIndex((item) => item.type === 'deal');
        if (index >= 0) {
          isNewDeal = true;
        }
      }

      //is insertable move deal
      let isMoveDeal = false;
      if (this.automation_type === 'deal') {
        isMoveDeal = true;
      } else {
        for (const nodeId of parents) {
          const dealIndex = this.nodes.findIndex(
            (item) => item.id === nodeId && item.type === 'deal'
          );
          if (dealIndex >= 0) {
            isMoveDeal = true;
          }
        }
      }

      // get node from link
      let node = null;
      const nodeIndex = this.nodes.findIndex((item) => item.id === source);
      if (nodeIndex >= 0) {
        node = this.nodes[nodeIndex];
      }

      // CONDITION ACTION HANDLER
      let conditionHandler = '';
      if (node.condition) {
        if (node.condition.answer) {
          conditionHandler = 'trueCase';
        } else {
          conditionHandler = 'falseCase';
        }
      }

      if (node) {
        const data = {
          currentAction: node.type,
          parentAction: node,
          conditionHandler,
          follows: prevFollowUps,
          appointments: prevAppointments,
          hasNewDeal: isNewDeal,
          moveDeal: isMoveDeal,
          automation: this.automation,
          automation_type: this.automation_type
        };

        // prevent show condition handler when has 2 branches
        const childNodes =
          this.edges.filter((item) => item.source == node.id) || [];
        if (childNodes.length >= 2) {
          delete data.conditionHandler;
          delete data.currentAction;
        }

        this.storeService.actionInputData.next(data);
        this.actionMethod = ACTION_METHOD.ADD_INSERT_ACTION;
        this.actionParam = link;
        this.addDrawer.open();
      }

      // const actionDlg = this.dialog
      //   .open(ActionDialogComponent, {
      //     ...DialogSettings.AUTOMATION_ACTION,
      //     data: {
      //       follows: prevFollowUps,
      //       appointments: prevAppointments,
      //       hasNewDeal: isNewDeal,
      //       moveDeal: isMoveDeal,
      //       automation: this.automation,
      //       automation_type: this.automation_type
      //     }
      //   })
      //   .afterClosed()
      //   .subscribe((res) => {
      //     if (res) {
      //       if (res.type === 'automation') {
      //         this.dialog
      //           .open(ConfirmComponent, {
      //             ...DialogSettings.CONFIRM,
      //             data: {
      //               title: 'Remove all child nodes',
      //               message: 'Are you sure to remove all related child nodes?',
      //               confirmLabel: 'Delete'
      //             }
      //           })
      //           .afterClosed()
      //           .subscribe((answer) => {
      //             if (answer) {
      //               let nodes = this.nodes;
      //               nodes.push({
      //                 ...res,
      //                 id: newId,
      //                 index: lastIndex + 1,
      //                 label: this.ACTIONS[res.type]
      //                 // leaf: true
      //               });
      //               let edges = this.edges;
      //               edges.some((e, index) => {
      //                 if (e.id === link.id) {
      //                   edges.splice(index, 1);
      //                   return true;
      //                 }
      //               });
      //               edges.push({
      //                 id: source + '_' + newId,
      //                 source,
      //                 target: newId
      //               });
      //               edges.push({
      //                 id: newId + '_' + target,
      //                 source: newId,
      //                 target
      //               });
      //               this.identity++;
      //               this.nodes = [...nodes];
      //               this.edges = [...edges];
      //               this.saved = false;
      //
      //               const dealNodes = [newId];
      //               nodes = this.nodes;
      //               edges = [...this.edges];
      //               while (true) {
      //                 const edgeIndex = edges.findIndex((item) => {
      //                   if (dealNodes.indexOf(item.source) >= 0) {
      //                     return true;
      //                   } else {
      //                     return false;
      //                   }
      //                 });
      //                 if (edgeIndex >= 0) {
      //                   dealNodes.push(edges[edgeIndex].target);
      //                   edges.splice(edgeIndex, 1);
      //                 } else {
      //                   break;
      //                 }
      //               }
      //               const index = dealNodes.indexOf(newId);
      //               if (index >= 0) {
      //                 dealNodes.splice(index, 1);
      //               }
      //               for (let i = nodes.length - 1; i >= 0; i--) {
      //                 const e = nodes[i];
      //                 if (dealNodes.indexOf(e.id) !== -1) {
      //                   nodes[i].parent_type = 'deal';
      //                 }
      //               }
      //
      //               // remove child nodes
      //               const removeNodes = [];
      //               for (const edge of this.edges) {
      //                 if (edge.source === newId) {
      //                   const nodeIndex = this.nodes.findIndex(
      //                     (item) => item.id === edge.target
      //                   );
      //                   if (nodeIndex >= 0) {
      //                     removeNodes.push(this.nodes[nodeIndex]);
      //                   }
      //                 }
      //               }
      //               if (removeNodes.length > 0) {
      //                 for (const node of removeNodes) {
      //                   this.removeChildNodes(node, newId);
      //                 }
      //               }
      //
      //               //set false to leaf of automation action.
      //               const automationIndex = this.nodes.findIndex(
      //                 (item) => item.id === newId
      //               );
      //               if (automationIndex >= 0) {
      //                 this.nodes[automationIndex].leaf = false;
      //               }
      //             }
      //           });
      //       } else {
      //         let nodes = this.nodes;
      //         nodes.push({
      //           ...res,
      //           id: newId,
      //           index: lastIndex + 1,
      //           label: this.ACTIONS[res.type]
      //           // leaf: true
      //         });
      //         let edges = this.edges;
      //         edges.some((e, index) => {
      //           if (e.id === link.id) {
      //             edges.splice(index, 1);
      //             return true;
      //           }
      //         });
      //         edges.push({ id: source + '_' + newId, source, target: newId });
      //         edges.push({ id: newId + '_' + target, source: newId, target });
      //         this.identity++;
      //         this.nodes = [...nodes];
      //         this.edges = [...edges];
      //         this.saved = false;
      //
      //         if (res.type === 'deal') {
      //           const dealNodes = [newId];
      //           nodes = this.nodes;
      //           edges = [...this.edges];
      //           while (true) {
      //             const index = edges.findIndex((item) => {
      //               if (dealNodes.indexOf(item.source) >= 0) {
      //                 return true;
      //               } else {
      //                 return false;
      //               }
      //             });
      //             if (index >= 0) {
      //               dealNodes.push(edges[index].target);
      //               edges.splice(index, 1);
      //             } else {
      //               break;
      //             }
      //           }
      //           const index = dealNodes.indexOf(newId);
      //           if (index >= 0) {
      //             dealNodes.splice(index, 1);
      //           }
      //           for (let i = nodes.length - 1; i >= 0; i--) {
      //             const e = nodes[i];
      //             if (dealNodes.indexOf(e.id) !== -1) {
      //               nodes[i].parent_type = 'deal';
      //             }
      //           }
      //         }
      //       }
      //     }
      //   });
    }
  }

  insertBranch(node): void {
    if (node) {
      this.closeEditAction();

      const edgeIndex = this.edges.findIndex((item) => item.source === node.id);
      if (edgeIndex >= 0) {
        //has deal
        const parents = this.getParents(node.id);
        const parentTypes = this.getParentTypes(parents);
        let hasDeal = false;
        if (this.automation_type === 'deal') {
          hasDeal = true;
        } else {
          if (parentTypes.length > 0) {
            const index = parentTypes.indexOf('deal');
            if (index >= 0) {
              hasDeal = true;
            }
          }
        }

        //is insertable move deal
        let isMoveDeal = false;
        if (this.automation_type === 'deal') {
          isMoveDeal = true;
        } else {
          for (const nodeId of parents) {
            const dealIndex = this.nodes.findIndex(
              (item) => item.id === nodeId && item.type === 'deal'
            );
            if (dealIndex >= 0) {
              isMoveDeal = true;
            }
          }
        }

        const link = this.edges[edgeIndex];
        if (link) {
          const source = link.source;
          const target = link.target;
          const lastIndex = this.identity;
          const newId = 'a_' + (lastIndex + 1);

          const prevFollowUps = [];
          this.nodes.forEach((e) => {
            if (e.type === 'follow_up' && parents.indexOf(e.id) !== -1) {
              prevFollowUps.push(e);
            }
          });
          const prevAppointments = [];
          this.nodes.forEach((e) => {
            if (e.type === 'appointment' && parents.indexOf(e.id) !== -1) {
              prevAppointments.push(e);
            }
          });

          const data = {
            follows: prevFollowUps,
            appointments: prevAppointments,
            hasNewDeal: hasDeal,
            moveDeal: isMoveDeal,
            automation: this.automation,
            automation_type: this.automation_type
          };
          this.storeService.actionInputData.next(data);
          this.actionMethod = ACTION_METHOD.ADD_INSERT_BRANCH;
          this.actionParam = node;
          this.addDrawer.open();

          // const actionDlg = this.dialog
          //   .open(ActionDialogComponent, {
          //     ...DialogSettings.AUTOMATION_ACTION,
          //     data: {
          //       follows: prevFollowUps,
          //       appointments: prevAppointments,
          //       currentAction: node.type,
          //       hasNewDeal: hasDeal,
          //       moveDeal: isMoveDeal,
          //       automation: this.automation,
          //       automation_type: this.automation_type
          //     }
          //   })
          //   .afterClosed()
          //   .subscribe((res) => {
          //     if (res) {
          //       const nodes = this.nodes;
          //       nodes.push({
          //         ...res,
          //         id: newId,
          //         index: lastIndex + 1,
          //         label: this.ACTIONS[res.type],
          //         leaf: res.type === 'automation' ? false : true
          //       });
          //       const edges = this.edges;
          //       edges.push({ id: source + '_' + newId, source, target: newId });
          //       this.identity++;
          //       this.nodes = [...nodes];
          //       this.edges = [...edges];
          //       this.saved = false;
          //     }
          //   });
        }
      }
    }
  }

  addAction(node = null): void {
    if (this.isSaving) {
      return;
    }

    this.closeEditAction();

    this.actionParam = node;
    this.lastUpdatedLink = null;

    if (node) {
      const parents = this.getParents(node.id);
      const parentTypes = this.getParentTypes(parents);

      let hasDeal = false;
      if (this.automation_type === 'deal') {
        hasDeal = true;
      } else {
        if (parentTypes.length > 0) {
          const index = parentTypes.indexOf('deal');
          if (index >= 0) {
            hasDeal = true;
          }
        }
      }

      //is insertable move deal
      let isMoveDeal = false;
      if (this.automation_type === 'deal') {
        isMoveDeal = true;
      } else {
        for (const nodeId of parents) {
          const dealIndex = this.nodes.findIndex(
            (item) => item.id === nodeId && item.type === 'deal'
          );
          if (dealIndex >= 0) {
            isMoveDeal = true;
          }
        }
      }

      const prevFollowUps = [];
      this.nodes.forEach((e) => {
        if (e.type === 'follow_up' && parents.indexOf(e.id) !== -1) {
          prevFollowUps.push(e);
        }
      });

      const prevAppointments = [];
      this.nodes.forEach((e) => {
        if (e.type === 'appointment' && parents.indexOf(e.id) !== -1) {
          prevAppointments.push(e);
        }
      });

      const currentId = node.id;
      const lastIndex = this.identity;
      const newId = 'a_' + (lastIndex + 1);
      // CONDITION ACTION HANDLER
      let conditionHandler = '';
      if (node.condition) {
        if (node.condition.answer) {
          conditionHandler = 'trueCase';
        } else {
          conditionHandler = 'falseCase';
        }
      }

      const data = {
        currentAction: node.type,
        parentAction: node,
        conditionHandler,
        follows: prevFollowUps,
        appointments: prevAppointments,
        hasNewDeal: hasDeal,
        moveDeal: isMoveDeal,
        automation: this.automation,
        automation_type: this.automation_type
      };

      this.storeService.actionInputData.next(data);
      this.actionMethod = ACTION_METHOD.ADD_ACTION;
      this.addDrawer.open();

      // const actionDlg = this.dialog
      //   .open(ActionDialogComponent, {
      //     ...DialogSettings.AUTOMATION_ACTION,
      //     data: {
      //       currentAction: node.type,
      //       parentAction: node,
      //       conditionHandler,
      //       follows: prevFollowUps,
      //       appointments: prevAppointments,
      //       hasNewDeal: hasDeal,
      //       moveDeal: isMoveDeal,
      //       automation: this.automation,
      //       automation_type: this.automation_type
      //     }
      //   })
      //   .afterClosed()
      //   .subscribe((res) => {
      //     if (res) {
      //       if (res.category === ACTION_CAT.NORMAL) {
      //         node.leaf = false;
      //         const nodes = this.nodes;
      //         const data = {
      //           ...res,
      //           id: newId,
      //           index: lastIndex + 1,
      //           label: this.ACTIONS[res.type],
      //           leaf: res.type === 'automation' ? false : true
      //         };
      //         if (hasDeal) {
      //           data['parent_type'] = 'deal';
      //         }
      //         nodes.push(data);
      //         const edges = this.edges;
      //         edges.push({
      //           id: currentId + '_' + newId,
      //           source: currentId,
      //           target: newId
      //         });
      //         this.identity += 1;
      //         this.nodes = [...nodes];
      //         this.edges = [...edges];
      //         this.lastUpdatedAction = this.nodes[this.nodes.length - 1];
      //       } else {
      //         node.leaf = false;
      //         const nodes = this.nodes;
      //         let data = {
      //           ...res,
      //           id: newId,
      //           index: lastIndex + 1,
      //           label: 'YES',
      //           leaf: true,
      //           condition: res.multipleReview
      //             ? { case: res.type, answer: true, condition_type: 1 }
      //             : { case: res.type, answer: true, primary: res.primary }
      //         };
      //         if (hasDeal) {
      //           data['parent_type'] = 'deal';
      //         }
      //         nodes.push(data);
      //         const edges = this.edges;
      //         edges.push({
      //           id: currentId + '_' + newId,
      //           source: currentId,
      //           target: newId,
      //           category: 'case',
      //           answer: 'yes'
      //         });
      //         newId = 'a_' + (lastIndex + 2);
      //         data = {
      //           ...res,
      //           id: newId,
      //           index: lastIndex + 2,
      //           label: 'NO',
      //           leaf: true,
      //           condition: res.multipleReview
      //             ? { case: res.type, answer: false, condition_type: 1 }
      //             : { case: res.type, answer: false, primary: res.primary }
      //         };
      //         if (hasDeal) {
      //           data['parent_type'] = 'deal';
      //         }
      //         nodes.push(data);
      //         edges.push({
      //           id: currentId + '_' + newId,
      //           source: currentId,
      //           target: newId,
      //           category: 'case',
      //           type: res.type,
      //           hasLabel: true,
      //           answer: 'no'
      //         });
      //         this.identity += 2;
      //         this.nodes = [...nodes];
      //         this.edges = [...edges];
      //         this.lastUpdatedAction = node;
      //       }
      //       this.saved = false;
      //       this.panToNode$.next(node.id);
      //     }
      //   });
    } else {
      const data = {
        automation: this.automation,
        automation_type: this.automation_type
      };
      this.storeService.actionInputData.next(data);
      this.addDrawer.open();

      // const actionDlg = this.dialog
      //   .open(ActionDialogComponent, {
      //     ...DialogSettings.AUTOMATION_ACTION,
      //     data: {
      //       automation: this.automation,
      //       automation_type: this.automation_type
      //     }
      //   })
      //   .afterClosed()
      //   .subscribe((res) => {
      //     if (res) {
      //       this.nodes.push({
      //         ...res,
      //         id: 'a_' + this.identity,
      //         index: this.identity,
      //         label: this.ACTIONS[res.type],
      //         leaf: res.type === 'automation' ? false : true
      //       });
      //       this.saved = false;
      //       this.lastUpdatedAction = this.nodes[this.nodes.length - 1];
      //     }
      //   });
    }
  }
  editAction(event, node): void {
    if (this.isSaving) {
      return;
    }

    this.closeAddAction();

    if (
      event.target.classList.contains('v-leaf') ||
      event.target.classList.contains('remove-action')
    ) {
      return;
    }

    const parents = this.getParents(node.id);
    const edge = _.find(this.edges, { target: node.id });
    let conditionHandler = '';
    if (edge) {
      const parentNode = _.find(this.nodes, { id: edge.source });
      if (parentNode && parentNode.condition) {
        if (parentNode.condition.answer) {
          conditionHandler = 'trueCase';
        } else {
          conditionHandler = 'falseCase';
        }
      }
    }

    //has new deal node in automation
    let isNewDeal = false;
    if (this.automation_type === 'deal') {
      isNewDeal = true;
    } else {
      const index = this.nodes.findIndex((item) => item.type === 'deal');
      if (index >= 0) {
        isNewDeal = true;
      }
    }

    //is insertable move deal
    let isMoveDeal = false;
    if (this.automation_type === 'deal') {
      isMoveDeal = true;
    } else {
      for (const nodeId of parents) {
        const dealIndex = this.nodes.findIndex(
          (item) => item.id === nodeId && item.type === 'deal'
        );
        if (dealIndex >= 0) {
          isMoveDeal = true;
        }
      }
    }

    const prevFollowUps = [];
    this.nodes.forEach((e) => {
      if (e.type === 'follow_up' && parents.indexOf(e.id) !== -1) {
        prevFollowUps.push(e);
      }
    });
    this.prevNode = { ...node };

    const data = {
      action: node,
      conditionHandler,
      follows: prevFollowUps,
      nodes: this.nodes,
      edges: this.edges,
      hasNewDeal: isNewDeal,
      moveDeal: isMoveDeal,
      automation: this.automation,
      automation_type: this.automation_type
    };

    this.storeService.actionInputData.next(data);
    this.actionMethod = ACTION_METHOD.EDIT_ACTION;
    this.actionParam = node;
    this.editDrawer.open();

    // this.dialog
    //   .open(ActionEditComponent, {
    //     ...DialogSettings.AUTOMATION_ACTION,
    //     data: {
    //       action: node,
    //       conditionHandler,
    //       follows: prevFollowUps,
    //       nodes: this.nodes,
    //       edges: this.edges,
    //       hasNewDeal: isNewDeal,
    //       automation: this.automation,
    //       automation_type: this.automation_type
    //     }
    //   })
    //   .afterClosed()
    //   .subscribe((res) => {
    //     if (res) {
    //       for (const key in res) {
    //         node[key] = res[key];
    //       }
    //       this.lastUpdatedAction = node;
    //       this.saved = false;
    //       if (
    //         this.prevNode.type === 'send_text_video' ||
    //         this.prevNode.type === 'send_text_image' ||
    //         this.prevNode.type === 'send_text_pdf' ||
    //         this.prevNode.type === 'send_text_material'
    //       ) {
    //         if (node.type === 'text') {
    //           this.removeBranchByEdit(node);
    //         } else {
    //           const branchNodes = this.getConditionsById(node.id);
    //           if (node.type === 'send_text_video') {
    //             for (const branchNode of branchNodes) {
    //               if (branchNode && branchNode.condition) {
    //                 branchNode.condition['case'] = 'watched_video';
    //               }
    //             }
    //           } else if (node.type === 'send_text_image') {
    //             for (const branchNode of branchNodes) {
    //               if (branchNode && branchNode.condition) {
    //                 branchNode.condition['case'] = 'watched_image';
    //               }
    //             }
    //           } else if (node.type === 'send_text_pdf') {
    //             for (const branchNode of branchNodes) {
    //               if (branchNode && branchNode.condition) {
    //                 branchNode.condition['case'] = 'watched_pdf';
    //               }
    //             }
    //           }
    //         }
    //         if (node.type === 'send_text_material') {
    //           const branchNodes = this.getConditionsById(node.id);
    //           const materials = this.getMaterials(node);
    //           if (branchNodes.length > 0) {
    //             const confirmDialog = this.dialog.open(
    //               CaseMaterialConfirmComponent,
    //               {
    //                 width: '90vw',
    //                 maxWidth: '500px',
    //                 disableClose: true,
    //                 data: { materials }
    //               }
    //             );
    //             confirmDialog.afterClosed().subscribe((result) => {
    //               if (result) {
    //                 for (const branchNode of branchNodes) {
    //                   if (branchNode && branchNode.condition) {
    //                     branchNode.condition['case'] = 'watched_material';
    //                   }
    //                 }
    //                 if (result.review === 0) {
    //                 } else if (result.review === 1) {
    //                   for (const branchNode of branchNodes) {
    //                     if (
    //                       branchNode &&
    //                       branchNode.condition &&
    //                       branchNode.condition.answer
    //                     ) {
    //                       branchNode.condition['condition_type'] = 1;
    //                     }
    //                   }
    //                 } else if (result.review === 2) {
    //                   for (const branchNode of branchNodes) {
    //                     if (
    //                       branchNode &&
    //                       branchNode.condition &&
    //                       branchNode.condition.answer
    //                     ) {
    //                       branchNode.condition['primary'] = result.primary;
    //                     }
    //                   }
    //                 }
    //               }
    //             });
    //           }
    //         }
    //       }
    //       if (
    //         this.prevNode.type === 'send_email_video' ||
    //         this.prevNode.type === 'send_email_image' ||
    //         this.prevNode.type === 'send_email_pdf' ||
    //         this.prevNode.type === 'send_email_material'
    //       ) {
    //         if (node.type === 'email') {
    //           this.removeBranchByEdit(node);
    //         } else {
    //           const branchNodes = this.getConditionsById(node.id);
    //           if (node.type === 'send_email_video') {
    //             for (const branchNode of branchNodes) {
    //               if (branchNode && branchNode.condition) {
    //                 branchNode.condition['case'] = 'watched_video';
    //               }
    //             }
    //           } else if (node.type === 'send_email_image') {
    //             for (const branchNode of branchNodes) {
    //               if (branchNode && branchNode.condition) {
    //                 branchNode.condition['case'] = 'watched_image';
    //               }
    //             }
    //           } else if (node.type === 'send_email_pdf') {
    //             for (const branchNode of branchNodes) {
    //               if (branchNode && branchNode.condition) {
    //                 branchNode.condition['case'] = 'watched_pdf';
    //               }
    //             }
    //           }
    //         }
    //       }
    //       if (this.prevNode.type === 'email') {
    //         if (
    //           node.type === 'send_email_video' ||
    //           node.type === 'send_email_image' ||
    //           node.type === 'send_email_pdf' ||
    //           node.type === 'send_email_material'
    //         ) {
    //           this.removeBranchByEdit(node);
    //         }
    //       }
    //       if (node.type === 'send_email_material') {
    //         const branchNodes = this.getConditionsById(node.id);
    //         const materials = this.getMaterials(node);
    //         if (branchNodes.length > 0) {
    //           const confirmDialog = this.dialog.open(
    //             CaseMaterialConfirmComponent,
    //             {
    //               width: '90vw',
    //               maxWidth: '500px',
    //               disableClose: true,
    //               data: { materials }
    //             }
    //           );
    //           confirmDialog.afterClosed().subscribe((result) => {
    //             if (result) {
    //               for (const branchNode of branchNodes) {
    //                 if (branchNode && branchNode.condition) {
    //                   branchNode.condition['case'] = 'watched_material';
    //                 }
    //               }
    //               if (result.review === 0) {
    //               } else if (result.review === 1) {
    //                 for (const branchNode of branchNodes) {
    //                   if (
    //                     branchNode &&
    //                     branchNode.condition &&
    //                     branchNode.condition.answer
    //                   ) {
    //                     branchNode.condition['condition_type'] = 1;
    //                   }
    //                 }
    //               } else if (result.review === 2) {
    //                 for (const branchNode of branchNodes) {
    //                   if (
    //                     branchNode &&
    //                     branchNode.condition &&
    //                     branchNode.condition.answer
    //                   ) {
    //                     branchNode.condition['primary'] = result.primary;
    //                   }
    //                 }
    //               }
    //             }
    //           });
    //         }
    //       }
    //     }
    //   });
  }
  removeAction(node): void {
    // Decide the node type => root | leaf | middle | middle with case | case
    if (node.leaf || node.type === 'automation') {
      this.removeLeaf(node);
    } else {
      let newSource;
      let newTarget;
      let newTargetNode;
      const edges = this.edges;
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (e.target === node.id) {
          newSource = e.source;
        }
        if (e.source === node.id) {
          newTarget = e.target;
        }
        if (newSource && newTarget) {
          break;
        }
      }
      this.nodes.some((e) => {
        if (e.id === newTarget) {
          newTargetNode = e;
          return true;
        }
      });
      if (newTargetNode && newTargetNode.condition) {
        this.removeWithCaseNode(node, newSource);
      } else {
        if (newSource && newTarget) {
          this.removeMiddleNode(node, newSource, newTarget);
        } else {
          this.removeRoot(node);
        }
      }
      this.lastUpdatedAction = null;
    }
  }
  removeLeaf(node): void {
    this.dialog
      .open(ConfirmComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          title: 'Delete Action',
          message: 'Are you sure you want to delete this action?',
          confirmLabel: 'Yes, Delete'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const nodes = this.nodes;
          nodes.some((e, index) => {
            if (e.id === node.id) {
              nodes.splice(index, 1);
              return true;
            }
          });
          const edges = this.edges;
          let newLeafId;
          edges.some((e, index) => {
            if (e.target === node.id) {
              newLeafId = e.source;
              edges.splice(index, 1);
              return true;
            }
          });
          nodes.some((e) => {
            if (e.id === newLeafId) {
              // when new leaf has not child
              const index = this.edges.findIndex(
                (item) => item.source === newLeafId
              );
              if (index < 0) {
                e.leaf = true;
              }
              return true;
            }
          });
          this.nodes = [...nodes];
          this.edges = [...edges];
          this.saved = false;
        }
      });
  }
  removeRoot(node): void {
    const options = [
      {
        title: 'Remove only node',
        description: 'This option removes only current node.',
        id: 'only'
      },
      {
        title: 'Remove all nodes',
        description: 'This option removes all nodes.',
        id: 'child'
      }
    ];
    this.dialog
      .open(CaseConfirmComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          message:
            'Are you sure to remove this item? If yes, please select the remove method.',
          cancelLabel: 'No',
          confirmLabel: 'Remove',
          cases: options
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.id === 'only') {
            const nodes = this.nodes;
            nodes.some((e, index) => {
              if (e.id === node.id) {
                nodes.splice(index, 1);
                return true;
              }
            });
            const edges = this.edges;
            edges.some((e, index) => {
              if (e.source === node.id) {
                edges.splice(index, 1);
                return true;
              }
            });
            this.nodes = [...nodes];
            this.edges = [...edges];
          } else {
            this.nodes = [];
            this.edges = [];
          }
          this.saved = false;
        }
      });
  }
  removeMiddleNode(node, nSource, nTarget): void {
    const options = [
      {
        title: 'Remove child nodes',
        description: 'This option removes related child nodes as well.',
        id: 'child'
      }
    ];
    if (node.type !== 'deal') {
      options.unshift({
        title: 'Remove only node',
        description: 'This option removes only current node.',
        id: 'only'
      });
    }
    this.dialog
      .open(CaseConfirmComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          message:
            'Are you sure to remove this item? If yes, please select the remove method.',
          cancelLabel: 'No',
          confirmLabel: 'Remove',
          cases: options
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.id === 'only') {
            const nodes = this.nodes;
            nodes.some((e, index) => {
              if (e.id === node.id) {
                nodes.splice(index, 1);
                return true;
              }
            });
            const edges = this.edges;
            let newSource;
            let newTarget;
            for (let i = edges.length - 1; i >= 0; i--) {
              const e = edges[i];
              if (e.target === node.id) {
                newSource = e.source;
                edges.splice(i, 1);
              }
              if (e.source === node.id) {
                newTarget = e.target;
                edges.splice(i, 1);
              }
              if (newSource && newTarget) {
                break;
              }
            }
            edges.push({
              id: nSource + '_' + nTarget,
              source: nSource,
              target: nTarget
            });
            this.nodes = [...nodes];
            this.edges = [...edges];
            this.saved = false;
          } else {
            this.removeChildNodes(node, nSource);
          }
        }
      });
  }
  removeWithCaseNode(node, nSource): void {
    const options = [
      {
        title: 'Remove Yes case nodes',
        description:
          'This option removes Yes case nodes and connect parent node with No case nodes.',
        id: 'falseNodes'
      },
      {
        title: 'Remove No case nodes',
        description:
          'This option removes No case nodes and connect parent node with Yes case nodes.',
        id: 'trueNodes'
      },
      {
        title: 'Remove all child nodes',
        description: 'This option removes all related child nodes.',
        id: 'child'
      }
    ];
    this.dialog
      .open(CaseConfirmComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          message:
            'Are you sure to remove this item? If yes, please select the remove method.',
          cancelLabel: 'No',
          confirmLabel: 'Remove',
          cases: options
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.id === 'child') {
            this.removeChildNodes(node, nSource);
          } else {
            let yesCase; // "Yes" node id
            let noCase; // "No" node id
            let yesNextNode; // Node behind "Yes"
            let noNextNode; // Node behind "No"
            const edges = this.edges;
            const nodes = this.nodes;
            for (let i = edges.length - 1; i >= 0; i--) {
              const e = edges[i];
              if (e.source === node.id && e.answer === 'yes') {
                yesCase = e.target;
              }
              if (e.source === node.id && e.answer === 'no') {
                noCase = e.target;
              }
              if (yesCase && noCase) {
                break;
              }
            }
            for (let i = edges.length - 1; i >= 0; i--) {
              const e = edges[i];
              if (e.source === yesCase) {
                yesNextNode = e.target;
              }
              if (e.source === noCase) {
                noNextNode = e.target;
              }
              if (yesNextNode && noNextNode) {
                break;
              }
            }

            if (res.id === 'trueNodes') {
              const deleteNodes = [noCase];
              edges.forEach((e) => {
                if (deleteNodes.indexOf(e.source) !== -1) {
                  deleteNodes.push(e.target);
                }
              });
              deleteNodes.push(node.id);
              deleteNodes.push(yesCase);
              for (let i = edges.length - 1; i >= 0; i--) {
                const e = edges[i];
                if (deleteNodes.indexOf(e.source) !== -1) {
                  edges.splice(i, 1);
                } else if (e.target === node.id) {
                  edges.splice(i, 1);
                }
              }

              for (let i = nodes.length - 1; i >= 0; i--) {
                const e = nodes[i];
                if (deleteNodes.indexOf(e.id) !== -1) {
                  nodes.splice(i, 1);
                }
              }
              if (yesNextNode) {
                edges.push({
                  id: nSource + '_' + yesNextNode,
                  source: nSource,
                  target: yesNextNode
                });
              } else {
                nodes.some((e) => {
                  if (e.id === nSource) {
                    if (this.automation_type === 'contact') {
                      e.leaf = true;
                    }
                    return true;
                  }
                });
              }
              this.nodes = [...nodes];
              this.edges = [...edges];
              this.saved = false;
            } else if (res.id === 'falseNodes') {
              const deleteNodes = [yesCase];
              edges.forEach((e) => {
                if (deleteNodes.indexOf(e.source) !== -1) {
                  deleteNodes.push(e.target);
                }
              });
              deleteNodes.push(node.id);
              deleteNodes.push(noCase);
              for (let i = edges.length - 1; i >= 0; i--) {
                const e = edges[i];
                if (deleteNodes.indexOf(e.source) !== -1) {
                  edges.splice(i, 1);
                } else if (e.target === node.id) {
                  edges.splice(i, 1);
                }
              }

              for (let i = nodes.length - 1; i >= 0; i--) {
                const e = nodes[i];
                if (deleteNodes.indexOf(e.id) !== -1) {
                  nodes.splice(i, 1);
                }
              }
              if (noNextNode) {
                edges.push({
                  id: nSource + '_' + noNextNode,
                  source: nSource,
                  target: noNextNode
                });
              } else {
                nodes.some((e) => {
                  if (e.id === nSource) {
                    if (this.automation_type === 'contact') {
                      e.leaf = true;
                    }
                    return true;
                  }
                });
              }
              this.nodes = [...nodes];
              this.edges = [...edges];
              this.saved = false;
            }
          }
        }
      });
  }

  removeBranchByEdit(node): void {
    let branch = null;
    for (const edge of this.edges) {
      if (edge.source === node.id) {
        branch = edge;
        break;
      }
    }
    if (branch && branch.category === 'case') {
      const newSource = branch.source;
      let yesCase; // "Yes" node id
      let noCase; // "No" node id
      const edges = this.edges;
      const nodes = this.nodes;
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (e.source === newSource && e.answer === 'yes') {
          yesCase = e.target;
        }
        if (e.source === newSource && e.answer === 'no') {
          noCase = e.target;
        }
        if (yesCase && noCase) {
          break;
        }
      }
      const deleteNodes = [yesCase, noCase];
      edges.forEach((e) => {
        if (deleteNodes.indexOf(e.source) !== -1) {
          deleteNodes.push(e.target);
        }
      });
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (deleteNodes.indexOf(e.source) !== -1) {
          edges.splice(i, 1);
        } else if (e.source === newSource) {
          edges.splice(i, 1);
        }
      }
      for (let i = nodes.length - 1; i >= 0; i--) {
        const e = nodes[i];
        if (deleteNodes.indexOf(e.id) !== -1) {
          nodes.splice(i, 1);
        }
      }
      node.leaf = true;
      this.nodes = [...nodes];
      this.edges = [...edges];
    }
  }

  keepBranchConfirmByEdit(node): void {
    let branch = null;
    for (const edge of this.edges) {
      if (edge.source === node.id) {
        branch = edge;
        break;
      }
    }
    if (branch && branch.category === 'case') {
      const newSource = branch.source;
      let yesCase; // "Yes" node id
      let noCase; // "No" node id
      let yesNextNode; // Node behind "Yes"
      let noNextNode; // Node behind "No"
      const edges = this.edges;
      const nodes = this.nodes;
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (e.source === newSource && e.answer === 'yes') {
          yesCase = e.target;
        }
        if (e.source === newSource && e.answer === 'no') {
          noCase = e.target;
        }
        if (yesCase && noCase) {
          break;
        }
      }
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (e.source === yesCase) {
          yesNextNode = e.target;
        }
        if (e.source === noCase) {
          noNextNode = e.target;
        }
        if (yesNextNode && noNextNode) {
          break;
        }
      }
      const options = [
        {
          title: 'Keep Yes case nodes',
          description: 'This option keeps Yes case nodes.',
          id: 'trueNodes'
        },
        {
          title: 'Keep No case nodes',
          description: 'This option keeps No case nodes.',
          id: 'falseNodes'
        }
      ];
      this.dialog
        .open(CaseConfirmComponent, {
          maxWidth: '360px',
          width: '96vw',
          data: {
            message:
              'Are you sure to keep this item? If yes, please select the keep method.',
            confirmLabel: 'Keep',
            cases: options
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if ((res && res.id === 'trueNodes') || !res) {
            const deleteNodes = [noCase];
            edges.forEach((e) => {
              if (deleteNodes.indexOf(e.source) !== -1) {
                deleteNodes.push(e.target);
              }
            });
            deleteNodes.push(yesCase);
            for (let i = edges.length - 1; i >= 0; i--) {
              const e = edges[i];
              if (deleteNodes.indexOf(e.source) !== -1) {
                edges.splice(i, 1);
              } else if (deleteNodes.indexOf(e.target) !== -1) {
                edges.splice(i, 1);
              }
            }
            // const noCaseEdgeIndex = edges.findIndex(
            //   (item) => item.target === noCase
            // );
            // const yesCaseEdgeIndex = edges.findIndex(
            //   (item) => item.target === yesCase
            // );
            // const noCaseNodeIndex = nodes.findIndex(
            //   (item) => item.id === noCase
            // );
            // const yesCaseNodeIndex = nodes.findIndex(
            //   (item) => item.id === yesCase
            // );
            // if (noCaseEdgeIndex >= 0) {
            //   edges[noCaseEdgeIndex].type = 'opened_email';
            //   edges[noCaseEdgeIndex].percent = undefined;
            //   if (edges[noCaseEdgeIndex].data) {
            //     edges[noCaseEdgeIndex].data.type = 'opened_email';
            //     edges[noCaseEdgeIndex].data.percent = undefined;
            //   }
            // }
            // if (yesCaseEdgeIndex >= 0) {
            //   edges[yesCaseEdgeIndex].type = 'opened_email';
            //   edges[yesCaseEdgeIndex].percent = undefined;
            //   if (edges[yesCaseEdgeIndex].data) {
            //     edges[yesCaseEdgeIndex].data.type = 'opened_email';
            //     edges[yesCaseEdgeIndex].data.percent = undefined;
            //   }
            // }
            // if (noCaseNodeIndex >= 0) {
            //   nodes[noCaseNodeIndex].leaf = true;
            //   nodes[noCaseNodeIndex].condition.case = 'opened_email';
            //   nodes[noCaseNodeIndex].condition.percent = undefined;
            // }
            // if (yesCaseNodeIndex >= 0) {
            //   nodes[yesCaseNodeIndex].condition.case = 'opened_email';
            //   nodes[yesCaseNodeIndex].condition.percent = undefined;
            // }
            for (let i = nodes.length - 1; i >= 0; i--) {
              const e = nodes[i];
              if (deleteNodes.indexOf(e.id) !== -1) {
                nodes.splice(i, 1);
              }
            }
            if (yesNextNode) {
              edges.push({
                id: node.id + '_' + yesNextNode,
                source: node.id,
                target: yesNextNode
              });
            } else {
              // nodes.some((e) => {
              //   if (e.id === node.id) {
              //     if (this.automation_type === 'contact') {
              //       e.leaf = true;
              //     }
              //     return true;
              //   }
              // });
            }
            this.nodes = [...nodes];
            this.edges = [...edges];
          } else if (res.id === 'falseNodes') {
            const deleteNodes = [yesCase];
            edges.forEach((e) => {
              if (deleteNodes.indexOf(e.source) !== -1) {
                deleteNodes.push(e.target);
              }
            });
            deleteNodes.push(noCase);
            // deleteNodes.splice(0, 1);
            for (let i = edges.length - 1; i >= 0; i--) {
              const e = edges[i];
              if (deleteNodes.indexOf(e.source) !== -1) {
                edges.splice(i, 1);
              } else if (deleteNodes.indexOf(e.target) !== -1) {
                edges.splice(i, 1);
              }
            }
            // const noCaseEdgeIndex = edges.findIndex(
            //   (item) => item.target === noCase
            // );
            // const yesCaseEdgeIndex = edges.findIndex(
            //   (item) => item.target === yesCase
            // );
            // const noCaseNodeIndex = nodes.findIndex(
            //   (item) => item.id === noCase
            // );
            // const yesCaseNodeIndex = nodes.findIndex(
            //   (item) => item.id === yesCase
            // );
            // if (noCaseEdgeIndex >= 0) {
            //   edges[noCaseEdgeIndex].type = 'opened_email';
            //   edges[noCaseEdgeIndex].percent = undefined;
            //   if (edges[noCaseEdgeIndex].data) {
            //     edges[noCaseEdgeIndex].data.type = 'opened_email';
            //     edges[noCaseEdgeIndex].data.percent = undefined;
            //   }
            // }
            // if (yesCaseEdgeIndex >= 0) {
            //   edges[yesCaseEdgeIndex].type = 'opened_email';
            //   edges[yesCaseEdgeIndex].percent = undefined;
            //   if (edges[yesCaseEdgeIndex].data) {
            //     edges[yesCaseEdgeIndex].data.type = 'opened_email';
            //     edges[yesCaseEdgeIndex].data.percent = undefined;
            //   }
            // }
            // if (noCaseNodeIndex >= 0) {
            //   nodes[noCaseNodeIndex].condition.case = 'opened_email';
            //   nodes[noCaseNodeIndex].condition.percent = undefined;
            // }
            // if (yesCaseNodeIndex >= 0) {
            //   nodes[yesCaseNodeIndex].leaf = true;
            //   nodes[yesCaseNodeIndex].condition.case = 'opened_email';
            //   nodes[yesCaseNodeIndex].condition.percent = undefined;
            // }
            for (let i = nodes.length - 1; i >= 0; i--) {
              const e = nodes[i];
              if (deleteNodes.indexOf(e.id) !== -1) {
                nodes.splice(i, 1);
              }
            }
            if (noNextNode) {
              edges.push({
                id: node.id + '_' + noNextNode,
                source: node.id,
                target: noNextNode
              });
            } else {
              // nodes.some((e) => {
              //   if (e.id === node.id) {
              //     if (this.automation_type === 'contact') {
              //       e.leaf = true;
              //     }
              //     return true;
              //   }
              // });
            }
            this.nodes = [...nodes];
            this.edges = [...edges];
          }
        });
    }
  }

  setOpenedEmailCondition(node): void {
    let branch = null;
    for (const edge of this.edges) {
      if (edge.source === node.id) {
        branch = edge;
        break;
      }
    }
    if (branch && branch.category === 'case') {
      const newSource = branch.source;
      let yesCase; // "Yes" node id
      let noCase; // "No" node id
      const edges = this.edges;
      const nodes = this.nodes;
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (e.source === newSource && e.answer === 'yes') {
          yesCase = e.target;
        }
        if (e.source === newSource && e.answer === 'no') {
          noCase = e.target;
        }
        if (yesCase && noCase) {
          break;
        }
      }

      const noCaseEdgeIndex = edges.findIndex((item) => item.target === noCase);
      const yesCaseEdgeIndex = edges.findIndex(
        (item) => item.target === yesCase
      );
      const noCaseNodeIndex = nodes.findIndex((item) => item.id === noCase);
      const yesCaseNodeIndex = nodes.findIndex((item) => item.id === yesCase);
      if (noCaseEdgeIndex >= 0) {
        edges[noCaseEdgeIndex].type = 'opened_email';
        edges[noCaseEdgeIndex].percent = undefined;
        if (edges[noCaseEdgeIndex].data) {
          edges[noCaseEdgeIndex].data.type = 'opened_email';
          edges[noCaseEdgeIndex].data.percent = undefined;
        }
      }
      if (yesCaseEdgeIndex >= 0) {
        edges[yesCaseEdgeIndex].type = 'opened_email';
        edges[yesCaseEdgeIndex].percent = undefined;
        if (edges[yesCaseEdgeIndex].data) {
          edges[yesCaseEdgeIndex].data.type = 'opened_email';
          edges[yesCaseEdgeIndex].data.percent = undefined;
        }
      }
      if (noCaseNodeIndex >= 0) {
        nodes[noCaseNodeIndex].condition.case = 'opened_email';
        nodes[noCaseNodeIndex].condition.percent = undefined;
      }
      if (yesCaseNodeIndex >= 0) {
        nodes[yesCaseNodeIndex].condition.case = 'opened_email';
        nodes[yesCaseNodeIndex].condition.percent = undefined;
      }
      this.nodes = [...nodes];
      this.edges = [...edges];
    }
  }

  setWatchedMaterialCondition(node): void {
    let branch = null;
    for (const edge of this.edges) {
      if (edge.source === node.id) {
        branch = edge;
        break;
      }
    }
    if (branch && branch.category === 'case') {
      const newSource = branch.source;
      let yesCase; // "Yes" node id
      let noCase; // "No" node id
      const edges = this.edges;
      const nodes = this.nodes;
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (e.source === newSource && e.answer === 'yes') {
          yesCase = e.target;
        }
        if (e.source === newSource && e.answer === 'no') {
          noCase = e.target;
        }
        if (yesCase && noCase) {
          break;
        }
      }

      const noCaseEdgeIndex = edges.findIndex((item) => item.target === noCase);
      const yesCaseEdgeIndex = edges.findIndex(
        (item) => item.target === yesCase
      );
      const noCaseNodeIndex = nodes.findIndex((item) => item.id === noCase);
      const yesCaseNodeIndex = nodes.findIndex((item) => item.id === yesCase);
      if (noCaseEdgeIndex >= 0) {
        edges[noCaseEdgeIndex].type = 'watched_material';
        edges[noCaseEdgeIndex].percent = undefined;
        if (edges[noCaseEdgeIndex].data) {
          edges[noCaseEdgeIndex].data.type = 'watched_material';
          edges[noCaseEdgeIndex].data.percent = undefined;
        }
      }
      if (yesCaseEdgeIndex >= 0) {
        edges[yesCaseEdgeIndex].type = 'watched_material';
        edges[yesCaseEdgeIndex].percent = undefined;
        if (edges[yesCaseEdgeIndex].data) {
          edges[yesCaseEdgeIndex].data.type = 'watched_material';
          edges[yesCaseEdgeIndex].data.percent = undefined;
        }
      }
      if (noCaseNodeIndex >= 0) {
        nodes[noCaseNodeIndex].condition.case = 'watched_material';
        nodes[noCaseNodeIndex].condition.percent = undefined;
      }
      if (yesCaseNodeIndex >= 0) {
        nodes[yesCaseNodeIndex].condition.case = 'watched_material';
        nodes[yesCaseNodeIndex].condition.percent = undefined;
      }
      this.nodes = [...nodes];
      this.edges = [...edges];
    }
  }

  removeCase(link): void {
    const options = [
      {
        title: 'Remove Yes case nodes',
        description:
          'This option removes Yes case nodes and connect parent node with No case nodes.',
        id: 'falseNodes'
      },
      {
        title: 'Remove No case nodes',
        description:
          'This option removes No case nodes and connect parent node with Yes case nodes.',
        id: 'trueNodes'
      },
      {
        title: 'Remove all child nodes',
        description: 'This option removes all related child nodes.',
        id: 'child'
      }
    ];
    this.dialog
      .open(CaseConfirmComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          message:
            'Are you sure to remove this case? If yes, please select the remove method.',
          cancelLabel: 'No',
          confirmLabel: 'Remove',
          cases: options
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const newSource = link.source;
          let yesCase; // "Yes" node id
          let noCase; // "No" node id
          let yesNextNode; // Node behind "Yes"
          let noNextNode; // Node behind "No"
          const edges = this.edges;
          const nodes = this.nodes;
          for (let i = edges.length - 1; i >= 0; i--) {
            const e = edges[i];
            if (e.source === newSource && e.answer === 'yes') {
              yesCase = e.target;
            }
            if (e.source === newSource && e.answer === 'no') {
              noCase = e.target;
            }
            if (yesCase && noCase) {
              break;
            }
          }
          if (res.id === 'child') {
            const deleteNodes = [yesCase, noCase];
            edges.forEach((e) => {
              if (deleteNodes.indexOf(e.source) !== -1) {
                deleteNodes.push(e.target);
              }
            });
            for (let i = edges.length - 1; i >= 0; i--) {
              const e = edges[i];
              if (deleteNodes.indexOf(e.source) !== -1) {
                edges.splice(i, 1);
              } else if (e.source === newSource) {
                edges.splice(i, 1);
              }
            }
            for (let i = nodes.length - 1; i >= 0; i--) {
              const e = nodes[i];
              if (deleteNodes.indexOf(e.id) !== -1) {
                nodes.splice(i, 1);
              }
            }
            nodes.some((e) => {
              if (e.id === newSource) {
                // if (this.automation_type === 'contact') {
                e.leaf = true;
                // }
                return true;
              }
            });
            this.nodes = [...nodes];
            this.edges = [...edges];
            this.saved = false;
          } else {
            for (let i = edges.length - 1; i >= 0; i--) {
              const e = edges[i];
              if (e.source === yesCase) {
                yesNextNode = e.target;
              }
              if (e.source === noCase) {
                noNextNode = e.target;
              }
              if (yesNextNode && noNextNode) {
                break;
              }
            }

            if (res.id === 'trueNodes') {
              const deleteNodes = [noCase];
              edges.forEach((e) => {
                if (deleteNodes.indexOf(e.source) !== -1) {
                  deleteNodes.push(e.target);
                }
              });
              deleteNodes.push(yesCase);
              for (let i = edges.length - 1; i >= 0; i--) {
                const e = edges[i];
                if (deleteNodes.indexOf(e.source) !== -1) {
                  edges.splice(i, 1);
                } else if (e.source === newSource) {
                  edges.splice(i, 1);
                }
              }

              for (let i = nodes.length - 1; i >= 0; i--) {
                const e = nodes[i];
                if (deleteNodes.indexOf(e.id) !== -1) {
                  nodes.splice(i, 1);
                }
              }
              if (yesNextNode) {
                edges.push({
                  id: newSource + '_' + yesNextNode,
                  source: newSource,
                  target: yesNextNode
                });
              } else {
                nodes.some((e) => {
                  if (e.id === newSource) {
                    // if (this.automation_type === 'contact') {
                    e.leaf = true;
                    // }
                    return true;
                  }
                });
              }
              this.nodes = [...nodes];
              this.edges = [...edges];
              this.saved = false;
            } else if (res.id === 'falseNodes') {
              const deleteNodes = [yesCase];
              edges.forEach((e) => {
                if (deleteNodes.indexOf(e.source) !== -1) {
                  deleteNodes.push(e.target);
                }
              });
              deleteNodes.push(noCase);
              for (let i = edges.length - 1; i >= 0; i--) {
                const e = edges[i];
                if (deleteNodes.indexOf(e.source) !== -1) {
                  edges.splice(i, 1);
                } else if (e.source === newSource) {
                  edges.splice(i, 1);
                }
              }

              for (let i = nodes.length - 1; i >= 0; i--) {
                const e = nodes[i];
                if (deleteNodes.indexOf(e.id) !== -1) {
                  nodes.splice(i, 1);
                }
              }
              if (noNextNode) {
                edges.push({
                  id: newSource + '_' + noNextNode,
                  source: newSource,
                  target: noNextNode
                });
              } else {
                nodes.some((e) => {
                  if (e.id === newSource) {
                    // if (this.automation_type === 'contact') {
                    e.leaf = true;
                    // }
                    return true;
                  }
                });
              }
              this.nodes = [...nodes];
              this.edges = [...edges];
              this.saved = false;
            }
          }
        }
      });
  }

  removeChildNodes(node, nSource): void {
    const deleteNodes = [node.id];
    const nodes = this.nodes;
    const edges = this.edges;
    edges.forEach((e) => {
      if (deleteNodes.indexOf(e.source) !== -1) {
        deleteNodes.push(e.target);
      }
    });
    for (let i = nodes.length - 1; i >= 0; i--) {
      const e = nodes[i];
      if (deleteNodes.indexOf(e.id) !== -1) {
        nodes.splice(i, 1);
      }
      if (nSource === e.id) {
        if (this.automation_type === 'contact') {
          e.leaf = true;
        }
      }
    }
    for (let i = edges.length - 1; i >= 0; i--) {
      const e = edges[i];
      if (deleteNodes.indexOf(e.source) !== -1) {
        edges.splice(i, 1);
      } else if (e.target === node.id) {
        edges.splice(i, 1);
      }
    }
    this.nodes = [...nodes];
    this.edges = [...edges];
    this.saved = false;
  }

  getConditionsById(parentId): any {
    const conditionNodes = [];
    const resultNodes = [];
    for (const node of this.nodes) {
      if (node.category === ACTION_CAT.CONDITION) {
        conditionNodes.push(node);
      }
    }
    for (const conditionNode of conditionNodes) {
      const index = this.edges.findIndex(
        (item) => item.target === conditionNode.id && item.source === parentId
      );
      if (index >= 0) {
        resultNodes.push(conditionNode);
      }
    }
    return resultNodes;
  }

  getMaterials(node): any {
    let materials = [];
    if (node['videos']) {
      if (Array.isArray(node['videos'])) {
        materials = [...node['videos']];
      } else {
        materials = [node['videos']];
      }
    }
    if (node['pdfs']) {
      if (Array.isArray(node['pdfs'])) {
        materials = [...materials, ...node['pdfs']];
      } else {
        materials = [...materials, node['pdfs']];
      }
    }
    if (node['images']) {
      if (Array.isArray(node['images'])) {
        materials = [...materials, ...node['images']];
      } else {
        materials = [...materials, node['images']];
      }
    }
    return materials;
  }

  getTypeMaterials(node): any {
    const videoIds = [];
    const pdfIds = [];
    const imageIds = [];

    const videoReg = new RegExp(
      environment.website + '/video[?]video=\\w+',
      'g'
    );
    const pdfReg = new RegExp(environment.website + '/pdf[?]pdf=\\w+', 'g');
    const imageReg = new RegExp(
      environment.website + '/image[?]image=\\w+',
      'g'
    );

    let matches = node['content'].match(videoReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const videoId = e.replace(environment.website + '/video?video=', '');
        videoIds.push(videoId);
      });
    }
    matches = node['content'].match(pdfReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const pdfId = e.replace(environment.website + '/pdf?pdf=', '');
        pdfIds.push(pdfId);
      });
    }
    matches = node['content'].match(imageReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const imageId = e.replace(environment.website + '/image?image=', '');
        imageIds.push(imageId);
      });
    }

    return {
      videoIds,
      imageIds,
      pdfIds
    };
  }

  getParents(id): any {
    const edgesObj = {};
    this.edges.forEach((e) => {
      edgesObj[e.target] = e.source;
    });
    let target = id;
    const parents = [target];
    if (edgesObj[target]) {
      parents.push(edgesObj[target]);
      target = edgesObj[target];
    }
    return parents;
  }

  getParentTypes(parents): any {
    const types = [];
    if (parents && parents.length > 0) {
      for (const parentId of parents) {
        const index = this.nodes.findIndex((item) => item.id === parentId);
        if (index >= 0) {
          if (this.nodes[index].type) {
            types.push(this.nodes[index].type);
          }
        }
      }
    }
    return types;
  }

  startDrop(event): void {
    console.log('START DROP', event);
  }
  allowStartDrop(event, node): void {
    event.preventDefault();
  }
  enableStartArea(event, node): void {
    if (event.dataTransfer && event.dataTransfer.type) {
      node.droppable = true;
    }
  }
  disableStartArea(event, node): any {
    if (
      event.target.closest('.drop-target') &&
      !event.target.classList.contains('drop-target')
    ) {
      return;
    }
    node.droppable = false;
  }
  dragAction(event, type): void {
    event.dataTransfer.setData('action', type);
  }

  storeData(): void {
    if (this.automation_title === '') {
      this.toastr.error(
        `You've made edits to an automation provided to you, please add a title for this new automation`
      );
      return;
    }
    const parentsObj = {}; // Parent Ids of each node
    const caseActions = {}; // Case actions Object
    const nodesObj = {};
    const actions = [];
    const saveNodes = [...this.nodes];
    const saveEdges = [...this.edges];
    //remove start action.
    const index = saveNodes.findIndex(
      (item) => item.category === ACTION_CAT.START
    );
    if (index >= 0) {
      saveNodes.splice(index, 1);
    }

    saveEdges.forEach((e) => {
      parentsObj[e.target] = e.source;
    });
    saveNodes.forEach((e) => {
      if (e.category === ACTION_CAT.CONDITION) {
        caseActions[e.id] = e;
      }
      nodesObj[e.id] = e;
    });
    saveNodes.forEach((e) => {
      if (e.category !== ACTION_CAT.CONDITION) {
        const parentId = parentsObj[e.id] || '0';
        // Check if the parent action is case action
        if (caseActions[parentId]) {
          const caseAction = caseActions[parentId];
          const caseParentActionId = parentsObj[caseAction.id];
          const caseParentAction = nodesObj[caseParentActionId];
          if (caseParentAction) {
            let type = e.type;
            if (
              e.type === 'text' ||
              e.type === 'send_text_video' ||
              e.type === 'send_text_pdf' ||
              e.type === 'send_text_image' ||
              e.type === 'send_text_material'
            ) {
              if (e.type.indexOf('send_text') !== -1) {
                const { videoIds, imageIds, pdfIds } = this.getTypeMaterials(e);

                videoIds.forEach((video) => {
                  e['content'] = e['content'].replace(
                    environment.website + '/video?video=' + video,
                    '{{' + video + '}}'
                  );
                });
                pdfIds.forEach((pdf) => {
                  e['content'] = e['content'].replace(
                    environment.website + '/pdf?pdf=' + pdf,
                    '{{' + pdf + '}}'
                  );
                });
                imageIds.forEach((image) => {
                  e['content'] = e['content'].replace(
                    environment.website + '/image?image=' + image,
                    '{{' + image + '}}'
                  );
                });
              }

              type = 'text';
            }
            if (
              e.type === 'email' ||
              e.type === 'send_email_video' ||
              e.type === 'send_email_pdf' ||
              e.type === 'send_email_image' ||
              e.type === 'send_email_material'
            ) {
              type = 'email';
            }
            let action;
            if (e.commands) {
              action = {
                parent: caseParentActionId,
                id: e.id,
                period: e.period,
                condition: caseAction.condition,
                status: 'pending',
                action: {
                  type,
                  task_type: e.task_type,
                  content: e.content,
                  deal_name: e.deal_name,
                  deal_stage: e.deal_stage,
                  automation_id: e.automation_id,
                  appointment: e.appointment,
                  subject: e.subject,
                  due_date: e.due_date,
                  due_duration: e.due_duration,
                  videos: e.videos,
                  pdfs: e.pdfs,
                  images: e.images,
                  commands: e.commands,
                  ref_id: e.ref_id,
                  attachments: e.attachments,
                  timezone: e.timezone
                }
              };
            } else {
              action = {
                parent: caseParentActionId,
                id: e.id,
                period: e.period,
                condition: caseAction.condition,
                status: 'pending',
                action: {
                  type,
                  task_type: e.task_type,
                  content: e.content,
                  deal_name: e.deal_name,
                  deal_stage: e.deal_stage,
                  automation_id: e.automation_id,
                  appointment: e.appointment,
                  subject: e.subject,
                  due_date: e.due_date,
                  due_duration: e.due_duration,
                  videos: e.videos,
                  pdfs: e.pdfs,
                  images: e.images,
                  command: e.command,
                  ref_id: e.ref_id,
                  attachments: e.attachments,
                  timezone: e.timezone
                }
              };
            }
            if (e['parent_type'] && e['parent_type'] === 'deal') {
              action['type'] = 'deal';
            }
            action['watched_materials'] = [];
            if (caseAction.condition.primary) {
              action['watched_materials'] = [caseAction.condition.primary];
            } else {
              if (
                caseParentAction['videos'] &&
                caseParentAction['videos'].length > 0
              ) {
                const watched_video = caseParentAction['videos'];
                action['watched_materials'] = [
                  ...action['watched_materials'],
                  ...watched_video
                ];
              }
              if (
                caseParentAction['pdfs'] &&
                caseParentAction['pdfs'].length > 0
              ) {
                const watched_pdf = caseParentAction['pdfs'];
                action['watched_materials'] = [
                  ...action['watched_materials'],
                  ...watched_pdf
                ];
              }
              if (
                caseParentAction['images'] &&
                caseParentAction['images'].length > 0
              ) {
                const watched_image = caseParentAction['images'];
                action['watched_materials'] = [
                  ...action['watched_materials'],
                  ...watched_image
                ];
              }
            }
            // if (action.condition && action.condition.primary) {
            //   delete action.condition.primary;
            // }
            actions.push(action);
          }
        } else {
          const action = {
            parent: parentId,
            id: e.id,
            period: e.period,
            status: 'pending'
          };
          if (parentId === 'a_10000') {
            action['status'] = 'active';
          }

          let type = e.type;
          if (
            e.type === 'text' ||
            e.type === 'send_text_video' ||
            e.type === 'send_text_pdf' ||
            e.type === 'send_text_image' ||
            e.type === 'send_text_material'
          ) {
            if (e.type.indexOf('send_text') !== -1) {
              const { videoIds, imageIds, pdfIds } = this.getTypeMaterials(e);

              videoIds.forEach((video) => {
                e['content'] = e['content'].replace(
                  environment.website + '/video?video=' + video,
                  '{{' + video + '}}'
                );
              });
              pdfIds.forEach((pdf) => {
                e['content'] = e['content'].replace(
                  environment.website + '/pdf?pdf=' + pdf,
                  '{{' + pdf + '}}'
                );
              });
              imageIds.forEach((image) => {
                e['content'] = e['content'].replace(
                  environment.website + '/image?image=' + image,
                  '{{' + image + '}}'
                );
              });
            }

            type = 'text';
          }
          if (
            e.type === 'email' ||
            e.type === 'send_email_video' ||
            e.type === 'send_email_pdf' ||
            e.type === 'send_email_image' ||
            e.type === 'send_email_material'
          ) {
            type = 'email';
          }
          if (e.commands) {
            action['action'] = {
              type,
              task_type: e.task_type,
              content: e.content,
              subject: e.subject,
              deal_name: e.deal_name,
              deal_stage: e.deal_stage,
              voicemail: e.voicemail,
              automation_id: e.automation_id,
              appointment: e.appointment,
              due_date: e.due_date,
              due_duration: e.due_duration,
              videos: e.videos,
              pdfs: e.pdfs,
              images: e.images,
              commands: e.commands,
              ref_id: e.ref_id,
              attachments: e.attachments,
              timezone: e.timezone
            };
          } else {
            action['action'] = {
              type,
              task_type: e.task_type,
              content: e.content,
              subject: e.subject,
              deal_name: e.deal_name,
              deal_stage: e.deal_stage,
              voicemail: e.voicemail,
              automation_id: e.automation_id,
              appointment: e.appointment,
              due_date: e.due_date,
              due_duration: e.due_duration,
              videos: e.videos,
              pdfs: e.pdfs,
              images: e.images,
              command: e.command,
              ref_id: e.ref_id,
              attachments: e.attachments,
              timezone: e.timezone
            };
          }
          if (e.group) {
            action['action']['group'] = e.group;
          }
          if (e['parent_type'] && e['parent_type'] === 'deal') {
            action['type'] = 'deal';
          }
          actions.push(action);
        }
      }
    });

    // fix actions type for automation type.
    for (const action of actions) {
      if (action.action && action.action.type === 'move_deal') {
        action.type = 'deal';
      } else {
        if (this.automation_type === 'contact') {
          if (action.action.type == 'deal') {
            delete action.type;
          } else if (
            action.action.group == '' ||
            (action.action.group && action.action.group.length > 0)
          ) {
            action.type = 'deal';
          } else {
            delete action.type;
          }
        } else {
          action.type = 'deal';
        }
      }
    }
    if (this.editMode === 'edit') {
      if (this.auth === 'admin' || this.auth === 'shared') {
        if (this.automation.title === this.automation_title) {
          this.toastr.error(
            `Please input another title and save it as new automation`
          );
          return;
        } else {
          this.isSaving = true;
          this.automationService
            .create({
              title: this.automation_title,
              automations: actions,
              type: this.automation_type,
              label: this.label
            })
            .subscribe(
              (res) => {
                if (res) {
                  this.isSaving = false;
                  this.saved = true;
                  // this.toastr.success('Automation created successfully');
                  const path = '/autoflow/edit/' + res['_id'];
                  this.router.navigate([path]);
                  this.editMode = 'edit';
                  this.auth = 'owner';
                  this.automation = res;
                  this.automation_id = res['_id'];
                  this.pageContacts = [];
                  this.automationService.reload();
                }
              },
              (err) => {
                this.isSaving = false;
              }
            );
        }
      } else {
        this.isSaving = true;
        this.automationService
          .update(this.automation_id, {
            title: this.automation_title,
            automations: actions,
            label: this.label
          })
          .subscribe(
            (res) => {
              this.isSaving = false;
              this.saved = true;
              // this.toastr.success('Automation saved successfully');
              this.automationService.reload();
            },
            (err) => {
              this.isSaving = false;
            }
          );
      }
    } else {
      this.route.queryParams.subscribe((params) => {
        this.isSaving = true;
        const payload = {
          title: this.automation_title,
          type: this.automation_type,
          automations: actions,
          label: this.label
        };
        if (params['folder'] && params['folder'] !== 'root') {
          payload['folder'] = params['folder'];
        }
        this.automationService.create(payload).subscribe(
          (res) => {
            if (res) {
              this.isSaving = false;
              this.saved = true;
              // this.toastr.success('Automation created successfully');
              const path = '/autoflow/edit/' + res['_id'];
              this.router.navigate([path]);
              this.editMode = 'edit';
              this.auth = 'owner';
              this.automation = res;
              this.automation_id = res['_id'];
              this.pageContacts = [];
              this.automationService.reload();
            }
          },
          (err) => {
            this.isSaving = false;
          }
        );
      });
    }
  }

  setLayout(): void {
    setTimeout(() => {
      const rect = document.querySelector('.nodes').getClientRects()[0];
      const graphWidth = rect.width;
      this.offsetX = (this.wrapperWidth - graphWidth) / 2;
    }, 100);
  }

  clearAllNodes(): void {
    this.nodes = [];
    this.edges = [];
    this.identity = 1;
  }

  zoomIn(): void {
    if (this.zoomLevel < 1.5) {
      this.zoomLevel += 0.1;
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.4) {
      this.zoomLevel -= 0.1;
    }
  }

  easyView(event: any, node: any, origin: any, content: any): void {
    this.closeAddAction();
    this.closeEditAction();

    event.stopPropagation();
    event.preventDefault();
    if (node.type === 'automation') {
      node['no_timelines'] = true;
    }
    this.overlayService
      .open(origin, content, this.viewContainerRef, 'automation', {
        data: node
      })
      .subscribe((res) => {
        if (res === 'edit') {
          this.editAction(event, node);
        } else if (res === 'remove') {
          this.removeAction(node);
        }
      });
  }

  goToBack(): void {
    if (
      this.handlerService.previousUrl &&
      this.handlerService.previousUrl.includes('/autoflow')
    ) {
      this.router.navigate(['/automations']);
    } else {
      this.handlerService.goBack('/automations');
    }
  }

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    if (this.selectedTab !== this.tabs[1] && this.nodes.length < 1) {
      if (this.automation_id) {
        this.loadAutomation(this.automation_id, this.pageSize.id, 0);
      }
    }
    localStorage.setItem('automation', tab.id);
  }

  assignContacts(): void {
    this.dialog
      .open(AutomationAssignComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          automation: this.automation
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.data && res.data.length) {
          // this.contacts = [...this.contacts, ...res.data];
          this.loadAutomation(this.automation_id, this.pageSize.id, 0);
        }
      });
  }

  delete(): void {
    const dialog = this.dialog.open(ConfirmComponent, {
      data: {
        title: 'Delete Automation',
        message: 'Are you sure to delete the automation?',
        confirmLabel: 'Delete'
      }
    });

    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.deleting = true;
        // this.automationService.delete(this.automation_id).subscribe(
        //   (response) => {
        //     this.deleting = false;
        //     this.goToBack();
        //     this.automationService.reload();
        //   },
        //   (err) => {
        //     this.deleting = false;
        //   }
        // );

        this.automationService.delete(this.automation_id).subscribe(
          (response) => {
            this.deleting = false;
            if (
              response.status &&
              response.error_message &&
              response.error_message.length > 0
            ) {
              const confirmBulkDialog = this.dialog.open(
                ConfirmRemoveAutomationComponent,
                {
                  position: { top: '100px' },
                  data: {
                    title: 'Delete Automation',
                    additional: response.error_message,
                    automation_id: this.automation_id,
                    message:
                      "You can't remove automation '" +
                      this.automation_title +
                      "'."
                  }
                }
              );
              confirmBulkDialog.afterClosed().subscribe((res1) => {
                this.automationService.reload();
              });
            } else {
              this.goToBack();
              this.automationService.reload();
            }
          },
          (err) => {
            this.deleting = false;
          }
        );
      }
    });
  }

  unassign(contact): void {}

  /**
   * Toggle All Elements in Page
   */
  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection = _.differenceBy(
        this.selection,
        this.pageSelection,
        '_id'
      );
      this.pageSelection = [];
      return;
    }
    this.pageContacts.forEach((e) => {
      if (!this.isSelected(e)) {
        this.pageSelection.push(e.mainInfo);
        this.selection.push(e.mainInfo);
      }
    });
  }
  /**
   * Toggle Element
   * @param contact : Contact
   */
  toggle(contact: ContactActivity): void {
    const selectedContact = contact.mainInfo;
    const toggledSelection = _.xorBy(
      this.pageSelection,
      [selectedContact],
      '_id'
    );
    this.pageSelection = toggledSelection;

    const toggledAllSelection = _.xorBy(
      this.selection,
      [selectedContact],
      '_id'
    );
    this.selection = toggledAllSelection;
  }
  /**
   * Check contact is selected.
   * @param contact : ContactActivity
   */
  isSelected(contact: ContactActivity): boolean {
    return _.findIndex(this.pageSelection, contact.mainInfo, '_id') !== -1;
  }
  /**
   * Check all contacts in page are selected.
   */
  isAllSelected(): boolean {
    return this.pageSelection.length === this.pageContacts.length;
  }

  /**
   * Load the page contacts
   * @param page : Page Number to load
   */
  changePage(page: number): void {
    this.page = page;
    // Normal Load by Page
    let skip = (page - 1) * this.pageSize.id;
    skip = skip < 0 ? 0 : skip;
    if (this.searchStr === '') {
      this.loadAutomation(this.automation_id, this.pageSize.id, skip);
    }
  }
  /**
   * Change the Page Size
   * @param type : Page size information element ({id: size of page, label: label to show UI})
   */
  changePageSize(type: any): void {
    const currentSize = this.pageSize.id;
    this.pageSize = type;
    // Check with the Prev Page Size
    if (currentSize < this.pageSize.id) {
      // If page size get bigger
      const loaded = this.page * currentSize;
      let newPage = Math.floor(loaded / this.pageSize.id);
      newPage = newPage > 0 ? newPage : 1;
      this.changePage(newPage);
    } else {
      // if page size get smaller: TODO -> Set Selection and Page contacts
      const skipped = (this.page - 1) * currentSize;
      const newPage = Math.floor(skipped / this.pageSize.id) + 1;
      this.changePage(newPage);
    }
  }

  changeSearchStr(): void {
    this.searchSubscription && this.searchSubscription.unsubscribe();
    if (this.automation_type === 'contact') {
      this.searchSubscription = this.automationService
        .searchContact(this.automation._id, this.searchStr)
        .subscribe((res) => {
          if (res) {
            this.pageContacts = [];
            for (let i = 0; i < res.length; i++) {
              const newContact = new ContactActivity().deserialize(res[i]);
              this.pageContacts.push(newContact);
            }
            this.contacts = this.pageContacts.length;
          }
        });
    } else {
      this.searchSubscription = this.automationService
        .searchDeal(this.automation._id, this.searchStr)
        .subscribe((res) => {
          if (res && res.length > 0) {
            this.pageDeals = [];
            for (const item of res) {
              const contacts = [];
              if (item.contacts && item.contacts.length > 0) {
                for (const contact of item.contacts) {
                  contacts.push(new Contact().deserialize(contact));
                }
              }
              this.pageDeals.push({
                deal: item.deal,
                contacts
              });
            }
          }
        });
    }
    this.page = 1;
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.changePage(1);
  }

  openContact(contact: ContactActivity): void {
    this.router.navigate([`contacts/${contact._id}`]);
  }

  openDeal(deal): void {
    this.router.navigate([`deals/${deal._id}`]);
  }

  /**
   * Update the Label of the current contact or selected contacts.
   * @param label : Label to update
   * @param _id : id of contact to update
   */
  updateLabel(label: string, _id: string): void {
    const newLabel = label ? label : null;
    let ids = [];
    this.selection.forEach((e) => {
      ids.push(e._id);
    });
    if (ids.indexOf(_id) === -1) {
      ids = [_id];
    }
    this.isUpdating = true;
    this.contactService
      .bulkUpdate(ids, { label: newLabel }, {})
      .subscribe((status) => {
        this.isUpdating = false;
        if (status) {
          this.handlerService.bulkContactUpdate$(ids, { label: newLabel }, {});
        }
      });
  }

  /**
   * Select All Contacts
   */
  selectAll(source = false): void {
    if (source) {
      this.updateActionsStatus('select', true);
      this.selectSource = 'header';
    } else {
      this.selectSource = 'page';
    }
    this.selecting = true;
    this.selectSubscription && this.selectSubscription.unsubscribe();
    this.selectSubscription = this.contactService
      .selectAll()
      .subscribe((contacts) => {
        this.selecting = false;
        this.selection = _.unionBy(this.selection, contacts, '_id');
        this.pageSelection = _.intersectionBy(
          this.selection,
          this.pageContacts,
          '_id'
        );
        this.updateActionsStatus('select', false);
      });
  }

  /**
   * Update the Command Status
   * @param command :Command String
   * @param loading :Whether current action is running
   */
  updateActionsStatus(command: string, loading: boolean): void {
    this.CONTACT_ACTIONS.some((e) => {
      if (e.command === command) {
        e.loading = loading;
        return true;
      }
    });
  }

  duplicate(event: Event, automation: Automation): void {
    event.stopPropagation();
    this.router.navigate(['/automations']);
    setTimeout(() => {
      this.router.navigate(['/autoflow/new/' + automation._id]);
    }, 30);
  }

  shareAutomation($event, automation): void {
    this.dialog
      .open(TeamMaterialShareComponent, {
        width: '98vw',
        maxWidth: '450px',
        data: {
          automation,
          type: 'automation'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.status) {
          // this.automationService.reload();
        }
      });
  }

  deselectAll(): void {
    this.pageSelection = [];
    this.selection = [];
  }

  /**
   * Delete Selected Contacts
   */
  deleteConfirm(): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Delete contacts',
          message: 'Are you sure to delete contacts?',
          confirmLabel: 'Delete'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.delete();
          this.handlerService.reload$();
        }
      });
  }

  /**
   * Bulk Edit Open
   */
  bulkEdit(): void {
    this.panelType = 'editor';
    this.drawer.open();
  }

  /**
   * Download CSV
   */
  downloadCSV(): void {
    const ids = [];
    this.selection.forEach((e) => {
      ids.push(e._id);
    });
    this.updateActionsStatus('download', true);
    this.contactService.downloadCSV(ids).subscribe((data) => {
      const contacts = [];
      data.forEach((e) => {
        const contact = {
          first_name: e.contact.first_name,
          last_name: e.contact.last_name,
          email: e.contact.email,
          phone: e.contact.phone,
          source: e.contact.source,
          brokerage: e.contact.brokerage,
          city: e.contact.city,
          state: e.contact.state,
          zip: e.contact.zip,
          address: e.contact.address
        };
        const notes = [];
        if (e.note && e.note.length) {
          e.note.forEach((note) => {
            notes.push(note.content);
          });
        }
        let label = '';
        if (e.contact.label) {
          label = e.contact.label.name || '';
        }
        contact['note'] = notes.join('     ');
        contact['tags'] = e.contact.tags.join(', ');
        contact['label'] = label;
        contacts.push(contact);
      });
      if (contacts.length) {
        const replacer = (key, value) => (value === null ? '' : value); // specify how you want to handle null values here
        const header = Object.keys(contacts[0]);
        const csv = contacts.map((row) =>
          header
            .map((fieldName) => JSON.stringify(row[fieldName], replacer))
            .join(',')
        );
        csv.unshift(header.join(','));
        const csvArray = csv.join('\r\n');

        const blob = new Blob([csvArray], { type: 'text/csv' });
        saveAs(blob, 'myFile.csv');
      }
      this.updateActionsStatus('download', false);
    });
  }

  openMessageDlg(): void {
    this.dialog.open(SendEmailComponent, {
      position: {
        bottom: '0px',
        right: '0px'
      },
      width: '100vw',
      panelClass: 'send-email',
      backdropClass: 'cdk-send-email',
      disableClose: false,
      data: {
        contacts: this.selection
      }
    });
  }

  openNoteDlg(): void {
    this.dialog.open(NoteCreateComponent, {
      ...DialogSettings.NOTE,
      data: {
        contacts: this.selection
      }
    });
  }

  openTaskDlg(): void {
    this.dialog.open(NoteCreateComponent, {
      ...DialogSettings.TASK,
      data: {
        contacts: this.selection
      }
    });
  }

  openAutomationDlg(): void {
    if (this.selection.length <= 10) {
      this.dialog.open(ContactAssignAutomationComponent, {
        ...DialogSettings.AUTOMATION,
        data: {
          contacts: this.selection
        }
      });
    } else {
      this.dialog.open(NotifyComponent, {
        width: '98vw',
        maxWidth: '390px',
        data: {
          title: 'Add Automation',
          message: 'You can assign to at most 10 contacts.'
        }
      });
    }
  }

  doAction(event: any): void {
    switch (event.command) {
      case 'deselect':
        this.deselectAll();
        break;
      case 'select':
        this.selectAll(true);
        break;
      case 'delete':
        this.deleteConfirm();
        break;
      case 'edit':
        this.bulkEdit();
        break;
      case 'download':
        this.downloadCSV();
        break;
      case 'message':
        this.openMessageDlg();
        break;
      case 'add_note':
        this.openNoteDlg();
        break;
      case 'add_task':
        this.openTaskDlg();
        break;
      case 'automation':
        this.openAutomationDlg();
        break;
    }
  }

  /**
   * Handler when page number get out of the bound after remove contacts.
   * @param $event : Page Number
   */
  pageChanged($event: number): void {
    this.changePage($event);
  }

  getPrevPage(): string {
    if (!this.handlerService.previousUrl) {
      return 'to Automations';
    }
    for (const route in ROUTE_PAGE) {
      if (this.handlerService.previousUrl.includes(route)) {
        return 'to ' + ROUTE_PAGE[route];
      }
    }
    return '';
  }

  changeType($event, type: string): void {
    if (this.editMode == 'edit') {
      $event.preventDefault();
      return;
    }
    //check switchable to contact
    if (type === 'contact') {
      let hasMultipleBranch = false;
      if (this.label == 'modular') {
        this.label = 'modular';
      } else {
        this.label = 'contact';
      }
      for (const edge of this.edges) {
        if (!edge.category) {
          const index = this.edges.findIndex(
            (item) => item.source === edge.source && item.id !== edge.id
          );
          if (index >= 0) {
            hasMultipleBranch = true;
            break;
          }
        }
      }
      if (hasMultipleBranch) {
        $event.preventDefault();
        this.dialog.open(NotifyComponent, {
          maxWidth: '400px',
          width: '96vw',
          data: {
            message:
              'Automation type cannot be changed when there are branches saved in the automation. Please remove all branches and try again or create a new automation instead.'
          }
        });
        return;
      }
      let hasNoSwitchableActions = false;
      for (const node of this.nodes) {
        if (this.NoSwitchableActions.indexOf(node.type) >= 0) {
          hasNoSwitchableActions = true;
          break;
        }
      }
      if (hasNoSwitchableActions) {
        $event.preventDefault();
        this.dialog.open(NotifyComponent, {
          maxWidth: '400px',
          width: '96vw',
          data: {
            message: `Automation type cannot be changed because it contains "New Deal", "Move Deal" or "Automation" actions. Please remove these actions and try again or create a new automation instead.`
          }
        });
        return;
      }
      this.automation_type = type;
      this.storeService.automationType.next(type);
    } else {
      let hasNoSwitchableActions = false;
      if (this.label == 'modular') {
        this.label = 'modular';
      } else {
        this.label = 'deal';
      }
      for (const node of this.nodes) {
        if (this.NoSwitchableActions.indexOf(node.type) >= 0) {
          hasNoSwitchableActions = true;
          break;
        }
      }
      if (hasNoSwitchableActions) {
        this.label = 'deal';
        const dealNode = this.nodes.findIndex((item) => item.type === 'deal');
        if (dealNode >= 0) {
          $event.preventDefault();
          this.dialog.open(NotifyComponent, {
            maxWidth: '400px',
            width: '96vw',
            data: {
              message: `Automation type cannot be changed because it contains "New Deal", "Move Deal" or "Automation" actions. Please remove these actions and try again or create a new automation instead.`
            }
          });
          return;
        }
      }
      this.automation_type = type;
      this.storeService.automationType.next(type);
    }
  }

  isLastAddedAction(node): boolean {
    if (this.lastUpdatedAction) {
      if (this.lastUpdatedAction.id === node.id) {
        return true;
      }
    }
    return false;
  }

  isLastClickedLink(link): boolean {
    if (this.lastUpdatedLink) {
      if (this.lastUpdatedLink.id === link.id) {
        return true;
      }
    }
    return false;
  }

  hasMultipleBranch(node): boolean {
    if (this.automation_type === 'deal') {
      if (node) {
        const edges = this.edges.filter((item) => item.source === node.id);
        for (const edge of edges) {
          if (edge.category === 'case') {
            return false;
          }
        }
        if (edges && edges.length >= BRANCH_COUNT) {
          return false;
        } else if (edges && edges.length === 1) {
          return true;
        }
      }
    }
    return false;
  }

  isShowStartAction(): boolean {
    if (this.automation_type === 'contact') {
      if (this.nodes.length > 0) {
        if (this.nodes.length === 1 && this.nodes[0].id === 'a_10000') {
          return true;
        }
        return false;
      }
    } else {
      let firstNodes = 0;
      for (const edge of this.edges) {
        if (edge.source === 'a_10000') {
          firstNodes++;
        }
      }
      if (firstNodes > 1) {
        return false;
      }
    }
    return true;
  }

  closeAddAction(): void {
    this.addDrawer.close();
  }

  closeEditAction(): void {
    this.editDrawer.close();
  }

  runAction(res): void {
    switch (this.actionMethod) {
      case ACTION_METHOD.ADD_INSERT_ACTION:
        this.runInsertAction(res);
        this.closeAddAction();
        break;
      case ACTION_METHOD.ADD_INSERT_BRANCH:
        this.runInsertBranch(res);
        this.closeAddAction();
        break;
      case ACTION_METHOD.ADD_ACTION:
        this.runAddAction(res);
        this.closeAddAction();
        break;
      case ACTION_METHOD.EDIT_ACTION:
        this.runEditAction(res);
        this.closeEditAction();
        break;
      default:
    }
  }

  runInsertAction(res): void {
    const link = this.actionParam;
    if (link) {
      const source = link.source;
      const target = link.target;
      const lastIndex = this.identity;
      let newId = 'a_' + (lastIndex + 1);

      // get node from link
      let node = null;
      const nodeIndex = this.nodes.findIndex((item) => item.id === source);
      if (nodeIndex >= 0) {
        node = this.nodes[nodeIndex];
      }

      if (res.category === ACTION_CAT.CONDITION) {
        const confirmDialog = this.dialog.open(SelectBranchComponent, {
          ...DialogSettings.CONFIRM,
          data: {}
        });

        confirmDialog.afterClosed().subscribe((response) => {
          if (response.answer) {
            const answer = response.answer === 'yes';
            if (node) {
              const parents = this.getParents(node.id);
              const parentTypes = this.getParentTypes(parents);

              let hasDeal = false;
              if (this.automation_type === 'deal') {
                hasDeal = true;
              } else {
                if (parentTypes.length > 0) {
                  const index = parentTypes.indexOf('deal');
                  if (index >= 0) {
                    hasDeal = true;
                  }
                }
              }

              const yesId = newId;
              const nodes = this.nodes;
              let data = {
                ...res,
                id: newId,
                index: lastIndex + 1,
                label: 'YES',
                leaf: answer ? false : true,
                condition: res.multipleReview
                  ? { case: res.type, answer: true, condition_type: 1 }
                  : { case: res.type, answer: true, primary: res.primary }
              };
              if (hasDeal) {
                data['parent_type'] = 'deal';
              }
              nodes.push(data);
              const currentId = node.id;

              const edges = this.edges;
              edges.push({
                id: currentId + '_' + newId,
                source: currentId,
                target: newId,
                category: 'case',
                answer: 'yes'
              });

              newId = 'a_' + (lastIndex + 2);
              const noId = newId;
              data = {
                ...res,
                id: newId,
                index: lastIndex + 2,
                label: 'NO',
                leaf: answer ? true : false,
                condition: res.multipleReview
                  ? { case: res.type, answer: false, condition_type: 1 }
                  : { case: res.type, answer: false, primary: res.primary }
              };
              if (hasDeal) {
                data['parent_type'] = 'deal';
              }
              nodes.push(data);
              edges.push({
                id: currentId + '_' + newId,
                source: currentId,
                target: newId,
                category: 'case',
                type: res.type,
                hasLabel: true,
                answer: 'no'
              });
              this.identity += 2;
              this.nodes = [...nodes];
              this.edges = [...edges];

              edges.some((e, index) => {
                if (e.id === link.id) {
                  edges.splice(index, 1);
                  return true;
                }
              });

              // get next node
              const nextNodeIndex = this.nodes.findIndex(
                (item) => item.id === target
              );
              if (answer) {
                if (nextNodeIndex >= 0) {
                  this.nodes[nextNodeIndex].parent = yesId;
                  const addedEdge = {
                    id: yesId + '_' + this.nodes[nextNodeIndex].id,
                    source: yesId,
                    target: this.nodes[nextNodeIndex].id
                  };
                  edges.push(addedEdge);
                  this.actionParam = addedEdge;
                }
              } else {
                if (nextNodeIndex >= 0) {
                  this.nodes[nextNodeIndex].parent = noId;
                  const addedEdge = {
                    id: noId + '_' + this.nodes[nextNodeIndex].id,
                    source: noId,
                    target: this.nodes[nextNodeIndex].id
                  };
                  edges.push(addedEdge);
                  this.actionParam = addedEdge;
                }
              }
              this.edges = [...edges];
            }
          }

          if (this.actionParam) {
            this.lastUpdatedLink = this.actionParam;
            const source = this.actionParam.source;
            const parents = this.getParents(source);
            const prevFollowUps = [];
            this.nodes.forEach((e) => {
              if (e.type === 'follow_up' && parents.indexOf(e.id) !== -1) {
                prevFollowUps.push(e);
              }
            });
            const prevAppointments = [];
            this.nodes.forEach((e) => {
              if (e.type === 'appointment' && parents.indexOf(e.id) !== -1) {
                prevAppointments.push(e);
              }
            });
            //has new deal node in automation
            let isNewDeal = false;
            if (this.automation_type === 'deal') {
              isNewDeal = true;
            } else {
              const index = this.nodes.findIndex(
                (item) => item.type === 'deal'
              );
              if (index >= 0) {
                isNewDeal = true;
              }
            }

            //is insertable move deal
            let isMoveDeal = false;
            if (this.automation_type === 'deal') {
              isMoveDeal = true;
            } else {
              for (const nodeId of parents) {
                const dealIndex = this.nodes.findIndex(
                  (item) => item.id === nodeId && item.type === 'deal'
                );
                if (dealIndex >= 0) {
                  isMoveDeal = true;
                }
              }
            }

            // get node from link
            let node = null;
            const nodeIndex = this.nodes.findIndex(
              (item) => item.id === source
            );
            if (nodeIndex >= 0) {
              node = this.nodes[nodeIndex];
            }

            if (node) {
              // CONDITION ACTION HANDLER
              let conditionHandler = '';
              if (node.condition) {
                if (node.condition.answer) {
                  conditionHandler = 'trueCase';
                } else {
                  conditionHandler = 'falseCase';
                }
              }

              const data = {
                currentAction: node.type,
                parentAction: node,
                conditionHandler,
                follows: prevFollowUps,
                appointments: prevAppointments,
                hasNewDeal: isNewDeal,
                moveDeal: isMoveDeal,
                automation: this.automation,
                automation_type: this.automation_type
              };

              // prevent show condition handler when has 2 branches
              const childNodes =
                this.edges.filter((item) => item.source == node.id) || [];
              if (childNodes.length >= 2) {
                delete data.conditionHandler;
                delete data.currentAction;
              }

              this.storeService.actionInputData.next(data);
              this.actionMethod = ACTION_METHOD.ADD_INSERT_ACTION;
            }
          }
        });
      } else {
        if (res.type === 'automation') {
          this.dialog
            .open(ConfirmComponent, {
              ...DialogSettings.CONFIRM,
              data: {
                title: 'Remove all child nodes',
                message: 'Are you sure to remove all related child nodes?',
                confirmLabel: 'Delete'
              }
            })
            .afterClosed()
            .subscribe((answer) => {
              if (answer) {
                let nodes = this.nodes;
                nodes.push({
                  ...res,
                  id: newId,
                  index: lastIndex + 1,
                  label: this.ACTIONS[res.type]
                  // leaf: true
                });
                let edges = this.edges;
                edges.some((e, index) => {
                  if (e.id === link.id) {
                    edges.splice(index, 1);
                    return true;
                  }
                });
                edges.push({
                  id: source + '_' + newId,
                  source,
                  target: newId
                });
                const addedEdge = {
                  id: newId + '_' + target,
                  source: newId,
                  target
                };
                edges.push(addedEdge);

                this.identity++;
                this.nodes = [...nodes];
                this.edges = [...edges];
                this.saved = false;

                const dealNodes = [newId];
                nodes = this.nodes;
                edges = [...this.edges];
                while (true) {
                  const edgeIndex = edges.findIndex((item) => {
                    if (dealNodes.indexOf(item.source) >= 0) {
                      return true;
                    } else {
                      return false;
                    }
                  });
                  if (edgeIndex >= 0) {
                    dealNodes.push(edges[edgeIndex].target);
                    edges.splice(edgeIndex, 1);
                  } else {
                    break;
                  }
                }
                const index = dealNodes.indexOf(newId);
                if (index >= 0) {
                  dealNodes.splice(index, 1);
                }
                for (let i = nodes.length - 1; i >= 0; i--) {
                  const e = nodes[i];
                  if (dealNodes.indexOf(e.id) !== -1) {
                    nodes[i].parent_type = 'deal';
                  }
                }

                // remove child nodes
                const removeNodes = [];
                for (const edge of this.edges) {
                  if (edge.source === newId) {
                    const nodeIndex = this.nodes.findIndex(
                      (item) => item.id === edge.target
                    );
                    if (nodeIndex >= 0) {
                      removeNodes.push(this.nodes[nodeIndex]);
                    }
                  }
                }
                if (removeNodes.length > 0) {
                  for (const node of removeNodes) {
                    this.removeChildNodes(node, newId);
                  }
                }

                //set false to leaf of automation action.
                const automationIndex = this.nodes.findIndex(
                  (item) => item.id === newId
                );
                if (automationIndex >= 0) {
                  this.nodes[automationIndex].leaf = false;
                }
              }
            });
        } else {
          let nodes = this.nodes;
          nodes.push({
            ...res,
            id: newId,
            index: lastIndex + 1,
            label: this.ACTIONS[res.type]
            // leaf: true
          });
          let edges = this.edges;
          edges.some((e, index) => {
            if (e.id === link.id) {
              edges.splice(index, 1);
              return true;
            }
          });
          edges.push({ id: source + '_' + newId, source, target: newId });
          const addedEdge = { id: newId + '_' + target, source: newId, target };
          edges.push(addedEdge);

          this.actionParam = addedEdge;

          this.identity++;
          this.nodes = [...nodes];
          this.edges = [...edges];
          this.saved = false;

          if (res.type === 'deal') {
            const dealNodes = [newId];
            nodes = this.nodes;
            edges = [...this.edges];
            while (true) {
              const index = edges.findIndex((item) => {
                if (dealNodes.indexOf(item.source) >= 0) {
                  return true;
                } else {
                  return false;
                }
              });
              if (index >= 0) {
                dealNodes.push(edges[index].target);
                edges.splice(index, 1);
              } else {
                break;
              }
            }
            const index = dealNodes.indexOf(newId);
            if (index >= 0) {
              dealNodes.splice(index, 1);
            }
            for (let i = nodes.length - 1; i >= 0; i--) {
              const e = nodes[i];
              if (dealNodes.indexOf(e.id) !== -1) {
                nodes[i].parent_type = 'deal';
              }
            }
          }
        }

        if (this.actionParam) {
          this.lastUpdatedLink = this.actionParam;
          const source = this.actionParam.source;
          const parents = this.getParents(source);
          const prevFollowUps = [];
          this.nodes.forEach((e) => {
            if (e.type === 'follow_up' && parents.indexOf(e.id) !== -1) {
              prevFollowUps.push(e);
            }
          });
          const prevAppointments = [];
          this.nodes.forEach((e) => {
            if (e.type === 'appointment' && parents.indexOf(e.id) !== -1) {
              prevAppointments.push(e);
            }
          });
          //has new deal node in automation
          let isNewDeal = false;
          if (this.automation_type === 'deal') {
            isNewDeal = true;
          } else {
            const index = this.nodes.findIndex((item) => item.type === 'deal');
            if (index >= 0) {
              isNewDeal = true;
            }
          }

          //is insertable move deal
          let isMoveDeal = false;
          if (this.automation_type === 'deal') {
            isMoveDeal = true;
          } else {
            for (const nodeId of parents) {
              const dealIndex = this.nodes.findIndex(
                (item) => item.id === nodeId && item.type === 'deal'
              );
              if (dealIndex >= 0) {
                isMoveDeal = true;
              }
            }
          }

          // get node from link
          let node = null;
          const nodeIndex = this.nodes.findIndex((item) => item.id === source);
          if (nodeIndex >= 0) {
            node = this.nodes[nodeIndex];
          }

          if (node) {
            // CONDITION ACTION HANDLER
            let conditionHandler = '';
            if (node.condition) {
              if (node.condition.answer) {
                conditionHandler = 'trueCase';
              } else {
                conditionHandler = 'falseCase';
              }
            }

            const data = {
              currentAction: node.type,
              parentAction: node,
              conditionHandler,
              follows: prevFollowUps,
              appointments: prevAppointments,
              hasNewDeal: isNewDeal,
              moveDeal: isMoveDeal,
              automation: this.automation,
              automation_type: this.automation_type
            };

            // prevent show condition handler when has 2 branches
            const childNodes =
              this.edges.filter((item) => item.source == node.id) || [];
            if (childNodes.length >= 2) {
              delete data.conditionHandler;
              delete data.currentAction;
            }

            this.storeService.actionInputData.next(data);
            this.actionMethod = ACTION_METHOD.ADD_INSERT_ACTION;
          }
        }
      }
    }
  }

  runInsertBranch(res): void {
    const node = this.actionParam;
    if (node && res) {
      const edgeIndex = this.edges.findIndex((item) => item.source === node.id);
      if (edgeIndex >= 0) {
        const link = this.edges[edgeIndex];
        if (link) {
          const source = link.source;
          const target = link.target;
          const lastIndex = this.identity;
          const newId = 'a_' + (lastIndex + 1);

          const nodes = this.nodes;
          nodes.push({
            ...res,
            id: newId,
            index: lastIndex + 1,
            label: this.ACTIONS[res.type],
            leaf: res.type === 'automation' ? false : true
          });
          const edges = this.edges;
          edges.push({ id: source + '_' + newId, source, target: newId });
          this.identity++;
          this.nodes = [...nodes];
          this.edges = [...edges];
          this.saved = false;
        }
      }
    }
  }

  runAddAction(res): void {
    const node = this.actionParam;
    if (node) {
      if (res) {
        const parents = this.getParents(node.id);
        const parentTypes = this.getParentTypes(parents);

        let hasDeal = false;
        if (this.automation_type === 'deal') {
          hasDeal = true;
        } else {
          if (parentTypes.length > 0) {
            const index = parentTypes.indexOf('deal');
            if (index >= 0) {
              hasDeal = true;
            }
          }
        }

        const currentId = node.id;
        const lastIndex = this.identity;
        let newId = 'a_' + (lastIndex + 1);

        if (res.category === ACTION_CAT.NORMAL) {
          node.leaf = false;
          const nodes = this.nodes;
          const data = {
            ...res,
            id: newId,
            index: lastIndex + 1,
            label: this.ACTIONS[res.type],
            leaf: res.type === 'automation' ? false : true
          };
          if (hasDeal) {
            data['parent_type'] = 'deal';
          }
          nodes.push(data);

          this.actionParam = data;

          const edges = this.edges;
          edges.push({
            id: currentId + '_' + newId,
            source: currentId,
            target: newId,
            data: {}
          });
          this.identity += 1;
          this.nodes = [...nodes];
          this.edges = [...edges];
          this.lastUpdatedAction = this.nodes[this.nodes.length - 1];
        } else {
          node.leaf = false;
          const nodes = this.nodes;
          let data = {
            ...res,
            id: newId,
            index: lastIndex + 1,
            label: 'YES',
            leaf: true,
            condition: res.multipleReview
              ? {
                  case: res.type,
                  answer: true,
                  condition_type: 1,
                  percent: res.percent
                }
              : {
                  case: res.type,
                  answer: true,
                  primary: res.primary,
                  percent: res.percent
                }
          };
          if (hasDeal) {
            data['parent_type'] = 'deal';
          }
          nodes.push(data);
          this.actionParam = data;

          const edges = this.edges;
          edges.push({
            id: currentId + '_' + newId,
            source: currentId,
            target: newId,
            category: 'case',
            answer: 'yes',
            data: {}
          });
          newId = 'a_' + (lastIndex + 2);
          data = {
            ...res,
            id: newId,
            index: lastIndex + 2,
            label: 'NO',
            leaf: true,
            condition: res.multipleReview
              ? {
                  case: res.type,
                  answer: false,
                  condition_type: 1,
                  percent: res.percent
                }
              : {
                  case: res.type,
                  answer: false,
                  primary: res.primary,
                  percent: res.percent
                }
          };
          if (hasDeal) {
            data['parent_type'] = 'deal';
          }
          nodes.push(data);
          edges.push({
            id: currentId + '_' + newId,
            source: currentId,
            target: newId,
            category: 'case',
            type: res.type,
            hasLabel: true,
            answer: 'no',
            percent: res.percent,
            data: {
              category: 'case',
              type: res.type,
              hasLabel: true,
              answer: 'no',
              percent: res.percent
            }
          });
          this.identity += 2;
          this.nodes = [...nodes];
          this.edges = [...edges];
          this.lastUpdatedAction = node;
        }
        this.saved = false;
        // setTimeout(() => {
        //   const targetNode = this.graphWrapper.nodes.find(
        //     (n) => n.id === node.id
        //   );
        //   const positionX = targetNode.position.x;
        //   const positionY = targetNode.position.y;
        //   this.graphWrapper.panTo(positionX, positionY + 270);
        // }, 100);
      }
    } else {
      if (res) {
        const data = {
          ...res,
          id: 'a_' + this.identity,
          index: this.identity,
          label: this.ACTIONS[res.type],
          leaf: res.type === 'automation' ? false : true
        };

        this.actionParam = data;

        this.nodes.push(data);
        this.saved = false;
        this.lastUpdatedAction = this.nodes[this.nodes.length - 1];
      }
    }

    // set active added node for next insert
    if (this.actionParam) {
      this.lastUpdatedAction = this.actionParam;

      let conditionHandler = '';
      if (this.actionParam.condition) {
        if (this.actionParam.condition.answer) {
          conditionHandler = 'trueCase';
        } else {
          conditionHandler = 'falseCase';
        }
      }

      const parents = this.getParents(this.actionParam.id);
      const parentTypes = this.getParentTypes(parents);

      let hasDeal = false;
      if (this.automation_type === 'deal') {
        hasDeal = true;
      } else {
        if (parentTypes.length > 0) {
          const index = parentTypes.indexOf('deal');
          if (index >= 0) {
            hasDeal = true;
          }
        }
      }

      //is insertable move deal
      let isMoveDeal = false;
      if (this.automation_type === 'deal') {
        isMoveDeal = true;
      } else {
        for (const nodeId of parents) {
          const dealIndex = this.nodes.findIndex(
            (item) => item.id === nodeId && item.type === 'deal'
          );
          if (dealIndex >= 0) {
            isMoveDeal = true;
          }
        }
      }

      const prevFollowUps = [];
      this.nodes.forEach((e) => {
        if (e.type === 'follow_up' && parents.indexOf(e.id) !== -1) {
          prevFollowUps.push(e);
        }
      });

      const prevAppointments = [];
      this.nodes.forEach((e) => {
        if (e.type === 'appointment' && parents.indexOf(e.id) !== -1) {
          prevAppointments.push(e);
        }
      });

      const data = {
        currentAction: this.actionParam.type,
        parentAction: this.actionParam,
        conditionHandler,
        follows: prevFollowUps,
        appointments: prevAppointments,
        hasNewDeal: hasDeal,
        moveDeal: isMoveDeal,
        automation: this.automation,
        automation_type: this.automation_type
      };

      this.storeService.actionInputData.next(data);
      this.actionMethod = ACTION_METHOD.ADD_ACTION;

      this.lastUpdatedLink = null;
    }
  }

  editNode(link): void {
    const selectedNode = this.nodes.filter((item) => item.id === link.source);
    if (selectedNode[0].videos.length === 1) {
      const dialog = this.dialog.open(CaseConfirmPercentComponent, {
        width: '90vw',
        maxWidth: '500px',
        data: { percent: link.percent }
      });
      dialog.afterClosed().subscribe((result) => {
        if (
          result['status'] === true ||
          (result['status'] === false && !result['setPercent'])
        ) {
          link.percent = result.percent;
          const edge = this.edges.find((e) => e.id === link.id);
          edge.percent = result.percent;
          edge.data = { ...edge.data, percent: result.percent };
          const tag = link.target.substring(0, 2);
          const strNoIndex =
            tag + link.target.substring(2, link.target.length + 1);
          let yesIndex;
          if (!this.editMode) {
            yesIndex =
              parseInt(link.target.substring(2, link.target.length + 1)) - 1;
          } else {
            yesIndex =
              parseInt(link.target.substring(2, link.target.length + 1)) + 1;
          }
          const strYesIndex = tag + yesIndex.toString();
          const yesNode = this.nodes.find((e) => e.id === strYesIndex);
          yesNode.percent = result.percent;
          yesNode.condition.percent = result.percent;
          const noNode = this.nodes.find((e) => e.id === strNoIndex);
          noNode.percent = result.percent;
          noNode.condition.percent = result.percent;
          this.edges = JSON.parse(JSON.stringify(this.edges));
        }
      });
    } else if (selectedNode[0].videos.length > 1) {
      const materialDialog = this.dialog.open(CaseMaterialConfirmComponent, {
        width: '90vw',
        maxWidth: '500px',
        data: { materials: selectedNode[0].videos }
      });
      let review;
      let primary;
      materialDialog.afterClosed().subscribe((result) => {
        if (result) {
          review = result.review;
          primary = result.primary;

          let selectedMaterial = null;
          const index = selectedNode[0].videos.findIndex(
            (item) => item._id === primary
          );
          if (index >= 0) {
            selectedMaterial = selectedNode[0].videos[index];
          }
          if (
            (result.review !== 2 && selectedNode[0].videos.length === 1) ||
            (result.review === 2 && selectedMaterial)
          ) {
            const dialog = this.dialog.open(CaseConfirmPercentComponent, {
              width: '90vw',
              maxWidth: '500px',
              data: { percent: link.percent }
            });
            dialog.afterClosed().subscribe((result) => {
              if (result) {
                link.percent = result.percent;
                const edge = this.edges.find((e) => e.id === link.id);
                edge.percent = result.percent;
                const tag = link.target.substring(0, 2);
                const strNoIndex =
                  tag + link.target.substring(2, link.target.length + 1);
                let yesIndex;
                if (!this.editMode) {
                  yesIndex =
                    parseInt(link.target.substring(2, link.target.length + 1)) -
                    1;
                } else {
                  yesIndex =
                    parseInt(link.target.substring(2, link.target.length + 1)) +
                    1;
                }
                const strYesIndex = tag + yesIndex.toString();
                const yesNode = this.nodes.find((e) => e.id === strYesIndex);
                yesNode.condition.percent = result.percent;
                const noNode = this.nodes.find((e) => e.id === strNoIndex);
                noNode.condition.percent = result.percent;
                if (review === 0) {
                } else if (review === 1) {
                  yesNode.condition['condition_type'] = 1;
                  noNode.condition['condition_type'] = 1;
                } else {
                  yesNode.condition['primary'] = primary;
                  noNode.condition['primary'] = primary;
                }
              }
            });
          }
        }
      });
    }
  }
  runEditAction(res): void {
    const node = this.actionParam;
    if (node && res) {
      for (const key in res) {
        node[key] = res[key];
      }
      this.lastUpdatedAction = node;
      this.lastUpdatedLink = null;
      this.saved = false;
      if (
        this.prevNode.type === 'send_text_video' ||
        this.prevNode.type === 'send_text_image' ||
        this.prevNode.type === 'send_text_pdf' ||
        this.prevNode.type === 'send_text_material'
      ) {
        if (node.type === 'text') {
          // this.removeBranchByEdit(node);
          this.confirmKeepBranch(node);
        } else if (node.type === 'send_text_video') {
          this.confirmNodeCasePercent(node);
        } else if (node.type === 'send_text_material') {
          this.confirmNodeCaseMaterial(node);
        } else {
          this.setWatchedMaterialCondition(node);
        }
      } else if (
        this.prevNode.type === 'send_email_video' ||
        this.prevNode.type === 'send_email_image' ||
        this.prevNode.type === 'send_email_pdf' ||
        this.prevNode.type === 'send_email_material'
      ) {
        if (node.type === 'email') {
          this.confirmKeepBranch(node);
        } else if (node.type === 'send_email_video') {
          this.confirmNodeCasePercent(node);
        } else if (node.type === 'send_email_material') {
          this.confirmNodeCaseMaterial(node);
        } else {
          this.setWatchedMaterialCondition(node);
        }
      } else if (this.prevNode.type === 'email') {
        if (node.type === 'email') {
        } else if (node.type === 'send_email_video') {
          this.confirmNodeCasePercent(node);
        } else if (node.type === 'send_email_material') {
          this.confirmNodeCaseMaterial(node);
        } else {
          this.setWatchedMaterialCondition(node);
        }
      } else {
        const index = this.nodes.findIndex((item) => item.id === node.id);
        if (index >= 0) {
          this.nodes.splice(index, 1, node);
        }
      }
    }
  }

  fullScreen(): void {
    this.isFullScreen = !this.isFullScreen;
    window.dispatchEvent(new Event('resize'));
  }

  isShowTimeDelay(node): boolean {
    if (node.period > 0) {
      return true;
    } else if (this.NoLimitActions.indexOf(node.type) === -1) {
      return true;
    }
    return false;
  }

  isShowComplete(): boolean {
    if (this.editMode !== 'edit') {
      return true;
    }
    if (!this.loadingAutomation) {
      if (this.automation) {
        return true;
      }
    }
    return false;
  }
  _downloadFolder(automation: any): void {
    this.automationService
      .downloadFolder({ folders: [automation._id] })
      .subscribe((res) => {
        if (res) {
          this.automationService.loadOwn(true);
          if (!this.user.onboard.automation_download) {
            this.user.onboard.automation_download = true;
            this.userService
              .updateProfile({ onboard: this.user.onboard })
              .subscribe(() => {
                this.userService.updateProfileImpl({
                  onboard: this.user.onboard
                });
              });
          }
        }
      });
  }
  _downloadAutomation(automation: any): void {
    const element = JSON.parse(JSON.stringify(automation));
    const curElement = _.omit(element, ['_id', 'role', 'company']);
    const childAutomationIds = [];
    const childAutomationNames = [];
    const videoNames = [];
    const imageNames = [];
    const pdfNames = [];
    const dealStageNames = [];
    const childDealStageIds = [];
    let check_status = false;
    for (let i = 0; i < curElement.automations.length; i++) {
      const tempItem = curElement.automations[i];
      if (tempItem.action.type === 'automation') {
        childAutomationIds.push(tempItem.action.automation_id);
      }
      if (tempItem.action.videos && tempItem.action.videos.length > 0) {
        check_status = true;
      }
      if (tempItem.action.pdfs && tempItem.action.pdfs.length > 0) {
        check_status = true;
      }
      if (tempItem.action.images && tempItem.action.images.length > 0) {
        check_status = true;
      }
      if (tempItem.action.type === 'deal') {
        childDealStageIds.push(tempItem.action.deal_stage);
      }
    }
    let dialog;
    if (childAutomationIds.length > 0) {
      this.automationService
        .getChildAutomationNames(automation._id)
        .subscribe((res) => {
          for (let i = 0; i < res['titles'].length; i++) {
            childAutomationNames.push(res['titles'][i]);
          }
          if (res['videos'].length > 0) {
            for (let i = 0; i < res['videos'].length; i++) {
              videoNames.push(res['videos'][i]);
            }
          }
          if (res['images'].length > 0) {
            for (let i = 0; i < res['images'].length; i++) {
              imageNames.push(res['images'][i]);
            }
          }
          if (res['pdfs'].length > 0) {
            for (let i = 0; i < res['pdfs'].length; i++) {
              pdfNames.push(res['pdfs'][i]);
            }
          }
          if (res['dealStages'].length > 0) {
            for (let i = 0; i < res['dealStages'].length; i++) {
              dealStageNames.push(res['dealStages'][i]);
            }
          }
          const tempAutomationNames = childAutomationNames.filter(
            (c, index) => {
              return childAutomationNames.indexOf(c)! == index;
            }
          );
          const tempImageNames = _.uniqBy(imageNames, 'title');
          const tempVideoNames = _.uniqBy(videoNames, 'title');
          const tempPdfNames = _.uniqBy(pdfNames, 'title');
          const tempDealStageNames = _.uniqBy(dealStageNames, 'title');
          dialog = this.dialog.open(ConfirmComponent, {
            maxWidth: '400px',
            width: '96vw',
            position: { top: '100px' },
            data: {
              title: 'Download Automations',
              message: 'Are you sure to download these ones?',
              titles: tempAutomationNames,
              videos: tempVideoNames,
              images: tempImageNames,
              dealStages: tempDealStageNames,
              stages: this.stages,
              pipelines: this.pipelines,
              pdfs: tempPdfNames,
              confirmLabel: 'Yes',
              cancelLabel: 'No'
            }
          });
          dialog.afterClosed().subscribe((res) => {
            if (res) {
              this.isSaving = true;
              this.automationService
                .download({ data: curElement, match_info: res.matchInfo })
                .subscribe((res) => {
                  if (res) {
                    this.isSaving = false;
                    if (tempDealStageNames.length > 0) {
                      this.dealsService.easyGetPipeLine(true);
                    }
                    this.automationService.loadOwn(true);
                    if (!this.user.onboard.automation_download) {
                      this.user.onboard.automation_download = true;
                      this.userService
                        .updateProfile({ onboard: this.user.onboard })
                        .subscribe(() => {
                          this.userService.updateProfileImpl({
                            onboard: this.user.onboard
                          });
                        });
                    }
                  }
                });
              this.automationService.loadOwn(true);
            }
          });
        });
    } else {
      if (check_status || childDealStageIds.length > 0) {
        this.automationService
          .getChildAutomationNames(automation._id)
          .subscribe((res) => {
            for (let i = 0; i < res['titles'].length; i++) {
              childAutomationNames.push(res['titles'][i]);
            }
            if (res['videos'].length > 0) {
              for (let i = 0; i < res['videos'].length; i++) {
                videoNames.push(res['videos'][i]);
              }
            }
            if (res['images'].length > 0) {
              for (let i = 0; i < res['images'].length; i++) {
                imageNames.push(res['images'][i]);
              }
            }
            if (res['pdfs'].length > 0) {
              for (let i = 0; i < res['pdfs'].length; i++) {
                pdfNames.push(res['pdfs'][i]);
              }
            }
            if (res['dealStages'].length > 0) {
              for (let i = 0; i < res['dealStages'].length; i++) {
                dealStageNames.push(res['dealStages'][i]);
              }
            }
            const tempAutomationNames = childAutomationNames.filter(
              (c, index) => {
                return childAutomationNames.indexOf(c)! == index;
              }
            );
            const tempImageNames = _.uniqBy(imageNames, 'title');
            const tempVideoNames = _.uniqBy(videoNames, 'title');
            const tempPdfNames = _.uniqBy(pdfNames, 'title');
            const tempDealStageNames = _.uniqBy(dealStageNames, 'title');
            dialog = this.dialog.open(ConfirmComponent, {
              maxWidth: '400px',
              width: '96vw',
              position: { top: '100px' },
              data: {
                title: 'Download Automations',
                message: 'Are you sure to download these ones?',
                titles: tempAutomationNames,
                videos: tempVideoNames,
                images: tempImageNames,
                pdfs: tempPdfNames,
                dealStages: tempDealStageNames,
                stages: this.stages,
                pipelines: this.pipelines,
                confirmLabel: 'Yes',
                cancelLabel: 'No'
              }
            });
            dialog.afterClosed().subscribe((res) => {
              if (res) {
                this.isSaving = true;
                this.automationService
                  .download({
                    data: curElement,
                    match_info: res.matchInfo
                  })
                  .subscribe((res) => {
                    this.isSaving = false;
                    if (tempDealStageNames.length > 0) {
                      this.dealsService.easyGetPipeLine(true);
                    }
                    this.automationService.loadOwn(true);
                    if (!this.user.onboard.automation_download) {
                      this.user.onboard.automation_download = true;
                      this.userService
                        .updateProfile({ onboard: this.user.onboard })
                        .subscribe(() => {
                          this.userService.updateProfileImpl({
                            onboard: this.user.onboard
                          });
                        });
                    }
                  });
              }
            });
          });
      } else {
        this.isSaving = true;
        this.automationService
          .download({
            data: curElement,
            match_info: ''
          })
          .subscribe((res) => {
            this.isSaving = false;
            this.automationService.loadOwn(true);
            if (!this.user.onboard.automation_download) {
              this.user.onboard.automation_download = true;
              this.userService
                .updateProfile({ onboard: this.user.onboard })
                .subscribe(() => {
                  this.userService.updateProfileImpl({
                    onboard: this.user.onboard
                  });
                });
            }
          });
      }
    }
  }
  download(automation: any): void {
    let isExist = false;
    let ConfirmDialog;
    automation.original_id = automation._id;
    for (const automationItem of this.automations) {
      if (automationItem.original_id === automation._id) {
        isExist = true;
      }
    }
    if (automation.isFolder) {
      if (isExist) {
        ConfirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Download Folder',
            message: 'Are you sure to download this folder again?',
            confirmLabel: 'Download',
            cancelLabel: 'Cancel'
          }
        });
        ConfirmDialog.afterClosed().subscribe((res) => {
          if (res) {
            this._downloadFolder(automation);
          }
        });
      } else {
        this._downloadFolder(automation);
      }
    } else {
      if (isExist) {
        ConfirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Download Automation',
            message: 'Are you sure to download this automation again?',
            confirmLabel: 'Download',
            cancelLabel: 'Cancel'
          }
        });
        ConfirmDialog.afterClosed().subscribe((res) => {
          if (res) {
            this._downloadAutomation(automation);
          }
        });
      } else {
        this._downloadAutomation(automation);
      }
    }
  }

  setPercentToEdge(branch, percent): void {
    const index = this.edges.findIndex(
      (item) =>
        item.id.indexOf(branch.id) >= 0 &&
        item.data?.category &&
        item.data.category === 'case' &&
        item.data.answer === 'no'
    );
    if (index >= 0) {
      this.edges[index].data.percent = percent;
      this.edges = [...this.edges];
    }
  }

  setConditionTypeToWatched(branch): void {
    const index = this.edges.findIndex(
      (item) =>
        item.id.indexOf(branch.id) >= 0 &&
        item.data?.category &&
        item.data.category === 'case' &&
        item.data.answer === 'no'
    );
    if (index >= 0) {
      this.edges[index].data.type = 'watched_material';
      this.edges = [...this.edges];
    }
  }

  confirmNodeCasePercent(node): void {
    const branchNodes = this.getConditionsById(node.id);
    if (branchNodes.length > 0) {
      const dialog = this.dialog.open(CaseConfirmPercentComponent, {
        width: '90vw',
        maxWidth: '500px',
        data: { percent: branchNodes[0].condition?.percent }
      });
      dialog.afterClosed().subscribe((result) => {
        for (const branchNode of branchNodes) {
          if (branchNode && branchNode.condition) {
            branchNode.condition['case'] = 'watched_material';
            this.setConditionTypeToWatched(branchNode);
            if (
              result['status'] === true ||
              (result['status'] === false && !result['setPercent'])
            ) {
              branchNode.condition.percent = result.percent;
              this.setPercentToEdge(branchNode, result.percent);
            }
          }
        }
      });
    }
  }

  confirmNodeCaseMaterial(node): void {
    const branchNodes = this.getConditionsById(node.id);
    const materials = this.getMaterials(node);
    const caseMaterialDialog = this.dialog.open(CaseMaterialConfirmComponent, {
      width: '90vw',
      maxWidth: '500px',
      disableClose: true,
      data: { materials }
    });
    caseMaterialDialog.afterClosed().subscribe((result) => {
      if (result) {
        for (const branchNode of branchNodes) {
          if (branchNode && branchNode.condition) {
            branchNode.condition['case'] = 'watched_material';
            this.setConditionTypeToWatched(branchNode);
            branchNode.condition.percent = undefined;
            this.setPercentToEdge(branchNode, undefined);
          }
        }
        if (result.review === 0) {
        } else if (result.review === 1) {
          for (const branchNode of branchNodes) {
            if (
              branchNode &&
              branchNode.condition &&
              branchNode.condition.answer
            ) {
              branchNode.condition['condition_type'] = 1;
            }
          }
        } else if (result.review === 2) {
          for (const branchNode of branchNodes) {
            if (
              branchNode &&
              branchNode.condition &&
              branchNode.condition.answer
            ) {
              branchNode.condition['primary'] = result.primary;
            }
          }
        }

        let selectedMaterial = null;
        const videos = materials.filter(
          (item) => item.material_type === 'video'
        ).length;
        if (result.review === 2 && result.primary) {
          const index = this.materials.findIndex(
            (item) => item._id === result.primary
          );
          if (index >= 0) {
            selectedMaterial = this.materials[index];
          }
        }

        if (
          (result.review !== 2 && videos === 1) ||
          (result.review === 2 && selectedMaterial?.material_type === 'video')
        ) {
          this.confirmNodeCasePercent(node);
        }
      } else {
        this.setWatchedMaterialCondition(node);
      }
    });
  }

  confirmKeepBranch(node): void {
    const branchNodes = this.getConditionsById(node.id);
    if (branchNodes.length > 0) {
      const confirmKeepDialog = this.dialog.open(CaseConfirmKeepComponent, {
        width: '90vw',
        maxWidth: '500px',
        disableClose: true,
        data: { type: node.type }
      });
      confirmKeepDialog.afterClosed().subscribe((result) => {
        if (result) {
          if (result.option === 'switch') {
            this.setOpenedEmailCondition(node);
          } else if (result.option === 'remove') {
            this.removeBranchByEdit(node);
          } else {
            let branch = null;
            for (const edge of this.edges) {
              if (edge.source === node.id) {
                branch = edge;
                break;
              }
            }
            if (branch && branch.category === 'case') {
              const newSource = branch.source;
              let yesCase; // "Yes" node id
              let noCase; // "No" node id
              let yesNextNode; // Node behind "Yes"
              let noNextNode; // Node behind "No"
              const edges = this.edges;
              const nodes = this.nodes;
              for (let i = edges.length - 1; i >= 0; i--) {
                const e = edges[i];
                if (e.source === newSource && e.answer === 'yes') {
                  yesCase = e.target;
                }
                if (e.source === newSource && e.answer === 'no') {
                  noCase = e.target;
                }
                if (yesCase && noCase) {
                  break;
                }
              }
              for (let i = edges.length - 1; i >= 0; i--) {
                const e = edges[i];
                if (e.source === yesCase) {
                  yesNextNode = e.target;
                }
                if (e.source === noCase) {
                  noNextNode = e.target;
                }
                if (yesNextNode && noNextNode) {
                  break;
                }
              }
              if (result.option === 'trueCase') {
                const deleteNodes = [noCase];
                edges.forEach((e) => {
                  if (deleteNodes.indexOf(e.source) !== -1) {
                    deleteNodes.push(e.target);
                  }
                });
                deleteNodes.push(yesCase);
                for (let i = edges.length - 1; i >= 0; i--) {
                  const e = edges[i];
                  if (deleteNodes.indexOf(e.source) !== -1) {
                    edges.splice(i, 1);
                  } else if (deleteNodes.indexOf(e.target) !== -1) {
                    edges.splice(i, 1);
                  }
                }
                for (let i = nodes.length - 1; i >= 0; i--) {
                  const e = nodes[i];
                  if (deleteNodes.indexOf(e.id) !== -1) {
                    nodes.splice(i, 1);
                  }
                }
                if (yesNextNode) {
                  edges.push({
                    id: node.id + '_' + yesNextNode,
                    source: node.id,
                    target: yesNextNode
                  });
                } else {
                  node.leaf = true;
                }
              } else if (result.option === 'falseCase') {
                const deleteNodes = [yesCase];
                edges.forEach((e) => {
                  if (deleteNodes.indexOf(e.source) !== -1) {
                    deleteNodes.push(e.target);
                  }
                });
                deleteNodes.push(noCase);
                // deleteNodes.splice(0, 1);
                for (let i = edges.length - 1; i >= 0; i--) {
                  const e = edges[i];
                  if (deleteNodes.indexOf(e.source) !== -1) {
                    edges.splice(i, 1);
                  } else if (deleteNodes.indexOf(e.target) !== -1) {
                    edges.splice(i, 1);
                  }
                }
                for (let i = nodes.length - 1; i >= 0; i--) {
                  const e = nodes[i];
                  if (deleteNodes.indexOf(e.id) !== -1) {
                    nodes.splice(i, 1);
                  }
                }
                if (noNextNode) {
                  edges.push({
                    id: node.id + '_' + noNextNode,
                    source: node.id,
                    target: noNextNode
                  });
                } else {
                  node.leaf = true;
                }
              }
              this.nodes = [...nodes];
              this.edges = [...edges];
            }
          }
        }
      });
    }
  }

  ICONS = {
    follow_up: AUTOMATION_ICONS.FOLLOWUP,
    update_follow_up: AUTOMATION_ICONS.UPDATE_FOLLOWUP,
    note: AUTOMATION_ICONS.CREATE_NOTE,
    text: AUTOMATION_ICONS.SEND_TEXT,
    audio: AUTOMATION_ICONS.SEND_AUDIO,
    email: AUTOMATION_ICONS.SEND_EMAIL,
    send_email_video: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    send_text_video: AUTOMATION_ICONS.SEND_VIDEO_TEXT,
    send_email_pdf: AUTOMATION_ICONS.SEND_PDF_EMAIL,
    send_text_pdf: AUTOMATION_ICONS.SEND_PDF_TEXT,
    send_email_image: AUTOMATION_ICONS.SEND_IMAGE_EMAIL,
    send_text_image: AUTOMATION_ICONS.SEND_IMAGE_TEXT,
    update_contact: AUTOMATION_ICONS.UPDATE_CONTACT,
    deal: AUTOMATION_ICONS.NEW_DEAL,
    send_email_material: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    send_text_material: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    move_deal: AUTOMATION_ICONS.MOVE_DEAL,
    automation: AUTOMATION_ICONS.AUTOMATION,
    appointment: AUTOMATION_ICONS.APPOINTMENT,
    update_appointment: AUTOMATION_ICONS.APPOINTMENT
  };

  ACTIONS = {
    follow_up: 'New Task',
    update_follow_up: 'Edit Task',
    note: 'New Note',
    email: 'New Email',
    text: 'New Text',
    audio: 'New Ringless VM',
    send_email_video: 'New Video Email',
    send_text_video: 'New Video Text',
    send_email_pdf: 'New PDF Email',
    send_text_pdf: 'New PDF Text',
    send_email_image: 'New Image Email',
    send_text_image: 'New Image Text',
    update_contact: 'Edit Contact',
    deal: 'New Deal',
    move_deal: 'Move Deal',
    send_email_material: 'New Material Email',
    send_text_material: 'New Material Text',
    automation: 'Automation',
    appointment: 'New Appointment',
    update_appointment: 'Update Appointment'
  };

  CASE_ACTIONS = {
    watched_video: 'Watched Video?',
    watched_pdf: 'Reviewed PDF?',
    watched_image: 'Reviewed Image?',
    opened_email: 'Opened Email?',
    replied_text: 'Replied Text',
    watched_material: 'Watched Material?'
  };
  NEED_CASE_ACTIONS: [
    'email',
    'send_email_video',
    'send_text_video',
    'send_email_pdf',
    'send_text_pdf',
    'send_email_image',
    'send_text_image'
  ];

  NoLimitActions = [
    'note',
    'follow_up',
    'update_contact',
    'update_follow_up',
    'deal',
    'move_deal'
  ];

  NoSwitchableActions = ['deal', 'move_deal', 'automation'];
}
