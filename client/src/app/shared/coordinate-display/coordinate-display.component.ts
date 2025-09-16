import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-coordinate-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="coordinate-display">
      <div class="coordinate">
        <label>RA:</label>
        <span class="value">{{ ra || '--:--:--' }}</span>
      </div>
      <div class="coordinate">
        <label>DEC:</label>
        <span class="value">{{ dec || '--:--:--' }}</span>
      </div>
    </div>
  `,
  styles: [`
    .coordinate-display {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .coordinate {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .coordinate label {
      font-weight: bold;
      color: #666;
    }

    .coordinate .value {
      font-family: monospace;
      font-size: 16px;
      color: #333;
    }
  `]
})
export class CoordinateDisplayComponent {
  @Input() ra: string = '';
  @Input() dec: string = '';
}
