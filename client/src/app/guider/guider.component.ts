import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-guider',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './guider.component.html',
  styleUrl: './guider.component.sass',
})
export class GuiderComponent {
  capturedImage: string | null = null;
  capturing = false;
  errorMessage = '';
  deviceStatus = { connected: false, device: null };
  phd2Status = { connected: false, state: 'Stopped' };
  phd2Connecting = false;
  phd2ProcessRunning = false;

  constructor(private http: HttpClient) {
    this.checkDeviceStatus();
    this.checkPHD2Status();
    this.checkPHD2Process();
  }

  checkPHD2Process() {
    this.http.get<any>('/api/guider/phd2/process/status').subscribe({
      next: (response) => {
        this.phd2ProcessRunning = response.running;
      },
      error: (error) => {
        this.phd2ProcessRunning = false;
      }
    });
  }

  startPHD2Process() {
    this.http.post<any>('/api/guider/phd2/process/control', { action: 'start' }).subscribe({
      next: (response) => {
        this.phd2ProcessRunning = true;
        setTimeout(() => this.checkPHD2Process(), 2000); // Check again after 2 seconds
      },
      error: (error) => {
        this.errorMessage = 'Failed to start PHD2 process';
      }
    });
  }

  stopPHD2Process() {
    this.http.post<any>('/api/guider/phd2/process/control', { action: 'stop' }).subscribe({
      next: (response) => {
        this.phd2ProcessRunning = false;
        this.checkPHD2Process();
      },
      error: (error) => {
        this.errorMessage = 'Failed to stop PHD2 process';
      }
    });
  }

  checkDeviceStatus() {
    this.http.get<any>('/api/guider/status').subscribe({
      next: (response) => {
        this.deviceStatus = response;
      },
      error: (error) => {
        this.deviceStatus = { connected: false, device: null };
      }
    });
  }

  checkPHD2Status() {
    this.http.get<any>('/api/guider/phd2/status').subscribe({
      next: (response) => {
        this.phd2Status = response;
      },
      error: (error) => {
        this.phd2Status = { connected: false, state: 'Stopped' };
      }
    });
  }

  connectPHD2() {
    this.phd2Connecting = true;
    this.http.post<any>('/api/guider/phd2/connect', {}).subscribe({
      next: (response) => {
        this.phd2Status.connected = response.connected;
        this.phd2Connecting = false;
        this.checkPHD2Status();
      },
      error: (error) => {
        this.errorMessage = 'Failed to connect to PHD2';
        this.phd2Connecting = false;
      }
    });
  }

  startGuiding() {
    this.http.post<any>('/api/guider/phd2/start_guiding', {}).subscribe({
      next: (response) => {
        this.checkPHD2Status();
      },
      error: (error) => {
        this.errorMessage = 'Failed to start guiding';
      }
    });
  }

  stopGuiding() {
    this.http.post<any>('/api/guider/phd2/stop_guiding', {}).subscribe({
      next: (response) => {
        this.checkPHD2Status();
      },
      error: (error) => {
        this.errorMessage = 'Failed to stop guiding';
      }
    });
  }

  captureImage() {
    this.capturing = true;
    this.errorMessage = '';
    
    this.http.get<any>('/api/guider/capture').subscribe({
      next: (response) => {
        this.capturedImage = `/static/images/${response.filename}`;
        this.capturing = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Failed to capture image';
        this.capturing = false;
      }
    });
  }
}
