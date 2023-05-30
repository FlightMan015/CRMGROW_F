import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoShareComponent } from './video-share.component';

describe('VideoShareComponent', () => {
  let component: VideoShareComponent;
  let fixture: ComponentFixture<VideoShareComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VideoShareComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoShareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
