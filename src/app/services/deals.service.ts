import { Injectable, Pipe } from '@angular/core';
import { BehaviorSubject, Observable, pipe, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpService } from './http.service';
import { ErrorService } from './error.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DEALSTAGE, DEAL, PIPELINE } from '../constants/api.constant';
import { STATUS } from '../constants/variable.constants';
import { DealStage } from '../models/deal-stage.model';
import { Deal } from '../models/deal.model';
import { Email } from '../models/email.model';
import { Note } from '../models/note.model';
import { Activity } from '../models/activity.model';
import { DetailActivity } from '../models/activityDetail.model';
import { Pipeline } from '../models/pipeline.model';
import { MapOperator } from 'rxjs/internal/operators/map';
import { Automation } from '../models/automation.model';
import { Timeline } from '../models/timeline.model';
import * as moment from 'moment';
import 'moment-timezone';

@Injectable({
  providedIn: 'root'
})
export class DealsService extends HttpService {
  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
  }
  stageIdArray: BehaviorSubject<string[]> = new BehaviorSubject([]);
  stageIdArray$ = this.stageIdArray.asObservable();
  pipeArray: Pipeline[] = [];
  selectedPipeline: BehaviorSubject<Pipeline> = new BehaviorSubject(null);
  selectedPipeline$ = this.selectedPipeline.asObservable();
  pipelines: BehaviorSubject<Pipeline[]> = new BehaviorSubject([]);
  pipelines$ = this.pipelines.asObservable();
  stages: BehaviorSubject<DealStage[]> = new BehaviorSubject([]);
  stages$ = this.stages.asObservable();
  stageSummaries: BehaviorSubject<DealStage[]> = new BehaviorSubject([]);
  stageSummaries$ = this.stageSummaries.asObservable();
  deals: BehaviorSubject<Deal[]> = new BehaviorSubject([]);
  deals$ = this.deals.asObservable();
  loadStageStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadingStage$ = this.loadStageStatus.asObservable();
  loadPipelineStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  loadingPipeline$ = this.loadPipelineStatus.asObservable();
  loadDealStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadingDeal$ = this.loadDealStatus.asObservable();
  stageContacts: BehaviorSubject<any> = new BehaviorSubject(null);
  stageContacts$ = this.stageContacts.asObservable();
  siblings: BehaviorSubject<any> = new BehaviorSubject(null);
  siblings$ = this.siblings.asObservable();
  timelines: BehaviorSubject<any[]> = new BehaviorSubject([]);
  timelines$ = this.timelines.asObservable();
  getStageSubscription: Subscription;

  getPipeLine(): Observable<Pipeline[]> {
    return this.httpClient.get(this.server + PIPELINE.GET).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Pipeline().deserialize(e))
      ),
      catchError(this.handleError('LOAD PIPELINES', null))
    );
  }

  easyGetPipeLine(force = false): void {
    if (!force) {
      const loadStatus = this.loadPipelineStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadPipelineStatus.next(STATUS.REQUEST);
    this.getPipeLine().subscribe((pipeLines) => {
      pipeLines
        ? this.loadPipelineStatus.next(STATUS.SUCCESS)
        : this.loadPipelineStatus.next(STATUS.FAILURE);
      this.pipelines.next(pipeLines);
      this.selectedPipeline.next(pipeLines[0]);
    });
  }

  createPipeLine(pipeline: Pipeline): Observable<any> {
    return this.httpClient.post(this.server + PIPELINE.GET, pipeline).pipe(
      map((res) => res),
      catchError(this.handleError('CREATE PIPELINE', null))
    );
  }

  updatePipeLine(id: string, data: any): Observable<any> {
    return this.httpClient.put(this.server + PIPELINE.EDIT + id, data).pipe(
      map((res) => res),
      catchError(this.handleError('UPDATE PIPELINE', null))
    );
  }

  deletePipeLine(id: string): Observable<any> {
    return this.httpClient.delete(this.server + PIPELINE.EDIT + id).pipe(
      map((res) => res),
      catchError(this.handleError('DELETE PIPELINE', null))
    );
  }

  easyLoad(force = false): void {
    if (!force) {
      const loadStatus = this.loadStageStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    // this.loadStageStatus.next(STATUS.REQUEST);
    this.easyLoadImpl().subscribe((dealStages) => {
      // dealStages
      //   ? this.loadStageStatus.next(STATUS.SUCCESS)
      //   : this.loadStageStatus.next(STATUS.FAILURE);
      dealStages.forEach((e) => {
        e.deals = [];
      });
      if (!this.stages.getValue() || !this.stages.getValue().length) {
        this.stages.next(dealStages || []);
        this.stageSummaries.next(dealStages || []);
      } else {
        this.stageSummaries.next(dealStages || []);
      }
    });
  }

  easyLoadImpl(): Observable<DealStage[]> {
    return this.httpClient.get(this.server + DEALSTAGE.EASY_LOAD).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new DealStage().deserialize(e))
      ),
      catchError(this.handleError('LOAD STAGES 3', null))
    );
  }

  /**
   * LOAD ALL DEAL STAGES
   * @param force Flag to load force
   */

  loadStage(pipeline: any): Observable<DealStage[]> {
    return this.httpClient.post(this.server + DEALSTAGE.LOAD, pipeline).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new DealStage().deserialize(e))
      ),
      catchError(this.handleError('LOAD STAGES 2', null))
    );
  }

  easyLoadStage(force = false, pipeline: any): void {
    if (!force) {
      const loadStatus = this.loadStageStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStageStatus.next(STATUS.REQUEST);
    this.loadStage(pipeline).subscribe((dealStages) => {
      dealStages
        ? this.loadStageStatus.next(STATUS.SUCCESS)
        : this.loadStageStatus.next(STATUS.FAILURE);
      this.stages.next(dealStages || []);
      this.stageIdArray.next([]);
      this.stages.forEach((next) => {
        next.forEach((element) => {
          const idArray = this.stageIdArray.getValue();
          idArray.push(element._id);
          this.stageIdArray.next(idArray);
        });
      });
    });
  }

  getStage(force = false): void {
    if (!force) {
      const loadStatus = this.loadStageStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStageStatus.next(STATUS.REQUEST);
    this.getStageSubscription && this.getStageSubscription.unsubscribe();
    this.getStageSubscription = this.getStageImpl().subscribe((dealStages) => {
      dealStages
        ? this.loadStageStatus.next(STATUS.SUCCESS)
        : this.loadStageStatus.next(STATUS.FAILURE);
      this.stages.next(dealStages || []);
      this.stages.forEach((next) => {
        next.forEach((element) => {
          const idArray = this.stageIdArray.getValue();
          idArray.push(element._id);
          this.stageIdArray.next(idArray);
        });
      });
    });
  }

  getStageImpl(): Observable<DealStage[]> {
    return this.httpClient.get(this.server + DEALSTAGE.GET).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new DealStage().deserialize(e))
      ),
      catchError(this.handleError('LOAD STAGES 1', null))
    );
  }

  createStage(stage: any): Observable<any> {
    return this.httpClient.post(this.server + DEALSTAGE.GET, stage).pipe(
      map((res) => res['data']),
      catchError(this.handleError('CREATE STAGE', null))
    );
  }

  createStage$(stage: DealStage): void {
    const stages = this.stages.getValue();
    stages.push(stage);
    this.stages.next(stages);
    this.stages.forEach((next) => {
      next.forEach((element) => {
        const idArray = this.stageIdArray.getValue();
        idArray.push(element._id);
        this.stageIdArray.next(idArray);
      });
    });
  }

  deleteStage(sourceId: string, targetId: string): any {
    return this.httpClient
      .post(this.server + DEALSTAGE.DELETE, {
        remove_stage: sourceId,
        move_stage: targetId
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('STAGE REMOVE', false))
      );
  }

  updateStage(id: string, data: any): any {
    return this.httpClient.put(this.server + DEALSTAGE.EDIT + id, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('UPDATE DEAL STAGE', false))
    );
  }

  changeStageOrder(data: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + DEALSTAGE.CHANGE_ORDER, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('CHANGE ORDER', false))
      );
  }

  getDeal(id: string): Observable<any> {
    return this.httpClient.get(this.server + DEAL.GET + id).pipe(
      map((res) => res['data']),
      catchError(this.handleError('GET DEAL', null))
    );
  }

  editDeal(id: string, deal: any): any {
    return this.httpClient.put(this.server + DEAL.GET + id, deal).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('Edit DEAL', null))
    );
  }

  updateContact(
    dealId: string,
    action: string,
    ids: string[],
    deleteAllData: boolean = true
  ): Observable<boolean> {
    return this.httpClient
      .post(this.server + DEAL.UPDATE_CONTACT + dealId, {
        action,
        contacts: ids,
        deleteAllDealData: deleteAllData
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('EDIT DEAL CONTACTS', false))
      );
  }

  createDeal(deal: any): any {
    return this.httpClient
      .post(this.server + DEAL.GET, deal)
      .pipe(catchError(this.handleError('DEAL CREATE', null)));
  }

  deleteDeal(deal: string): Observable<boolean> {
    return this.httpClient.delete(this.server + DEAL.GET + deal).pipe(
      map((res) => !!res['status']),
      catchError(this.handleError('DELETE DEAL', false))
    );
  }

  deleteOnlyDeal(deal: string): Observable<boolean> {
    return this.httpClient.delete(this.server + DEAL.ONLY_DEAL + deal).pipe(
      map((res) => !!res['status']),
      catchError(this.handleError('DELETE DEAL', false))
    );
  }

  moveDeal(data: any): any {
    return this.httpClient.post(this.server + DEAL.MOVE, data);
  }

  clear$(): void {
    this.loadStageStatus.next(STATUS.NONE);
    this.loadDealStatus.next(STATUS.NONE);
    this.stages.next([]);
    this.stageIdArray.next([]);
    this.deals.next([]);
    this.pipelines.next([]);
  }

  addNote(data: any): Observable<any> {
    const reqHeader = new HttpHeaders({
      'No-Content': 'True'
    });
    return this.httpClient
      .post(this.server + DEAL.ADD_NOTE, data, {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('ADD DEAL NOTE', []))
      );
  }

  editNote(data: any): Observable<boolean> {
    const reqHeader = new HttpHeaders({
      'No-Content': 'True'
    });
    return this.httpClient
      .post(this.server + DEAL.EDIT_NOTE, data, {
        headers: reqHeader
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('EDIT DEAL NOTE', false))
      );
  }

  removeNote(data: any): Observable<boolean> {
    return this.httpClient.post(this.server + DEAL.REMOVE_NOTE, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('REMOVE DEAL NOTE', false))
    );
  }

  getNotes(data: any): Observable<Note[]> {
    return this.httpClient.post(this.server + DEAL.GET_NOTES, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET DEAL NOTE', []))
    );
  }

  sendEmail(data: any): Observable<any> {
    return this.httpClient.post(this.server + DEAL.SEND_EMAIL, data).pipe(
      map((res) => res),
      catchError(this.handleError('DEAL SEND EMAIL', [], true))
    );
  }

  getEmails(data: any): Observable<Email[]> {
    return this.httpClient.post(this.server + DEAL.GET_EMAILS, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET DEAL EMAILS', []))
    );
  }

  addFollowUp(data: any): Observable<any> {
    if (!data.timezone) {
      data.timezone = moment.tz.guess();
    }
    return this.httpClient.post(this.server + DEAL.ADD_FOLLOWUP, data).pipe(
      map((res) => res),
      catchError(this.handleError('ADD DEAL FOLLOWUP', []))
    );
  }

  editFollowUp(data: any): Observable<boolean> {
    if (!data.timezone) {
      data.timezone = moment.tz.guess();
    }
    return this.httpClient.post(this.server + DEAL.EDIT_FOLLOWUP, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('EDIT DEAL FOLLOWUP', false))
    );
  }

  completeFollowUp(data: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + DEAL.COMPLETE_FOLLOWUP, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('COMPLETE DEAL FOLLOWUP', false))
      );
  }

  removeFollowUp(data: any): Observable<boolean> {
    return this.httpClient.post(this.server + DEAL.REMOVE_FOLLOWUP, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('REMOVE DEAL FOLLOWUP', false))
    );
  }

  getFollowUp(data: any): Observable<any[]> {
    return this.httpClient.post(this.server + DEAL.GET_FOLLOWUP, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET DEAL FOLLOWUP', []))
    );
  }

  getActivity(data: any): Observable<DetailActivity[]> {
    return this.httpClient.post(this.server + DEAL.GET_ACTIVITY, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET DEAL ACTIVITY', []))
    );
  }

  addAppointment(data: any): Observable<any> {
    return this.httpClient.post(this.server + DEAL.ADD_APPOINTMENT, data).pipe(
      map((res) => res),
      catchError(this.handleError('ADD DEAL APPOINTMENT', []))
    );
  }

  updateAppointment(data: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + DEAL.UPDATE_APPOINTMENT, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('REMOVE DEAL APPOINTMENT', false))
      );
  }

  removeAppointment(data: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + DEAL.REMOVE_APPOINTMENT, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('REMOVE DEAL APPOINTMENT', false))
      );
  }

  getAppointments(data: any): Observable<any[]> {
    return this.httpClient.post(this.server + DEAL.GET_APPOINTMENT, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET DEAL APPOINTMENT', []))
    );
  }

  addGroupCall(data: any): Observable<any> {
    return this.httpClient.post(this.server + DEAL.ADD_GROUP_CALL, data).pipe(
      map((res) => res),
      catchError(this.handleError('ADD DEAL GROUP CALL', []))
    );
  }

  getGroupCalls(data: any): Observable<any[]> {
    return this.httpClient.post(this.server + DEAL.GET_GROUP_CALL, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET DEAL GROUP CALL', []))
    );
  }

  updateGroupCall(data: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + DEAL.UPDAGE_GROUP_CALL, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('EDIT DEAL GROUP CALL', false))
      );
  }

  removeGroupCall(data: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + DEAL.REMOVE_GROUP_CALL, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('REMOVE DEAL GROUP CALL', false))
      );
  }

  sendText(data: any): Observable<any> {
    return this.httpClient.post(this.server + DEAL.SEND_TEXT, data).pipe(
      map((res) => res),
      catchError(this.handleError('SEND DEAL TEXT', false, true))
    );
  }

  getStageWithContactImpl(): Observable<any> {
    return this.httpClient.get(this.server + DEALSTAGE.WITHCONTACT).pipe(
      map((res) => {
        return res['data'];
      }),
      catchError(this.handleError('GET STAGE WITH CONTACT', []))
    );
  }

  getMaterialActivity(activity_id): Observable<any> {
    return this.httpClient
      .get(this.server + DEAL.MATERIAL_ACTIVITY + activity_id)
      .pipe(
        map((res) => {
          return res['data'];
        }),
        catchError(this.handleError('GET MATERAIL ACTIVITY', []))
      );
  }

  getTimeLines(deal_id): Observable<any> {
    return this.httpClient.get(this.server + DEAL.GET_TIMELINES + deal_id).pipe(
      map((res) => {
        return res['data'];
      }),
      catchError(this.handleError('GET DEAL TIMELINES', []))
    );
  }

  getAllTimeLines(): Observable<any> {
    return this.httpClient.get(this.server + DEAL.GET_All_TIMELINES).pipe(
      map((res) => {
        return res['data'];
      }),
      catchError(this.handleError('GET ALL TIMELINES', []))
    );
  }

  bulkCreate(data: any): Observable<any> {
    return this.httpClient.post(this.server + DEAL.BULK_CREATE, data).pipe(
      map((res) => res),
      catchError(this.handleError('BULK CREATE DEAL', false, true))
    );
  }

  setPrimaryContact(deal_id, contact_id): Observable<boolean> {
    return this.httpClient
      .post(this.server + DEAL.SET_PRIMARY_CONTACT, {
        deal_id,
        contact_id
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('SET PRIMARY CONTACT', false))
      );
  }

  getSiblings(deal_id: string) {
    this.getSiblingsImpl(deal_id).subscribe((res) => {
      this.siblings.next({ ...res, current: deal_id });
    });
  }

  getSiblingsImpl(deal_id: string): Observable<any> {
    return this.httpClient.get(this.server + DEAL.GET_SIBLINGS + deal_id).pipe(
      map((res) => {
        return res;
      }),
      catchError(this.handleError('GET DEAL SIBLINGS', null))
    );
  }
  getStageWithContact(force = false): void {
    this.getStageWithContactImpl().subscribe((stages) => {
      if (stages) {
        const stageContactsMap = {};
        stages.forEach((e) => {
          if (e.contactIds && e.contactIds) {
            e.contactIds.forEach((_c) => {
              if (stageContactsMap[_c]) {
                stageContactsMap[_c].push(e.title);
              } else {
                stageContactsMap[_c] = [e.title];
              }
            });
          }
        });
        this.stageContacts.next(stageContactsMap);
      }
    });
  }
}
function subscribe(arg0: (pipeLines: any) => void) {
  throw new Error('Function not implemented.');
}
