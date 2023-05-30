import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TagDeleteComponent } from './tag-delete.component';

describe('TagDeleteComponent', () => {
  let component: TagDeleteComponent;
  let fixture: ComponentFixture<TagDeleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TagDeleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TagDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
