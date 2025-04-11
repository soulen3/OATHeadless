import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.sass',
})
export class SettingsComponent implements OnInit {
  latitude: number | null = null;
  longitude: number | null = null;
  errorMessage: string = '';
  locationForm: FormGroup;
  currentPage: string = 'location';
  useTime: string = '';

  constructor() {
    this.locationForm = new FormGroup({
      longitude: new FormControl('', [Validators.required]),
      latitude: new FormControl('', [Validators.required]),
    });
  }

  ngOnInit(): void {}

  onSubmitLocation() {
    if (this.locationForm.valid) {
      console.log(this.locationForm.value);
    } else {
      console.log('Form is invalid');
    }
  }

  getUserLocation() {
    if ('geolocation' in navigator) {
      // Request the user's location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success callback: position is available
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
        },
        (error) => {
          // Error callback: handle errors (e.g., permission denied)
          this.errorMessage = `Error: ${error.message}`;
        },
      );
    } else {
      this.errorMessage = 'Geolocation is not available in this browser.';
    }
  }

  setDeviceTime() {
    const now = new Date();
    this.useTime = now.toISOString();
    this.errorMessage = 'Not Implemented yet.';
  }

  goToPage(page: string) {
    this.currentPage = page;
  }
}
