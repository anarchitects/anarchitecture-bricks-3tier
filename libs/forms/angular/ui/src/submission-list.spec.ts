import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { Submission } from '@anarchitects/forms-ts/models';
import { AnarchitectsFormsUiSubmissionList } from './submission-list';

describe('AnarchitectsFormsUiSubmissionList', () => {
  let component: AnarchitectsFormsUiSubmissionList;
  let fixture: ComponentFixture<AnarchitectsFormsUiSubmissionList>;
  let ref: ComponentRef<AnarchitectsFormsUiSubmissionList>;

  const mockSubmissions: Submission[] = [
    {
      id: 'submission-1',
      formId: 'contact',
      formVersion: 1,
      payload: { name: 'Jane Doe', email: 'jane@example.com' },
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFormsUiSubmissionList],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFormsUiSubmissionList);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    ref.setInput('submissions', mockSubmissions);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render submission content in default item template', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    expect(nativeElement.textContent).toContain('contact');
    expect(nativeElement.textContent).toContain('View details');
  });

  it('should emit selected submission', () => {
    const emitSpy = vi.spyOn(component.selected, 'emit');
    const nativeElement = fixture.nativeElement as HTMLElement;
    const button = nativeElement.querySelector('button');

    expect(button).toBeTruthy();
    button?.click();

    expect(emitSpy).toHaveBeenCalledWith(mockSubmissions[0]);
  });
});
