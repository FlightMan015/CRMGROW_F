import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ACTION_CAT,
  AUTOMATION_ICONS,
  BRANCH_COUNT
} from 'src/app/constants/variable.constants';
import { DagreNodesOnlyLayout } from '../../variables/customDagreNodesOnly';
import { stepRound } from '../../variables/customStepCurved';
import { AutomationService } from 'src/app/services/automation.service';
import { OverlayService } from 'src/app/services/overlay.service';
import { PageCanDeactivate } from 'src/app/variables/abstractors';
import { Subject } from 'rxjs';
import { Layout } from '@swimlane/ngx-graph';
import { Automation } from 'src/app/models/automation.model';

@Component({
  selector: 'app-automation-show-full',
  templateUrl: './automation-show-full.component.html',
  styleUrls: ['./automation-show-full.component.scss']
})
export class AutomationShowFullComponent
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
  edges = [];
  nodes = [];
  saved = true;
  identity = 1;
  autoZoom = false;
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
  actions = [];

  constructor(
    private dialogRef: MatDialogRef<AutomationShowFullComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private automationService: AutomationService,
    private overlayService: OverlayService,
    private viewContainerRef: ViewContainerRef
  ) {
    super();
    if (this.data && this.data.id) {
      this.automation_id = this.data.id;
    }
    if (this.data && this.data.automation) {
      this.automationSummary = new Automation().deserialize(
        this.data.automation
      );
    }
    if (this.data && this.data.timelines) {
      this.timelines = this.data.timelines;
    }
    if (this.data && this.data.type) {
      this.automation_type = this.data.type;
    }
  }

  ngOnInit(): void {
    this.buildActionsFromTimeline();
    this.composeGraph(this.actions);

    // this.loadData(this.automation_id);
    window['confirmReload'] = true;

    document.body.classList.add('overflow-hidden');
    if (window.innerWidth < 576) {
      this.zoomLevel = 0.6;
    }
  }

  ngOnDestroy(): void {
    // this.storeData();
    window['confirmReload'] = false;

    document.body.classList.remove('overflow-hidden');
  }

  ngAfterViewInit(): void {
    this.onResize(null);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event): void {
    this.wrapperWidth = this.wrapper.nativeElement.offsetWidth;
  }

  buildActionsFromTimeline(): void {
    if (this.automation_type === 'contact') {
      for (const timeline of this.timelines) {
        if (timeline.visible) {
          const action = {
            _id: timeline._id,
            action: timeline.action,
            condition: timeline.condition,
            automation: timeline.automation,
            id: timeline.ref,
            parent: timeline.parent_ref,
            period: timeline.period,
            status: timeline.status,
            watched_materials: timeline.watched_materials,
            created_at: timeline.created_at,
            updated_at: timeline.updated_at
          };
          const automationId = timeline.automation;
          if (automationId) {
            action.id = action.id.replace(`_${automationId}`, '');
            action.parent = action.parent.replace(`_${automationId}`, '');
          }
          this.actions.push(action);
        }
      }
      this.actions.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
      this.filterContactAutomationActions();
    } else {
      for (const timeline of this.timelines) {
        if (timeline.ref !== 'a_10000') {
          const action = {
            _id: timeline._id,
            action: timeline.action,
            condition: timeline.condition,
            automation: timeline.automation,
            id: timeline.ref,
            parent: timeline.parent_ref,
            period: timeline.period,
            status: timeline.status,
            watched_materials: timeline.watched_materials,
            created_at: timeline.created_at,
            updated_at: timeline.updated_at
          };
          this.actions.push(action);
        }
      }

      this.actions.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
      this.filterDealAutomationActions();
    }
  }

  filterContactAutomationActions(): void {
    // get automation actions.
    const automationTimelines =
      this.timelines.filter(
        (item) =>
          item.action &&
          item.action.type === 'automation' &&
          item.ref.indexOf('a_') < 0
      ) || [];

    for (const timeline of automationTimelines) {
      const actionIndex = this.actions.findIndex(
        (item) => item._id === timeline._id
      );
      if (actionIndex >= 0) {
        this.actions.splice(actionIndex, 1);
      }
    }

    // sort automation timeline
    if (automationTimelines.length > 1) {
      automationTimelines.sort((a, b) =>
        a.created_at < b.created_at ? -1 : 1
      );
    }

    const automationActions = [];
    //make automation actions from automation timeline
    if (automationTimelines.length > 0) {
      this.isInherited = true;
      let actionId = 20000;
      const nextId = '';
      for (let i = 0; i < automationTimelines.length; i++) {
        let automationAction;
        if (i === 0) {
          automationAction = {
            parent: 'a_10000',
            id: `a_${actionId}`,
            status: automationTimelines[i].status,
            action: automationTimelines[i].action,
            period: automationTimelines[i].period,
            timelines: this.timelines
          };
        } else {
          automationAction = {
            parent: `a_${actionId - 1}`,
            id: `a_${actionId}`,
            status: automationTimelines[i].status,
            action: automationTimelines[i].action,
            period: automationTimelines[i].period,
            timelines: this.timelines
          };
        }
        automationActions.push(automationAction);

        // reassign parent for prev automation to automation
        const rootIndex = this.actions.findIndex(
          (item) => item.parent === automationTimelines[i].action.automation_id
        );
        if (rootIndex >= 0) {
          this.actions[rootIndex].parent = `a_${actionId}`;
        }
        actionId++;
      }
    }
    this.actions = [...this.actions, ...automationActions];
  }

  filterDealAutomationActions(): void {
    const fakeAutomationActions =
      this.actions.filter(
        (item) =>
          item.action &&
          item.action.type === 'automation' &&
          item.action.automation_id === item.automation &&
          item.id.includes(item.automation)
      ) || [];

    // reorder parent
    for (const fakeAction of fakeAutomationActions) {
      const parent = fakeAction.parent;
      const childRootIndex = this.actions.findIndex(
        (item) => item.parent === fakeAction.id
      );
      if (childRootIndex >= 0) {
        this.actions[childRootIndex].parent = parent;
      }
    }

    // remove fake actions
    for (const fakeAction of fakeAutomationActions) {
      const fakeIndex = this.actions.findIndex(
        (item) => item._id === fakeAction._id
      );
      this.actions.splice(fakeIndex, 1);
    }

    // remark ids
    for (const action of this.actions) {
      const automationId = action.automation;
      if (automationId) {
        const newId = automationId.slice(-4);
        action.id = action.id.replace(automationId, newId);
        action.parent = action.parent.replace(automationId, newId);
      }
    }

    // if not exist root action, set root action.
    const rootIndex = this.actions.findIndex(
      (item) => item.parent === 'a_10000'
    );
    if (rootIndex < 0) {
      let rootAction = null;
      for (const action of this.actions) {
        const index = this.actions.findIndex(
          (item) => item.id === action.parent
        );
        if (index < 0) {
          rootAction = action;
          break;
        }
      }
      if (rootAction) {
        rootAction.parent = 'a_10000';
      }
    }
  }

  // filterActions(actions): any {
  //   //set timeline to automation actions.
  //   const automations =
  //     actions.filter((item) => item.action.type === 'automation') || [];
  //   if (automations.length > 0) {
  //     for (const action of automations) {
  //       action['timelines'] = this.timelines;
  //     }
  //   }
  //
  //   //get automation actions.
  //   const automationTimelines =
  //     this.timelines.filter(
  //       (item) =>
  //         item.action &&
  //         item.action.type === 'automation' &&
  //         item.ref.indexOf('a_') < 0
  //     ) || [];
  //
  //   //sort automation timeline
  //   if (automationTimelines.length > 1) {
  //     automationTimelines.sort((a, b) =>
  //       a.created_at < b.created_at ? -1 : 1
  //     );
  //   }
  //
  //   const automationActions = [];
  //   //make automation actions from automation timeline
  //   if (automationTimelines.length > 0) {
  //     this.isInherited = true;
  //     let actionId = 20000;
  //     for (let i = 0; i < automationTimelines.length; i++) {
  //       let automationAction;
  //       if (i === 0) {
  //         automationAction = {
  //           parent: 'a_10000',
  //           id: `a_${actionId}`,
  //           status: automationTimelines[i].status,
  //           action: automationTimelines[i].action,
  //           timelines: this.timelines
  //         };
  //       } else {
  //         automationAction = {
  //           parent: `a_${actionId - 1}`,
  //           id: `a_${actionId}`,
  //           status: automationTimelines[i].status,
  //           action: automationTimelines[i].action,
  //           timelines: this.timelines
  //         };
  //       }
  //       automationActions.push(automationAction);
  //       actionId++;
  //     }
  //
  //     // // remove automation action from loaded automation
  //     // if (this.automation.type !== 'deal') {
  //     //   const actionIndex = actions.findIndex((item) => item.action && item.action.type === 'automation');
  //     //   if (actionIndex >= 0) {
  //     //     actions.splice(actionIndex, 1);
  //     //   }
  //     // }
  //
  //     const rootIndex = actions.findIndex((item) => item.parent === 'a_10000');
  //     if (rootIndex >= 0) {
  //       actions[rootIndex].parent = `a_${actionId - 1}`;
  //     }
  //     for (const action of actions) {
  //       const itemId = `${action.id}_${this.automation_id}`;
  //       const index = this.timelines.findIndex((item) => item.ref === itemId);
  //       if (index >= 0) {
  //         action['status'] = this.timelines[index].status;
  //       }
  //     }
  //     const resultActions = [...automationActions, ...actions];
  //     return resultActions;
  //   }
  //   return actions;
  // }

  composeGraph(actions): void {
    let maxId = 1000;
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
    if (maxId > 1000) {
      maxId = 1000;
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
            node['voicemail'] = e.action.voicemail;
            node['automation_id'] = e.action.automation_id;
            node['timelines'] = e.timelines;
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
            node['period'] = e.period;
            node['error_message'] = e.error_message;
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
              status: e.status,
              error_message: e.error_message
            });
            edges.push({
              id: bTarget + '_' + target,
              source: bTarget,
              target: target,
              status: e.status,
              error_message: e.error_message
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
              status: e.status,
              error_message: e.error_message
            });
            edges.push({
              id: bTarget + '_' + target,
              source: bTarget,
              target: target,
              status: e.status,
              error_message: e.error_message
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
            node['voicemail'] = e.action.voicemail;
            node['automation_id'] = e.action.automation_id;
            node['timelines'] = e.timelines;
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
            node['error_message'] = e.error_message;
            node['period'] = e.period;
          }
          nodes.push(node);
          if (e.parent !== '0') {
            const source = e.parent;
            const target = e.id;
            edges.push({
              id: source + '_' + target,
              source,
              target,
              status: e.status,
              error_message: e.error_message
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
      //move to active node
      for (const node of this.nodes) {
        if (node.status === 'active') {
          this.panToNode$.next(node.id);
          break;
        }
      }

      this.autoCenter = false;
      this.autoZoom = false;
      this.center$.next(false);
    }, 500);
  }

  rebuildStatus(): void {
    for (const edge of this.edges) {
      if (edge.source !== 'a_10000') {
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

  easyView(node: any, origin: any, content: any): void {
    this.overlayService.open(
      origin,
      content,
      this.viewContainerRef,
      'automation',
      {
        data: node
      }
    );
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
    return true;
    // if (this.isInherited) {
    //   return true;
    // }
    // if (node && this.timelines.length > 0) {
    //   const index = this.timelines.findIndex((item) => item.ref === node.id);
    //   if (index >= 0) {
    //     return true;
    //   }
    // }
    // return false;
  }

  ICONS = {
    follow_up: AUTOMATION_ICONS.FOLLOWUP,
    update_follow_up: AUTOMATION_ICONS.UPDATE_FOLLOWUP,
    note: AUTOMATION_ICONS.CREATE_NOTE,
    text: AUTOMATION_ICONS.SEND_TEXT,
    email: AUTOMATION_ICONS.SEND_EMAIL,
    audio: AUTOMATION_ICONS.SEND_AUDIO,
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
