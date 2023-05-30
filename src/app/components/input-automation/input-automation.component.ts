import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  OnDestroy,
  Output,
  EventEmitter,
  AfterViewInit,
  TemplateRef,
  OnChanges
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, ReplaySubject } from 'rxjs';
import { MatSelect } from '@angular/material/select';
import {
  filter,
  tap,
  takeUntil,
  debounceTime,
  map,
  distinctUntilChanged
} from 'rxjs/operators';
import { AutomationService } from 'src/app/services/automation.service';
import { Automation } from 'src/app/models/automation.model';
import * as _ from 'lodash';
import { searchReg } from 'src/app/helper';
import { StoreService } from 'src/app/services/store.service';

@Component({
  selector: 'app-input-automation',
  templateUrl: './input-automation.component.html',
  styleUrls: ['./input-automation.component.scss']
})
export class InputAutomationComponent
  implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input('resultItem') resultItemTemplate: TemplateRef<HTMLElement>;
  @Input('placeholder') placeholder = 'Search automation';
  @Input('formPlaceholder') formPlaceholder = 'Search automations';

  @Input() id: string = '';
  @Output() idChange = new EventEmitter<string>();
  @Input() automation: Automation;
  @Input() excepted: Automation[];
  @Output() automationChange = new EventEmitter<Automation>();
  @Input() type: string = 'contact';

  formControl: FormControl = new FormControl();
  inputControl: FormControl = new FormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('selector') selector: MatSelect;

  protected _onDestroy = new Subject<void>();
  search = '';
  searching = false;
  filteredResults: ReplaySubject<Automation[]> = new ReplaySubject<
    Automation[]
  >(1);

  constructor(
    private automationService: AutomationService,
    public storeService: StoreService
  ) {
    // this.automationService.loadAll();
    this.automationService.loadOwn();
  }

  ngOnInit(): void {
    this.inputControl.valueChanges
      .pipe(
        filter(() => true),
        takeUntil(this._onDestroy),
        debounceTime(200),
        distinctUntilChanged(),
        tap(() => (this.searching = true)),
        map((search) => {
          this.search = search;
          return this.automationService.automations$;
        })
      )
      .subscribe(
        (data) => {
          data.subscribe((automations) => {
            if (automations && automations.length > 0) {
              const resultAutomations = [...automations];
              //except automations
              if (this.excepted && this.excepted.length > 0) {
                for (const exceptedItem of this.excepted) {
                  const index = resultAutomations.findIndex(
                    (item) => exceptedItem && item._id === exceptedItem._id
                  );
                  if (index >= 0) {
                    resultAutomations.splice(index, 1);
                  }
                }
              }
              const res = _.filter(resultAutomations, (e) => {
                return searchReg(e.title, this.search) && e.type === this.type;
              });
              this.searching = false;
              this.filteredResults.next(res);
            }
          });
        },
        () => {
          this.searching = false;
        }
      );

    this.formControl.valueChanges.subscribe((val) => {
      if (val && val._id !== this.id) {
        this.automationChange.emit(val);
        this.idChange.emit(val);
      }
    });

    this.automationService.automations$.subscribe((automations) => {
      const filtered = _.filter(automations, (e) => {
        return e.type === this.type;
      });

      this.filteredResults.next(filtered);

      if (this.id) {
        const filterAutomation = _.find(automations, (e) => {
          return this.id === e._id;
        });
        if (filterAutomation) {
          this.formControl.setValue(filterAutomation);
          this.automationChange.emit(filterAutomation);
        }
      }
    });

    // Init the Form Control with Two-bind Modal
    if (this.automation) {
      this.formControl.setValue(this.automation);
    }
    this.storeService.actionOutputData$.subscribe((res) => {
      if (res && res.type && res.type === 'automation') {
        _.filter(this.automationService.automations.getValue(), (e) => {
          return e._id === res.automation_id;
        }).map((automation) => {
          this.formControl.setValue(automation);
        });
      }
    });
  }

  ngAfterViewInit(): void {
    this.selector._positions = [
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top'
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom'
      }
    ];
  }

  ngOnChanges(changes): void {
    if (changes.automation) {
      this.formControl.setValue(changes.automation.currentValue);
    }
  }

  ngOnDestroy(): void {}

  remove(): void {
    this.formControl.setValue(null, { emitEvent: false });
    this.automationChange.emit(null);
  }
}
