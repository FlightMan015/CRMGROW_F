import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialEditTemplateComponent } from './material-edit-template.component';

describe('MaterialEditTemplateComponent', () => {
  let component: MaterialEditTemplateComponent;
  let fixture: ComponentFixture<MaterialEditTemplateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MaterialEditTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialEditTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
