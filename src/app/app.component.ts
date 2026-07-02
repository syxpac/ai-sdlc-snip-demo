import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { LinkService, Link } from './link.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule, DatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private readonly svc = inject(LinkService);

  readonly urlInput   = signal('');
  readonly links      = signal<Link[]>([]);
  readonly newLink    = signal<Link | null>(null);
  readonly error      = signal('');
  readonly submitting = signal(false);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.svc.getAll().subscribe({ next: list => this.links.set(list) });
  }

  private validUrl(url: string): boolean {
    try {
      const { protocol } = new URL(url);
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  }

  submit(): void {
    const url = this.urlInput().trim();
    if (!this.validUrl(url)) {
      this.error.set('Enter a valid http or https URL.');
      return;
    }
    this.error.set('');
    this.newLink.set(null);
    this.submitting.set(true);

    this.svc.create(url).subscribe({
      next: link => {
        this.newLink.set(link);
        this.urlInput.set('');
        this.submitting.set(false);
        this.refresh();
      },
      error: err => {
        this.error.set(err?.error?.error ?? 'Network error. Please try again.');
        this.submitting.set(false);
      },
    });
  }
}
