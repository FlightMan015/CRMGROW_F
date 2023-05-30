import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-intro-modal',
  templateUrl: './intro-modal.component.html',
  styleUrls: ['./intro-modal.component.scss']
})
export class IntroModalComponent implements OnInit {
  step = 1;
  constructor() {}

  ngOnInit(): void {}

  nextStep(): void {
    this.step++;
  }
}
