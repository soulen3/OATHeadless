import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OATControllerComponent } from './oatcontroller.component';

describe('OATControllerComponent', () => {
  let component: OATControllerComponent;
  let fixture: ComponentFixture<OATControllerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OATControllerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OATControllerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
