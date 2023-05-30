import { Component, OnInit, OnDestroy } from '@angular/core';
import { DealsService } from 'src/app/services/deals.service';
import { MatDialog } from '@angular/material/dialog';
import { DealStage } from 'src/app/models/deal-stage.model';
import { DealStageCreateComponent } from 'src/app/components/deal-stage-create/deal-stage-create.component';
import { DealStageDeleteComponent } from 'src/app/components/deal-stage-delete/deal-stage-delete.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { NotifyComponent } from 'src/app/components/notify/notify.component';
import { STATUS } from 'src/app/constants/variable.constants';
import { Pipeline } from 'src/app/models/pipeline.model';

@Component({
  selector: 'app-deals-setting',
  templateUrl: './deals-setting.component.html',
  styleUrls: ['./deals-setting.component.scss']
})
export class DealsSettingComponent implements OnInit {
  stages: any[] = [];
  changeOrderSubscription: Subscription;
  updateSubscription: Subscription;
  originalStageDuration = 0;
  STATUS = STATUS;
  stageSubscription: Subscription;
  selectedPipelineSubscription: Subscription;

  constructor(
    private dialog: MatDialog,
    public dealsService: DealsService,
    private toastr: ToastrService
  ) {
    this.stageSubscription && this.stageSubscription.unsubscribe();
    this.stageSubscription = this.dealsService.stages$.subscribe((res) => {
      this.stages = res;
    });
    this.selectedPipelineSubscription &&
      this.selectedPipelineSubscription.unsubscribe();
    this.selectedPipelineSubscription = this.dealsService.selectedPipeline$.subscribe(
      (res) => {
        if (res)
          this.dealsService.easyLoadStage(
            true,
            this.dealsService.selectedPipeline.getValue()
          );
        else this.dealsService.loadStageStatus.next(STATUS.SUCCESS);
      }
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.stageSubscription && this.stageSubscription.unsubscribe();
    this.selectedPipelineSubscription &&
      this.selectedPipelineSubscription.unsubscribe();
  }

  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    const stageOrder = {};
    this.stages.forEach((e, index) => {
      stageOrder[e._id] = index;
    });

    this.changeOrderSubscription && this.changeOrderSubscription.unsubscribe();
    this.changeOrderSubscription = this.dealsService
      .changeStageOrder(stageOrder)
      .subscribe((res) => {});
  }

  moveDelete(id: string): void {
    const idx = this.stages.findIndex((item) => item._id === id);
    if (idx >= 0) {
      if (
        (this.stages[idx].deals && this.stages[idx].deals.length > 0) ||
        this.stages[idx].deals_count > 0
      ) {
        if (this.stages.length > 1) {
          // move deals and delete stage
          this.dialog
            .open(DealStageDeleteComponent, {
              position: { top: '100px' },
              width: '100vw',
              maxWidth: '550px',
              disableClose: true,
              data: {
                deleteId: id
              }
            })
            .afterClosed()
            .subscribe((res) => {
              if (res) {
                const deleted = this.stages.filter((stage) => stage._id == id);
                this.stages.forEach((stage) => {
                  if (stage._id == res) {
                    stage.deals = [...stage.deals, ...deleted[0].deals];
                    stage.deals_count += this.stages[idx].deals_count;
                  }
                });
                this.stages.some((e, index) => {
                  if (e._id === id) {
                    this.stages.splice(index, 1);
                  }
                });
              }
            });
        } else {
          this.dialog.open(NotifyComponent, {
            data: {
              message:
                'You can not remove this deal stage as this stage is the last stage.'
            }
          });
          // confirm delete deals and then delete stage
          // const dialog = this.dialog.open(ConfirmComponent, {
          //   data: {
          //     title: 'Delete deal(s)',
          //     message: 'Are you sure to delete the deals in this stage?',
          //     confirmLabel: 'Delete'
          //   }
          // });
          // dialog.afterClosed().subscribe((res) => {
          //   if (res) {
          //     this.toastr.success('Deal Stage successfully deleted.');
          //     this.dealsService.deleteStage(id, null).subscribe((response) => {
          //       if (response) {
          //         this.stages.splice(idx, 1);
          //       }
          //     });
          //   }
          // });
        }
      } else {
        this.dealsService.deleteStage(id, null).subscribe((res) => {
          if (res) {
            // this.toastr.success('Deal Stage successfully deleted.');
            this.stages.splice(idx, 1);
          }
        });
      }
    }
  }

  addStage(): void {
    this.dialog
      .open(DealStageCreateComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: {
          priority: this.stages.length
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          // this.toastr.success('Deal Stage successfully created.');
          this.dealsService.createStage$(new DealStage().deserialize(res));
        }
      });
  }

  saveDuration(stage: DealStage): void {
    this.updateSubscription && this.updateSubscription.unsubscribe();
    const request = {
      duration: stage.duration
    };
    this.updateSubscription = this.dealsService
      .updateStage(stage._id, request)
      .subscribe((res) => {
        if (res) {
          this.originalStageDuration = stage.duration;
          // this.toastr.success('', 'Deal Stage is updated successfully.', {
          //   closeButton: true
          // });
        }
      });
  }

  saveStage(stage): void {
    this.saveDuration(stage);
  }

  checkAndSave(event, stage): void {
    if (event.keyCode === 13) {
      this.saveDuration(stage);
    }
  }

  selectAutomation($event, stage: DealStage): void {
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.dealsService
      .updateStage(stage._id, {
        automation: $event
      })
      .subscribe((res) => {
        if (res) {
          // this.toastr.success('', 'Automation was assigned successfully.', {
          //   closeButton: true
          // });
        } else {
          // this.toastr.error('', 'Automation assign is failure.', {
          //   closeButton: true
          // });
        }
      });
  }

  onSelectPipeLine(pipeline: Pipeline): void {
    this.dealsService.updatePipeLine(pipeline._id, { is_active: true }).subscribe();
    pipeline.is_active = true;
    this.dealsService.selectedPipeline.next(pipeline);
  }
}
