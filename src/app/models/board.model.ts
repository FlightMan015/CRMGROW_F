import { DealStage } from './deal-stage.model';

export class Board {
  constructor(public name: string, public dealStages: DealStage[]) {}
}
