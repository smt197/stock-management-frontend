import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // currentUser$ emits the user object if logged in, or null if not.
  return authService.currentUser$.pipe(
    map(user => {
      if (user) {
        // If user is authenticated (user object exists), redirect to dashboard
        router.navigate(['/dashboard']);
        return false;
      }
      // If user is not authenticated (user is null), allow access to the route
      return true;
    })
  );
};
