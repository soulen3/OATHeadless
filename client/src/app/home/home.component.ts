import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessageConsoleService } from '../message-console.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.sass',
})
export class HomeComponent {
  constructor(
    private http: HttpClient,
    private messageService: MessageConsoleService
  ) {}

  setDefaults() {
    this.messageService.addMessage('Setting device time and location...', 'info');
    this.setDeviceTime();
    this.getUserLocationAndSet();
  }

  private setDeviceTime() {
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
        this.messageService.addMessage('Time set successfully', 'success');
      },
      error: (error) => {
        this.messageService.addMessage('Failed to set time: ' + (error.error?.error || error.message), 'error');
      }
    });
  }

  private getUserLocationAndSet() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = this.decimalToDegreesMinutesSeconds(position.coords.latitude, true);
          const longitude = this.decimalToDegreesMinutesSeconds(position.coords.longitude, false);
          
          const payload = { latitude, longitude };

          this.http.post('/api/mount/location', payload).subscribe({
            next: (response: any) => {
              this.messageService.addMessage('Location set successfully', 'success');
            },
            error: (error) => {
              this.messageService.addMessage('Failed to set location: ' + (error.error?.error || error.message), 'error');
            }
          });
        },
        (error) => {
          this.messageService.addMessage('Geolocation error: ' + error.message, 'error');
        }
      );
    } else {
      this.messageService.addMessage('Geolocation not available in this browser', 'error');
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
}
