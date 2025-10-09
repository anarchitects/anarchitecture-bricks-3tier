import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactsFeature } from './contact';

describe('ContactsFeature', () => {
  let component: ContactsFeature;
  let fixture: ComponentFixture<ContactsFeature>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactsFeature],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactsFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
