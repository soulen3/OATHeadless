import { Component, OnInit } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MessageConsoleService } from '../message-console.service';

interface Device {
  device: string;
  description: string;
  hwid: string;
  vid: number;
  pid: number;
  manufacturer: string;
  product: string;
  type: string;
}

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
    MatIconModule,
    MatSelectModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.sass',
})
export class SettingsComponent implements OnInit {
  latitude: number | null = null;
  longitude: number | null = null;
  errorMessage = '';
  locationForm: FormGroup;
  deviceForm: FormGroup;
  homingOffsetForm: FormGroup;
  availableDevices: Device[] = [];

  constructor(
    private http: HttpClient,
    private messageService: MessageConsoleService
  ) {
    this.locationForm = new FormGroup({
      longitude: new FormControl('', [Validators.required]),
      latitude: new FormControl('', [Validators.required]),
    });

    this.deviceForm = new FormGroup({
      telescopeDevice: new FormControl(''),
      telescopeBaudrate: new FormControl(9600),
      guiderDevice: new FormControl(''),
      cameraDevice: new FormControl('')
    });

    this.homingOffsetForm = new FormGroup({
      raOffset: new FormControl(0),
      decOffset: new FormControl(0)
    });
  }

  get serialDevices() {
    return this.availableDevices.filter(device => device.type === 'serial');
  }

  get videoDevices() {
    return this.availableDevices.filter(device => device.type === 'video');
  }
  
  get cameraDevices() {
    return this.availableDevices.filter(device => device.type === 'camera');
  }

  ngOnInit() {
    this.loadAvailableDevices();
    this.loadDeviceConfiguration();
    this.loadHomingOffset();
  }

  loadDeviceConfiguration() {
    this.messageService.addMessage('Loading device configuration...', 'info');
    
    this.http.get<{config: any}>('/api/config/device').subscribe({
      next: (response) => {
        if (response.config) {
          this.deviceForm.patchValue(response.config);
          this.messageService.addMessage('Device configuration loaded', 'success');
        }
      },
      error: (error) => {
        this.messageService.addMessage('Failed to load device config: ' + (error.error?.error || error.message), 'error');
      }
    });
  }

  loadAvailableDevices() {
    this.messageService.addMessage('Loading available devices...', 'info');
    
    this.http.get<{devices: Device[]}>('/api/devices').subscribe({
      next: (response) => {
        this.availableDevices = response.devices;
        this.messageService.addMessage(`Found ${this.availableDevices.length} devices`, 'success');
      },
      error: (error) => {
        this.messageService.addMessage('Failed to load devices: ' + (error.error?.error || error.message), 'error');
      }
    });
  }

  onSubmitDevices() {
    if (this.deviceForm.valid) {
      const deviceData = this.deviceForm.value;
      this.messageService.addMessage('Saving device configuration...', 'info');
      
      this.http.post('/api/config/device', deviceData).subscribe({
        next: (response: any) => {
          this.messageService.addMessage('Device configuration saved successfully', 'success');
        },
        error: (error) => {
          this.messageService.addMessage('Failed to save device config: ' + (error.error?.error || error.message), 'error');
        }
      });
    } else {
      this.messageService.addMessage('Please fill in all required fields', 'error');
    }
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
    this.messageService.addMessage('Setting mount time to UTC...', 'info');
    
    const now = new Date();
    const utcNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    
    const date = utcNow.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    });
    const time = utcNow.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const payload = { date, time };

    this.http.post('/api/mount/datetime', payload).subscribe({
      next: (response: any) => {
        this.messageService.addMessage('Time set successfully', 'success');
      },
      error: (error) => {
        this.messageService.addMessage('Failed to set time: ' + (error.error?.error || error.message), 'error');
      }
    });
  }

  loadHomingOffset() {
    this.http.get('/api/mount/home/offset').subscribe({
      next: (response: any) => {
        this.homingOffsetForm.patchValue({
          raOffset: response.ra_offset,
          decOffset: response.dec_offset
        });
      },
      error: (error) => {
        this.messageService.addMessage('Failed to load homing offset: ' + (error.error?.error || error.message), 'error');
      }
    });
  }

  setHomingOffset() {
    const offsets = this.homingOffsetForm.value;
    this.messageService.addMessage(`Setting homing offset: RA ${offsets.raOffset}, DEC ${offsets.decOffset}`, 'info');
    
    this.http.post('/api/mount/home/offset', offsets).subscribe({
      next: (response: any) => {
        this.messageService.addMessage('Homing offset set successfully', 'success');
      },
      error: (error) => {
        this.messageService.addMessage('Failed to set homing offset: ' + (error.error?.error || error.message), 'error');
      }
    });
  }
}
