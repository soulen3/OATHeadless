import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuiderComponent } from './guider.component';

describe('GuiderComponent', () => {
  let component: GuiderComponent;
  let fixture: ComponentFixture<GuiderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuiderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GuiderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
