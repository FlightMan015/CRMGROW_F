import { Component, Input, OnInit, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.scss']
})
export class AccordionComponent implements OnInit {
  @Input('detail') detailTemplate: TemplateRef<HTMLElement>;
  @Input('showIndicator') showIndicator: TemplateRef<HTMLElement>;
  @Input('hideIndicator') hideIndicator: TemplateRef<HTMLElement>;
  @Input() showText: string = '';
  @Input() hideText: string = '';
  constructor() {}

  ngOnInit(): void {}
}
