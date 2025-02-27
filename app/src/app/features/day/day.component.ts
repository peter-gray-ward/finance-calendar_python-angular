import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Event } from '../../models/Event';
import { DataService } from '../../core/data.service';
import { HighlightDirective } from '../../core/highlight.directive';

@Component({
  selector: 'app-day',
  standalone: true,
  imports: [FormsModule, HighlightDirective],
  templateUrl: './day.component.html',
  styleUrl: './day.component.scss'
})
export class DayComponent {
  @Input() day: any;
  @Input() month!: number;
  @Input() year!: number;
  @Input() checkingBalance: number = 0;

  saveCheckingBalanceTimeout: number = 0;

  constructor(private router: Router, private data: DataService) {}

  editEvent($event: any, event: Event) {
    this.data.setActivity({ left: $event.clientX, top: $event.clientY });
    this.router.navigate([`/event/${event.id}`])
  }

  updateCheckingBalance() {
      clearTimeout(this.saveCheckingBalanceTimeout);
      this.saveCheckingBalanceTimeout = setTimeout(() => {
          this.saveCheckingBalance();
      }, 800);
  }

  saveCheckingBalance() {
      console.log("Saving:", this.checkingBalance);
      this.data.saveCheckingBalance(this.checkingBalance);
  }

  createEvent(day: any) {
    const date = new Date().toISOString().split("T")[0];
    const event: any = {
        summary: 'string',
        date: date,
        recurrenceenddate: date,
        amount: 0,
        total: 0,
        balance: 0,
        exclude: 0,
        frequency: 'monthly'
    };
    this.data.createEvent(event);
  }
}
