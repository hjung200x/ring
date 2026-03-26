# Auth Flow V1

1. User opens login page.
2. User submits email and password.
3. API creates session and sets HttpOnly cookie.
4. Protected pages require valid session.
5. Logout deletes session and clears cookie.
