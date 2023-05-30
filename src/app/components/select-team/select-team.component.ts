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
  TemplateRef
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ContactService } from 'src/app/services/contact.service';
import { TeamService } from '../../services/team.service';
import { Team } from '../../models/team.model';
import { Subject, ReplaySubject } from 'rxjs';
import { Contact } from 'src/app/models/contact.model';
import { MatSelect } from '@angular/material/select';
import {
  filter,
  tap,
  takeUntil,
  debounceTime,
  map,
  distinctUntilChanged
} from 'rxjs/operators';

@Component({
  selector: 'app-select-team',
  templateUrl: './select-team.component.html',
  styleUrls: ['./select-team.component.scss']
})
export class SelectTeamComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input('resultItem') resultItemTemplate: TemplateRef<HTMLElement>;
  @Input('placeholder') placeholder = 'Select team';
  @Input('formPlaceholder') formPlaceholder = 'Search team';
  @Input('mustField') mustField = '';
  @Input()
  public set team(val: string) {
    if (!val) {
      this.formControl.setValue(null, { emitEvent: false });
    }
  }
  @Output() onSelect = new EventEmitter();
  formControl: FormControl = new FormControl();
  inputControl: FormControl = new FormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('selector') selector: MatSelect;

  protected _onDestroy = new Subject<void>();
  searching = false;
  filteredResults: ReplaySubject<Team[]> = new ReplaySubject<Team[]>(1);
  teams;
  constructor(private teamService: TeamService) {}

  ngOnInit(): void {
    // this.teamService.loadAllImpl().subscribe((res) => {
    //   if (res) {
    //     this.filteredResults.next(res);
    //     this.teams = res;
    //   }
    // });

    this.teamService.teams.subscribe((res) => {
      if (res) {
        this.filteredResults.next(res);
        this.teams = res;
      }
    });

    this.inputControl.valueChanges.subscribe((search) => {
      if (search) {
        const teams = [];
        for (const team of this.teams) {
          if (team.name && team.name.indexOf(search) >= 0) {
            const index = this.teams.findIndex((item) => item._id === team._id);
            if (index < 0) {
              teams.push(team);
            }
          }
        }
        this.filteredResults.next(teams);
      } else {
        this.filteredResults.next(this.teams);
      }
    });

    this.formControl.valueChanges.subscribe((val) => {
      this.onSelect.emit(val);
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

  ngOnDestroy(): void {}

  cancelSelect(): void {
    this.formControl.setValue(null, { emitEvent: false });
    this.onSelect.emit(null);
  }

  clear(): void {
    this.formControl.setValue(null, { emitEvent: false });
  }
}
