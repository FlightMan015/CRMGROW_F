import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router } from '@angular/router';
import { DealsService } from 'src/app/services/deals.service';
import { MatDialog } from '@angular/material/dialog';
import { DealCreateComponent } from 'src/app/components/deal-create/deal-create.component';
import { DealTimeDurationComponent } from 'src/app/components/deal-time-duration/deal-time-duration.component';
import { DealAutomationComponent } from 'src/app/components/deal-automation/deal-automation.component';
import { DialogSettings, STATUS } from 'src/app/constants/variable.constants';
import { DealStage } from 'src/app/models/deal-stage.model';
import { Deal } from 'src/app/models/deal.model';
import { DealStageCreateComponent } from 'src/app/components/deal-stage-create/deal-stage-create.component';
import { Subscription } from 'rxjs';
import { Pipeline } from 'src/app/models/pipeline.model';
import { DealStageUpdateComponent } from 'src/app/components/deal-stage-update/deal-stage-update.component';
import { PipelineCreateComponent } from 'src/app/components/pipeline-create/pipeline-create.component';
import { PipelineRenameComponent } from 'src/app/components/pipeline-rename/pipeline-rename.component';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { DeletePipelineComponent } from 'src/app/components/delete-pipeline/delete-pipeline.component';
import { ToastrService } from 'ngx-toastr';
import {
  DEFAULT_PIPELINE,
  DEFAULT_STAGES
} from 'src/app/constants/variable.constants';

