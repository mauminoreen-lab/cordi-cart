import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryTrackingComponent } from './delivery-tracking.component';

describe('DeliveryTrackingComponent', () => {
  let component: DeliveryTrackingComponent;
  let fixture: ComponentFixture<DeliveryTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryTrackingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
