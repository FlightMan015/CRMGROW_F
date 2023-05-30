import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-task-type',
  templateUrl: './task-type.component.html',
  styleUrls: ['./task-type.component.scss']
})
export class TaskTypeComponent implements OnInit {
  @Input() value: string;
  @Output() valueChange = new EventEmitter<string>();

  constructor() {}

  ngOnInit(): void {}

  updateValue(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
  }
}
