import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MessageConsoleService } from '../message-console.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatTabsModule, 
    MatCardModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatIconModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.sass',
})
export class SettingsComponent {
  latitude: number | null = null;
  longitude: number | null = null;
  errorMessage = '';
  locationForm: FormGroup;
  useTime = '';

  constructor(
    private http: HttpClient,
    private messageService: MessageConsoleService
  ) {
    this.locationForm = new FormGroup({
      longitude: new FormControl('', [Validators.required]),
      latitude: new FormControl('', [Validators.required]),
    });
  }

  onSubmitLocation() {
    if (this.locationForm.valid) {
      const locationData = this.locationForm.value;
      
      this.messageService.addMessage('Setting mount location...', 'info');
      
      // Convert decimal degrees to DDD:MM:SS format
      const latitude = this.decimalToDegreesMinutesSeconds(locationData.latitude, true);
      const longitude = this.decimalToDegreesMinutesSeconds(locationData.longitude, false);
      
      const payload = { latitude, longitude };

      this.http.post('/api/mount/location', payload).subscribe({
        next: (response: any) => {
          if (response.latitude_set && response.longitude_set) {
            this.errorMessage = '';
            this.messageService.addMessage('Location set successfully on mount', 'success');
          } else {
            this.errorMessage = 'Failed to set location on mount';
            this.messageService.addMessage('Failed to set location on mount', 'error');
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.error || 'Failed to communicate with mount';
          this.messageService.addMessage('Failed to set location: ' + this.errorMessage, 'error');
        }
      });
    } else {
      this.messageService.addMessage('Please fill in both latitude and longitude', 'error');
    }
  }

  private decimalToDegreesMinutesSeconds(decimal: number, isLatitude: boolean): string {
    const sign = decimal < 0 ? '-' : '+';
    const abs = Math.abs(decimal);
    const degrees = Math.floor(abs);
    const minutes = Math.floor((abs - degrees) * 60);
    const seconds = Math.floor(((abs - degrees) * 60 - minutes) * 60);
    
    if (isLatitude) {
      return `${sign}${degrees.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${degrees.toString().padStart(3, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  getUserLocation() {
    this.messageService.addMessage('Getting current location...', 'info');
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          this.locationForm.patchValue({
            latitude: this.latitude,
            longitude: this.longitude
          });
          this.messageService.addMessage('Location retrieved successfully', 'success');
        },
        (error) => {
          this.errorMessage = `Error: ${error.message}`;
          this.messageService.addMessage('Geolocation error: ' + error.message, 'error');
        },
      );
    } else {
      this.errorMessage = 'Geolocation is not available in this browser.';
      this.messageService.addMessage('Geolocation not available in this browser', 'error');
    }
  }

  setDeviceTime() {
    this.messageService.addMessage('Setting mount time...', 'info');
    
    const now = new Date();
    const date = now.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    });
    const time = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const payload = { date, time };

    this.http.post('/api/mount/datetime', payload).subscribe({
      next: (response: any) => {
        if (response.date_set && response.time_set) {
          this.useTime = now.toISOString();
          this.errorMessage = '';
          this.messageService.addMessage('Time set successfully on mount', 'success');
        } else {
          this.errorMessage = 'Failed to set date/time on mount';
          this.messageService.addMessage('Failed to set date/time on mount', 'error');
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Failed to communicate with mount';
        this.messageService.addMessage('Failed to set time: ' + this.errorMessage, 'error');
      }
    });
  }
}
