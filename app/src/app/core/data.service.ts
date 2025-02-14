import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, map, distinctUntilChanged } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpService } from './http.service';
import { Expense } from '../models/Expense';
import { Account } from '../models/Account';
import { Sync } from '../models/Sync';
import { Event } from '../models/Event';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private syncSubject = new BehaviorSubject<any | null>(null);
  private eventsSubject = new BehaviorSubject<any | null>(null);
  public sync$ = this.syncSubject.asObservable();
  public events$ = this.eventsSubject.asObservable();
  public account$ = this.sync$.pipe(
    map((sync: Sync) => sync?.account),
    distinctUntilChanged() 
  );
  private activitySubject = new BehaviorSubject<any | null>({});
  public activity$ = this.activitySubject.asObservable();

  constructor(private http: HttpService) {}

  fetchSyncData(): Observable<any> {
    return this.http.sync().pipe(
      tap(syncData => this.syncSubject.next(syncData)) // Store sync data
    );
  }

  fetchEvents(): Observable<any> {
    return this.http.getCalendar().pipe(
      tap(events => this.eventsSubject.next(events))
    );
  }

  updateMonthYear(which: string): Observable<any> {
    return this.http.updateMonthYear(which).pipe(
      tap((calendar: any) => {
        this.syncSubject.next({
          ...this.syncSubject.value,
          account: {
            ...this.syncSubject.value.account,
            year: calendar.year,
            month: calendar.month
          }
        })
        return this.eventsSubject.next(calendar)
      })
    );
  }

  fetchEvent(eventId: string): Observable<Event> {
    const events = this.eventsSubject.value;
    if (events) {
      for (var week of events.months) {
        for (var day of week) {
          if (day.events) {
            for (var event of day.events) {
              if (event.id == eventId) {
                return of(event);
              }
            }
          }
        }
      }
    }
    return of({} as Event);
  }

  saveThisEvent(event: Event): Observable<any> {
    return this.http.saveThisEvent(event).pipe(
      tap((res: any) => {
        console.log("saved this event", res);
        return this.eventsSubject.next({
          ...this.eventsSubject.value,
          months: res.months
        });
      })
    );
  }

  addExpense(): void {
    this.http.addExpense().pipe(
      tap((expense: Expense) => {
        const currentSync = this.syncSubject.value;
        if (!currentSync) return;

        const updatedExpenses = [...currentSync.account.expenses, expense];

        console.log('added expense', updatedExpenses)

        this.syncSubject.next({ 
          ...currentSync,
          account: {
            ...currentSync.account,
            expenses: updatedExpenses 
          }
        });
      })
    ).subscribe();
  }

  updateExpense(expense: Expense): void {
    const currentSync = this.syncSubject.value;
    if (!currentSync) return;

    const updatedExpenses = currentSync.account.expenses.map((e: Expense) => {
      return e.id == expense.id ? expense : e
    });

    // emit update
    this.syncSubject.next({
      ...currentSync,
      expenses: updatedExpenses
    });

    this.http.updateExpense(expense).subscribe();
  }

  deleteExpense(expense: Expense): void {
    this.http.deleteExpense(expense).subscribe({
      next: response => {
        console.log('deleted expense')
        this.syncSubject.next({
          ...this.syncSubject.value,
          account: {
            ...this.syncSubject.value.account,
            expenses: this.syncSubject.value.account.expenses.filter((e: Expense) => e.id !== expense.id)
          }
        });
      },
      error: err => {
        console.log('error deleting expense', err)
      }
    })
  }

  getCurrentSyncData(): any | null {
    return this.syncSubject.value;
  }

  getAccount(): Account {
    return this.syncSubject.value.account;
  }

  setActivity(obj: any) {
    this.activitySubject.next({
      ...this.activitySubject,
      ...obj
    });
  }

  saveCheckingBalance(balance: number) {
    this.http.saveCheckingBalance(balance).pipe(
      tap((res: any) => {
        this.syncSubject.next({
          ...this.syncSubject.value,
          account: {
            ...this.syncSubject.value.account,
            checkingBalance: balance
          }
        });
        return this.eventsSubject.next({
          ...this.eventsSubject.value,
          months: res.months
        });
      })
    ).subscribe();
  }

  refreshCalendar() {
    this.http.refreshCalendar().pipe(
      tap((res: any) => {
        console.log("saved this event", res);
        return this.eventsSubject.next({
          ...this.eventsSubject.value,
          months: res.months
        });
      })
    ).subscribe();
  }

}