@Component({
  selector: 'app-deals',
  templateUrl: './deals.component.html',
  styleUrls: ['./deals.component.scss']
})
export class DealsComponent implements OnInit, OnDestroy {
  STATUS = STATUS;
  // loadSubscription: Subscription;
  onClickCreatePipe: boolean = false;
  pipelines: Pipeline[] = [];
  dealstages: DealStage[] = [];
  editStageState: boolean = false;
  tempArray: DealStage[] = [];
  selectedPipelineSubscription: any;
  dropState: boolean = false;
  selectedPipelineTitle: string = '';
  loadStageSubscription: Subscription;
  pipelinesSubscription: Subscription;
  routeSubscription: Subscription;
  routeUrlSubscription: Subscription;
  searchStageID: string;
  pipelineID: string;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    public dealsService: DealsService,
    private toastr: ToastrService
  ) {
    let pipelineRouteIndex;
    let stageRouteIndex;

    this.routeUrlSubscription && this.routeUrlSubscription.unsubscribe();
    this.routeUrlSubscription = this.route.url.subscribe((url) => {
      pipelineRouteIndex = url.findIndex((e) => e.path == 'pipeline');
      stageRouteIndex = url.findIndex((e) => e.path == 'stage');

      this.routeSubscription && this.routeSubscription.unsubscribe();
      this.routeSubscription = this.route.params.subscribe((params) => {
        if (stageRouteIndex != -1) this.searchStageID = params['id'];
        if (pipelineRouteIndex != -1) {
          this.pipelineID = params['id'];
          const routePipeline = this.dealsService.pipelines
            .getValue()
            .find((e) => e._id == this.pipelineID);
          this.dealsService.updatePipeLine(routePipeline._id, { is_active: true }).subscribe();
          this.dealsService.selectedPipeline.next(routePipeline);
        }
      });
    });

    if (this.dealsService.pipelines.getValue().length == 0) {
      this.dealsService.loadStageStatus.next(STATUS.REQUEST);
      this.dealsService.getPipeLine().subscribe((pipelines) => {
        if (pipelines.length == 0) {
          const pipeline = new Pipeline();
          pipeline.title = DEFAULT_PIPELINE;
          pipeline.is_active = true;
          this.dealsService.createPipeLine(pipeline).subscribe((res) => {
            if (res.status) {
              const defaultPipelineId = res.pipeline._id;
              this.dealsService.pipelines.next([res.pipeline]);
              this.dealsService.selectedPipeline.next(res.pipeline);
              const stages = [];
              for (let i = 0; i < DEFAULT_STAGES.length; i++) {
                const data = {
                  title: DEFAULT_STAGES[i],
                  deals: [],
                  priority: i,
                  deals_count: 0,
                  duration: 0,
                  pipe_line: defaultPipelineId
                };
                stages.push(new DealStage().deserialize(data));
                this.dealsService
                  .createStage(new DealStage().deserialize(data))
                  .subscribe((res) => {
                    if (res) {
                    }
                    if (i == DEFAULT_STAGES.length - 1) {
                      this.dealsService.loadStageStatus.next(STATUS.SUCCESS);
                      this.dealsService.stages.next(stages);
                    }
                  });
              }
            } else {
              this.dealsService.loadStageStatus.next(STATUS.FAILURE);
            }
          });
        } else {
          this.dealsService.pipelines.next(pipelines);
          const activePipeline = pipelines.find((e) => e.is_active == true);
          if (activePipeline) {
            this.dealsService.selectedPipeline.next(activePipeline);
          } else {
            this.dealsService.selectedPipeline.next(pipelines[0]);
            this.dealsService
              .updatePipeLine(pipelines[0]._id, {
                is_active: true
              })
              .subscribe();
          }
        }
        this.selectedPipelineSubscription &&
          this.selectedPipelineSubscription.unsubscribe();
        this.selectedPipelineSubscription = this.dealsService.selectedPipeline$.subscribe(
          (res) => {
            if (res) {
              this.selectedPipelineTitle = res.title;
              this.dealsService.easyLoadStage(
                true,
                this.dealsService.selectedPipeline.getValue()
              );
            } else {
              this.dealsService.stages.next([]);
              this.selectedPipelineTitle = '';
            }
          }
        );
      });
    } else {
      this.selectedPipelineSubscription &&
        this.selectedPipelineSubscription.unsubscribe();
      this.selectedPipelineSubscription = this.dealsService.selectedPipeline$.subscribe(
        (res) => {
          if (res) {
            this.selectedPipelineTitle = res.title;
            this.dealsService.easyLoadStage(
              true,
              this.dealsService.selectedPipeline.getValue()
            );
          } else {
            this.dealsService.stages.next([]);
            this.selectedPipelineTitle = '';
          }
        }
      );
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    // this.loadSubscription && this.loadSubscription.unsubscribe();
    this.selectedPipelineSubscription &&
      this.selectedPipelineSubscription.unsubscribe();
    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.routeUrlSubscription && this.routeUrlSubscription.unsubscribe();
  }

  deletePipeline(): void {
    const selPipeline = this.dealsService.selectedPipeline.getValue();
    const subStages = this.dealsService.stages.getValue();
    let subDeals: Deal[] = [];
    for (let i = 0; i < subStages.length; i++) {
      if (subStages[i].deals_count > 0)
        subDeals = [...subDeals, ...subStages[i].deals];
    }
    console.log('subdeals', subDeals);
    if (subDeals.length == 0) {
      const pipelineConfirmDialog = this.dialog.open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Delete Pipeline',
          message: 'Are you sure to delete this pipeline?',
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
          pipeline: selPipeline,
          stages: subStages
        }
      });
      pipelineConfirmDialog.afterClosed().subscribe((res) => {
        if (res) {
          this.dealsService.deletePipeLine(selPipeline._id).subscribe((res) => {
            if (res.status) {
              const tempPipeArray = this.dealsService.pipelines.getValue();
              const delPipeIndex = tempPipeArray.findIndex(
                (e) => e._id == selPipeline._id
              );
              tempPipeArray.splice(delPipeIndex, 1);
              tempPipeArray[0].is_active = true;
              this.dealsService.pipelines.next(tempPipeArray);
              this.dealsService.selectedPipeline.next(tempPipeArray[0]);
              this.dealsService.updatePipeLine(tempPipeArray[0]._id, {
                is_active: true
              }).subscribe();
              // this.toastr.success('Pipeline has been successfully deleted.');
            }
          });
        }
      });
    } else {
      this.dialog
        .open(DeletePipelineComponent, {
          position: { top: '100px' },
          width: '100vw',
          maxWidth: '400px',
          data: {
            pipeline: selPipeline,
            stages: subStages,
            deals: subDeals
          }
        })
        .afterClosed()
        .subscribe(() => {});
    }
  }

  onClickCreatePipeLine(): void {
    this.dialog
      .open(PipelineCreateComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const pipeline = new Pipeline();
          pipeline.title = res.title;
          pipeline.is_active = true;
          this.dealsService.createPipeLine(pipeline).subscribe((res1) => {
            if (res1?.status) {
              const pipelineArray = this.dealsService.pipelines.getValue();
              pipelineArray.push(res1.pipeline);
              this.dealsService.selectedPipeline.next(res1.pipeline);
              this.dealsService.pipelines.next(pipelineArray);
              this.onClickCreatePipe = true;
              this.editStageState = false;
              this.dealsService.stages.next([]);
            }
          });
        }
      });
  }

  onClickUpdatePipeLineName(): void {
    this.dialog
      .open(PipelineRenameComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: {
          title: this.selectedPipelineTitle
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const pipeId = this.dealsService.selectedPipeline.getValue()._id;
          const pipearray = this.dealsService.pipelines.getValue();
          pipearray.find((e) => e._id == pipeId).title = res.title;
          this.dealsService.pipelines.next(pipearray);

          const pipeline = this.dealsService.selectedPipeline.getValue();
          pipeline.title = res.title;
          this.dealsService.selectedPipeline.next(pipeline);
        }
      });
  }

  onSavePipeLine(): void {
    this.editStageState = false;
    this.createPipeLine();
  }

  createPipeLine(): void {
    this.onClickCreatePipe = false;
  }

  editPipeLine(): void {
    if (this.dropState) {
      this.dropState = false;
      const dealstageArray = this.dealsService.stages.getValue();
      for (let i = 0; i < dealstageArray.length; i++) {
        dealstageArray[i].priority = i;
        this.dealsService
          .updateStage(dealstageArray[i]._id, dealstageArray[i])
          .subscribe((res2) => {
            if (i == dealstageArray.length - 1) {
              if (res2) this.dealsService.loadStageStatus.next(STATUS.SUCCESS);
              else this.dealsService.loadStageStatus.next(STATUS.FAILURE);
            }
          });
      }
    } else {
      this.dealsService.loadStageStatus.next(STATUS.SUCCESS);
    }
  }

  editStages(): void {
    this.editStageState = true;
    this.onClickCreatePipe = false;
  }

  saveStages(): void {
    this.editStageState = false;
    this.editPipeLine();
  }

  onSelectPipeLine(pipeline: Pipeline): void {
    this.searchStageID = '';
    this.dealsService.updatePipeLine(pipeline._id, { is_active: true }).subscribe();
    this.dealsService.selectedPipeline.next(pipeline);
    // this.dealsService.easyLoadStage(
    //   true,
    //   this.dealsService.selectedPipeline.getValue()
    // );
  }

  dropstage(event: CdkDragDrop<DealStage[]>): void {
    this.dropState = true;
    if (this.editStageState || this.onClickCreatePipe) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.dealsService.stages.next(event.container.data);
    }
  }

  drop(event: CdkDragDrop<string[]>, id: string): void {
    const data = {
      deal_id: event.previousContainer.data[event.previousIndex]['_id'],
      position: event.currentIndex,
      deal_stage_id: id
    };
    const deal = event.previousContainer.data[event.previousIndex];
    const stages = this.dealsService.stages.getValue();
    if (deal['deal_stage'] !== id) {
      if (
        stages
          .find((e) => e._id == deal['deal_stage'])
          .deals.find((e) => e._id == data.deal_id) &&
        stages
          .find((e) => e._id == deal['deal_stage'])
          .deals.find((e) => e._id == data.deal_id).put_at
      )
        stages
          .find((e) => e._id == deal['deal_stage'])
          .deals.find((e) => e._id == data.deal_id).put_at = new Date();

      if (stages.find((e) => e._id == id).automation) {
        const tempDeal = {
          ...stages
            .find((e) => e._id == deal['deal_stage'])
            .deals.find((e) => e._id == data.deal_id),
          running_automation: true
        };
        const index = stages
          .find((e) => e._id == deal['deal_stage'])
          .deals.findIndex((e) => e._id == data.deal_id);

        stages
          .find((e) => e._id == deal['deal_stage'])
          .deals.splice(index, 1, new Deal().deserialize(tempDeal));
      }
    }
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    if (deal['deal_stage'] !== id) {
      const sourceStage = stages.filter(
        (stage) => stage._id === deal['deal_stage']
      )[0];
      const targetStage = stages.filter((stage) => stage._id === id)[0];
      stages.find((stage) => stage._id === deal['deal_stage']).deals_count = sourceStage.deals.length;
      stages.find((stage) => stage._id === id).deals_count = targetStage.deals.length;

      stages
        .find((e) => e._id == id)
        .deals.find((e) => e._id == data.deal_id).deal_stage = id;
      this.dealsService.stages.next(stages);
    }

    this.dealsService.moveDeal(data).subscribe(() => {});
  }
  automation(automation: any, arg1: null, arg2: any[]) {
    throw new Error('Method not implemented.');
  }

  dealDetail(id: string): void {
    this.router.navigate([`./deals/${id}`]);
  }

  getArray(stageID: string): string[] {
    const stageIDArray = this.dealsService.stageIdArray.getValue();
    return stageIDArray.filter((e) => e !== stageID);
  }

  addStages(): void {
    const currentStages = this.dealsService.stages.getValue();
    const priorityArray: number[] = [];
    for (let i = 0; i < currentStages.length; i++) {
      priorityArray.push(currentStages[i].priority);
    }
    let maxPriority = 0;
    if (priorityArray.length > 0)
      maxPriority = Math.max.apply(null, priorityArray);
    console.log(priorityArray);
    this.dialog
      .open(DealStageCreateComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: {
          priority: maxPriority + 1
        }
      })
      .afterClosed()
      .subscribe((res) => {
        this.editStageState = true;
        if (res) {
          this.dealsService.createStage$(new DealStage().deserialize(res));
        }
      });
  }

  addDeals(dealStage: any): void {
    this.dialog
      .open(DealCreateComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          id: dealStage._id
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.dealsService
            .loadStage(this.dealsService.selectedPipeline.getValue())
            .subscribe((res) => {
              this.dealsService.stages.next(res || []);
            });
        }
      });
  }

  addNewDeal(): void {
    this.dialog
      .open(DealCreateComponent, DialogSettings.DEAL)
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.dealsService
            .loadStage(this.dealsService.selectedPipeline.getValue())
            .subscribe((res) => {
              this.dealsService.stages.next(res || []);
            });
        }
      });
  }

  getAvatarName(contact: any): string {
    if (contact) {
      if (contact.first_name && contact.last_name) {
        return contact.first_name[0] + contact.last_name[0];
      } else if (contact.first_name) {
        return contact.first_name.substring(0, 2);
      } else if (contact.last_name) {
        return contact.last_name.substring(0, 2);
      } else {
        return 'UN';
      }
    }
  }

  getColor(value) {
    const hue = ((1 - value) * 120).toString(10);
    return ['hsl(', hue, ', 90%, 40%)'].join('');
  }

  getStatus(deal: Deal, duration: number): any {
    if (duration === undefined || duration === 0 || !deal.put_at) {
      return '#000';
    }
    const put_at = new Date(deal.put_at);
    const now = new Date();
    const diff = Math.abs(now.getTime() - put_at.getTime());
    const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    const rate = diffDays / duration;
    if (rate >= 1) {
      return '#C10A0A';
    }
    return this.getColor(rate);
  }

  getColor1(value) {
    const hue = ((1 - value) * 120).toString(10);
    return ['hsl(', hue, ', 100%, 50%)'].join('');
  }

  getStatus1(deal: Deal, duration: number): any {
    if (duration === undefined || duration === 0 || !deal.put_at) {
      return '#969696';
    }
    const put_at = new Date(deal.put_at);
    const now = new Date();
    const diff = Math.abs(now.getTime() - put_at.getTime());
    const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    const rate = diffDays / duration;
    if (rate >= 1) {
      return '#FF8A8A';
    }
    return this.getColor1(rate);
  }

  getDurationDate(deal: Deal, duration: number): any {
    const put_at = new Date(deal.put_at);
    const last_date = new Date(put_at.getTime() + duration * 3600 * 24 * 1000);
    const start_date = (put_at.getMonth() + 1).toString() + '/' + put_at.getDate().toString() + '/' + put_at.getFullYear().toString();
    const end_date = (last_date.getMonth() + 1).toString() + '/' + last_date.getDate().toString() + '/' + last_date.getFullYear().toString();
    const data = start_date + '~' + end_date;
    return data;
  }

  getLeftDays(deal: Deal, duration: number): any {
    const put_at = new Date(deal.put_at);
    const now = new Date();
    const diff = Math.abs(now.getTime() - put_at.getTime());
    const diffDays = Math.round(diff / (1000 * 3600 * 24));
    const diffDuration = duration - diffDays;
    if (diffDuration <= 0) return 'expired';
    if (diffDuration == 1) return diffDuration + 'day left';
    if (diffDuration > 1) return diffDuration + 'days left';
  }

  rename(dealStage: DealStage): void {
    this.dialog
      .open(DealStageUpdateComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: { stage: dealStage }
      })
      .afterClosed()
      .subscribe((res) => {});
  }

  setTimeDuration(dealStage: any): void {
    this.dialog
      .open(DealTimeDurationComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          id: dealStage._id,
          duration: dealStage.duration
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res >= 0) {
          const stageArray = this.dealsService.stages.getValue();
          stageArray.find((obj) => obj._id == dealStage._id).duration = res;
          this.dealsService.stages.next(stageArray);
        }
      });
  }

  assignAutomation(dealStage: any): void {
    this.dialog
      .open(DealAutomationComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          dealStage: dealStage
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res !== 'confirm-no') {
          const dealstages = this.dealsService.stages.getValue();
          const selectedStage = dealstages.find((e) => e._id == dealStage._id);
          if (res !== 'detach') {
            for (let i = 0; i < selectedStage.deals_count; i++) {
              // dealstages.find((e) => e._id == dealStage._id).deals[i].running_automation = true;
              const tempDeal = {
                ...selectedStage.deals[i],
                running_automation: true
              };
              dealstages
                .find((e) => e._id == dealStage._id)
                .deals.splice(i, 1, new Deal().deserialize(tempDeal));
            }
          } else {
            for (let i = 0; i < selectedStage.deals_count; i++) {
              const tempDeal = dealstages.find((e) => e._id == dealStage._id).deals[i];
              if (tempDeal['running_automation']) {
                delete tempDeal['running_automation'];
              }
              dealstages
                .find((e) => e._id == dealStage._id)
                .deals.splice(i, 1, new Deal().deserialize(tempDeal));
            }
          }
          this.dealsService.stages.next(dealstages);
        }
      });
  }
}
