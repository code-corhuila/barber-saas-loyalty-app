import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { shellContext } from '../shell-context';

/** /loyalty: a client goes to their card, staff to the barbershop's cards. */
@Component({
  selector: 'lo-home',
  template: ``,
})
export class HomeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const role = shellContext(this.route.snapshot)?.session.user()?.role;
    void this.router.navigateByUrl(role === 'CLIENT' ? '/loyalty/me' : '/loyalty/cards', { replaceUrl: true });
  }
}
