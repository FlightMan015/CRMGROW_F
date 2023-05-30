import {
  Component,
  ElementRef,
  Input,
  NgZone,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { OverlayService } from 'src/app/services/overlay.service';
import { LabelService } from 'src/app/services/label.service';
import { environment } from 'src/environments/environment';
import { Subject, Subscription } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { DealsService } from '../../services/deals.service';
import { MaterialService } from '../../services/material.service';
import { StoreService } from '../../services/store.service';
import { Material } from '../../models/material.model';
import * as _ from 'lodash';
import { AutomationService } from '../../services/automation.service';
import {
  ACTION_CAT,
  AUTOMATION_ICONS,
  BRANCH_COUNT,
  CALENDAR_DURATION
} from '../../constants/variable.constants';
import { Contact } from '../../models/contact.model';
import { stepRound } from '../../variables/customStepCurved';
import { Layout } from '@swimlane/ngx-graph';
import { DagreNodesOnlyLayout } from '../../variables/customDagreNodesOnly';
import { Automation } from '../../models/automation.model';
import {DialerService} from "../../services/dialer.service";

@Component({
  selector: 'app-automation-detail-overlay',
  templateUrl: './automation-detail-overlay.component.html',
  styleUrls: ['./automation-detail-overlay.component.scss']
})
export class AutomationDetailOverlayComponent implements OnInit {
  @Input('easyDataSource') easyNode;
  @Input('fullDataSource') fullNode;
  @Input('automationType') automationType = 'contact';
  @Input('type') type;
  @Input('disableOverlay') disableOverlay = false;
  isShow = false;
  siteUrl = environment.website;
  user_id = '';
  profileSubscription: Subscription;
  loadSubscription: Subscription;
  stages: any[] = [];
  automations: any[] = [];
  materials = [];
  libraries = [];

  // for show automation graph
  layoutSettings = {
    orientation: 'TB'
  };
  center$: Subject<boolean> = new Subject();
  panToNode$: Subject<string> = new Subject();
  curve = stepRound;
  public layout: Layout = new DagreNodesOnlyLayout();
  initEdges = [];
  initNodes = [{ id: 'start', label: '' }];
  edges = [];
  nodes = [];
  saved = true;
  identity = 1;
  autoZoom = true;
  zoomLevel = 0.8;
  autoCenter = true;

  @ViewChild('wrapper') wrapper: ElementRef;
  wrapperWidth = 0;
  wrapperHeight = 0;
  offsetX = 0;
  offsetY = 0;

  automation_type = 'contact';
  showType = 'contact';
  automation;
  automationSummary: Automation = new Automation();
  timelines = [];
  automation_id = '';
  isInherited = false;
  rvms = [];
  dialerSubscription: Subscription;

  constructor(
    private overlayService: OverlayService,
    public labelService: LabelService,
    private dealsService: DealsService,
    private userService: UserService,
    public materialService: MaterialService,
    private automationService: AutomationService,
    public storeService: StoreService,
    private dialerService: DialerService,
    private viewContainerRef: ViewContainerRef,
    private ngZone: NgZone
  ) {
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.user_id = profile._id;
      }
    );
    this.dealsService.getStage(true);
    this.dealsService.stages$.subscribe((res) => {
      this.stages = [...res];
    });
    this.automationService.automations$.subscribe((res) => {
      this.automations = res;
    });
    this.dialerService.loadAudioMessages();
    this.dialerSubscription = this.dialerService.rvms$.subscribe((res) => {
      if (res['success']) {
        this.rvms = res['messages'];
      }
    });
  }

  ngOnInit(): void {
    console.log('easy node =============>', this.easyNode, this.fullNode);
    this.materialService.loadMaterial(false);
    this.storeService.materials$.subscribe((materials) => {
      this.materials = materials;
    });
    this.loadSubscription = this.storeService.libraries$.subscribe(
      (libraries) => {
        this.libraries = libraries;
      }
    );
    if (this.isShowAutomationGraph(this.fullNode)) {
      this.timelines = this.fullNode.timelines;
      this.loadAutomation(this.fullNode['automation_id']);
    }
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  update(): void {
    this.overlayService.close('edit');
  }

  remove(): void {
    this.overlayService.close('remove');
  }

  expand(automation_id): void {
    window.open('/autoflow/edit/' + automation_id, '_blank');
  }

  overlayClose(): void {
    this.overlayService.close(null);
  }

  seeMore(): void {
    this.isShow = !this.isShow;
  }

  getDealStageName(id): any {
    if (this.stages && this.stages.length > 0) {
      const index = this.stages.findIndex((item) => item._id === id);
      if (index >= 0) {
        return this.stages[index].title;
      }
    }
    return '';
  }

  getAutomationTitle(id): any {
    if (this.automations && this.automations.length > 0) {
      const index = this.automations.findIndex((item) => item._id === id);
      if (index >= 0) {
        return this.automations[index].title;
      }
    }
    return '';
  }

  getMaterialInfo(node): any {
    let materials = [];
    let previewType = '';
    let videoCount = 0;
    let pdfCount = 0;
    let imageCount = 0;

    if (node.videos && node.videos.length > 0) {
      materials = [...node.videos];
      previewType = 'video';
      videoCount = node.videos.length - 1;
    }
    if (node.pdfs && node.pdfs.length > 0) {
      materials = [...materials, ...node.pdfs];
      pdfCount = node.pdfs.length;
      if (previewType === '') {
        previewType = 'pdf';
        pdfCount--;
      }
    }
    if (node.images && node.images.length > 0) {
      materials = [...materials, ...node.images];
      imageCount = node.images.length;
      if (previewType === '') {
        previewType = 'image';
        imageCount--;
      }
    }
    let previewMaterial = {};
    if (materials && materials.length > 0) {
      const index = this.materials.findIndex(
        (item) => item._id === materials[0]
      );
      if (index >= 0) {
        previewMaterial = this.materials[index];
      }
    }
    if (materials && materials.length > 0) {
      const index = this.libraries.findIndex(
        (item) => item._id === materials[0]
      );
      if (index >= 0) {
        previewMaterial = this.libraries[index];
      }
    }
    const result = {
      previewType,
      count: materials.length - 1,
      material: previewMaterial,
      videoCount,
      pdfCount,
      imageCount
    };
    return result;
  }

  getAssignAt(group): string {
    if (group === 'primary') {
      return 'Primary Contact';
    }
    return 'Everyone';
  }

  isShowAssignAt(node) {
    if (this.automationType == 'deal') {
      return true;
    } else {
      if (node.type == 'deal') {
        return false;
      }
    }
    if (node.group == undefined || node.group == null) {
      return false;
    }
    return true;
  }

  getCalendarDuration(duration): string {
    const index = CALENDAR_DURATION.findIndex(
      (item) => item.value === duration
    );
    if (index >= 0) {
      return CALENDAR_DURATION[index].text;
    }
    return '';
  }

  getContact(contact): any {
    return new Contact().deserialize(contact);
  }

  // show graph functions

  isShowAutomationGraph(action): boolean {
    if (action && action.type === 'automation') {
      return true;
    }
    return false;
  }

  loadAutomation(id: string): void {
    this.automationService.get(id).subscribe(
      (res) => {
        this.automation = res;
        this.automation_type = res['type'] || 'contact';
        // insert start action

        const actions = res['automations'];
        if (this.timelines && this.timelines.length > 0) {
          const timelines = [...this.timelines];
          const automationTimelines = timelines.filter(
            (item) => item.automation === id
          );
          for (const timeline of automationTimelines) {
            timeline.ref = timeline.ref.replace(`_${id}`, '');
            timeline.parent_ref = timeline.parent_ref.replace(`_${id}`, '');
          }

          if (timelines && timelines.length > 0) {
            for (const action of actions) {
              const index = timelines.findIndex(
                (item) => item.ref === action.id
              );
              if (index >= 0) {
                action.status = timelines[index].status;
              }
            }
          }
        } else {
          for (const action of actions) {
            action.status = 'pending';
          }
        }

        this.composeGraph(actions);
        if (this.fullNode && this.fullNode.no_timelines) {
          return;
        }
        this.rebuildStatus();
      },
      (err) => {}
    );
  }

  composeGraph(actions): void {
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
            node['automation_id'] = e.action.automation_id;
            node['due_date'] = e.action.due_date;
            node['due_duration'] = e.action.due_duration;
            node['videos'] = e.action.videos;
            node['pdfs'] = e.action.pdfs;
            node['images'] = e.action.images;
            node['label'] = this.ACTIONS[type];
            node['category'] = ACTION_CAT.NORMAL;
            node['command'] = e.action.command;
            node['ref_id'] = e.action.ref_id;
            node['group'] = e.action.group;
            node['status'] = e.status;
          }
          nodes.push(node);

          if (e.condition.answer) {
            const actionCondition = {
              case: e.condition.case,
              answer: true
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
              status: e.status
            });
            edges.push({
              id: bTarget + '_' + target,
              source: bTarget,
              target: target,
              status: e.status
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
              answer: false
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
              status: e.status
            });
            edges.push({
              id: bTarget + '_' + target,
              source: bTarget,
              target: target,
              status: e.status
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
            node['automation_id'] = e.action.automation_id;
            node['due_date'] = e.action.due_date;
            node['due_duration'] = e.action.due_duration;
            node['videos'] = e.action.videos;
            node['pdfs'] = e.action.pdfs;
            node['images'] = e.action.images;
            node['label'] = this.ACTIONS[type];
            node['category'] = ACTION_CAT.NORMAL;
            node['command'] = e.action.command;
            node['ref_id'] = e.action.ref_id;
            node['group'] = e.action.group;
            node['status'] = e.status;
          }
          nodes.push(node);
          if (e.parent !== '0') {
            const source = e.parent;
            const target = e.id;
            edges.push({
              id: source + '_' + target,
              source,
              target,
              status: e.status
            });
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
            type: conditionType
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
            answer: 'yes'
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

    // disable auto center for flipping issue when add action.
    setTimeout(() => {
      this.autoCenter = false;
      this.autoZoom = false;
      this.center$.next(false);

      //move to active node
      for (const node of this.nodes) {
        if (node.status === 'active') {
          this.panToNode$.next(node.id);
          break;
        }
      }
    }, 500);
  }

  rebuildStatus(): void {
    for (const edge of this.edges) {
      if (edge.source !== 'a_10000' && this.timelines) {
        const index = this.timelines.findIndex(
          (item) => item.ref === edge.source
        );
        if (index < 0) {
          edge.status = 'pending';
        }
      }
    }
  }

  genIndex(id: string): any {
    const idStr = (id + '').replace('a_', '');
    return parseInt(idStr);
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

  showStatus(node): boolean {
    // if (this.isInherited) {
    //   return true;
    // }
    // if (node && this.timelines.length > 0) {
    //   const index = this.timelines.findIndex((item) => item.ref === node.id);
    //   if (index >= 0) {
    //     return true;
    //   }
    // }
    return true;
  }

  easyView(event: any, node: any, origin: any, content: any): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.disableOverlay) {
      return ;
    }

    this.ngZone.run(() => {
      if (node.type === 'automation') {
        node['no_timelines'] = true;
      }
      this.overlayService
        .openSubOverlay(origin, content, this.viewContainerRef, 'automation', {
          data: node
        })
        .subscribe((res) => {});
    });
  }

  getDuration(duration): string {
    if (duration) {
      if (duration >= 48) {
        const day = Math.floor(duration / 24);
        if (day * 24 == duration) {
          return day + ' Days';
        } else {
          return duration + ' Hours';
        }
      } else {
        return duration + ' Hours';
      }
    } else {
      return 'Immediately';
    }
  }

  getVoicemailInfo(id): any {
    const index = this.rvms.findIndex((item) => item.id === id);
    if (index >= 0) {
      return this.rvms[index];
    } else {
      return null;
    }
  }

  ICONS = {
    follow_up: AUTOMATION_ICONS.FOLLOWUP,
    update_follow_up: AUTOMATION_ICONS.UPDATE_FOLLOWUP,
    note: AUTOMATION_ICONS.CREATE_NOTE,
    text: AUTOMATION_ICONS.SEND_TEXT,
    email: AUTOMATION_ICONS.SEND_EMAIL,
    send_email_video: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    send_text_video: AUTOMATION_ICONS.SEND_VIDEO_TEXT,
    send_email_pdf: AUTOMATION_ICONS.SEND_PDF_EMAIL,
    send_text_pdf: AUTOMATION_ICONS.SEND_PDF_TEXT,
    send_email_image: AUTOMATION_ICONS.SEND_IMAGE_EMAIL,
    send_text_image: AUTOMATION_ICONS.SEND_IMAGE_TEXT,
    update_contact: AUTOMATION_ICONS.UPDATE_CONTACT,
    deal: AUTOMATION_ICONS.NEW_DEAL,
    move_deal: AUTOMATION_ICONS.MOVE_DEAL,
    send_email_material: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    send_text_material: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    automation: AUTOMATION_ICONS.AUTOMATION
  };
  ACTIONS = {
    follow_up: 'New Task',
    update_follow_up: 'Edit Task',
    note: 'New Note',
    email: 'New Email',
    text: 'New Text',
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
    automation: 'Automation'
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
}
