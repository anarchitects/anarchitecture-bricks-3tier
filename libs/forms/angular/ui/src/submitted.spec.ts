import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnarchitectsFormsUiSubmitted } from './submitted';

describe('AnarchitectsFormsUiSubmitted', () => {
  let component: AnarchitectsFormsUiSubmitted;
  let fixture: ComponentFixture<AnarchitectsFormsUiSubmitted>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFormsUiSubmitted],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFormsUiSubmitted);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
