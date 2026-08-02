# Role-Based Auto-Routing Implementation

## Overview

This implementation automatically redirects users to their appropriate default route based on their assigned roles when they access the application root (`/`).

## Implementation Files

### 1. `/app/guards/role-based-redirect.guard.ts` (NEW)

A route guard that intercepts navigation to the root path and redirects users to their role-specific default route.

**Key Features:**

- Implements `CanActivate` interface
- Retrieves user roles from `AuthenticationService`
- Returns a `UrlTree` to redirect to the appropriate route
- Uses priority-based role checking (highest priority roles checked first)

### 2. `/app/app-routing.module.ts` (UPDATED)

Updated to include the guard on the root route.

**Changes:**

- Imported `RoleBasedRedirectGuard`
- Added `canActivate: [RoleBasedRedirectGuard]` to the root route (`''`)

### 3. `/app/app.component.ts` (UPDATED)

Added a helper method for determining default routes (can be used elsewhere in the app if needed).

**Added Method:**

- `getDefaultRouteForRoles(roles: string[]): string` - Determines the default route based on user roles

## Role-to-Route Mapping

| Priority | Role(s)                                                     | Default Route            |
| -------- | ----------------------------------------------------------- | ------------------------ |
| 1        | `ADMIN`                                                     | `/home`                  |
| 2        | `PERIOD_CLOSE`                                              | `/period-close-tracking` |
| 3        | `EXCEPTION_ADMIN`, `EXCEPTION_READ_ONLY`                    | `/invoice-to-cash`       |
| 4        | `ACCOUNT_RECON`                                             | `/revenue-accounting`    |
| 5        | `MONITORING_OM`                                             | `/order-management`      |
| 6        | `CASE_IQ_*` (all Case IQ roles)                             | `/esp-home`              |
| 7        | `LARGE_DEAL`, `WD0`, `MIDCLOSE_VOLUMES`, `ISSUE_RESOLUTION` | `/business-insights`     |
| 8        | `GL_POSTING`                                                | `/gl-posting`            |
| 9        | `OPERATION_CTRL`                                            | `/operations-controls`   |
| 10       | Default (no roles or unmatched)                             | `/home`                  |

## How It Works

1. **User accesses the application** at `https://yourapp.com/` or explicitly navigates to root
2. **Guard activates** - `RoleBasedRedirectGuard.canActivate()` is called
3. **Roles retrieved** - Guard gets user roles from `AuthenticationService.getRoles()`
4. **Route determined** - Based on priority order, the first matching role determines the route
5. **Redirect happens** - Guard returns a `UrlTree` causing automatic navigation to the determined route
6. **User sees their dashboard** - They land on their role-specific default page

## Priority Logic

The guard uses a priority-based approach:

- **Highest priority roles are checked first** (ADMIN)
- **First matching role determines the route**
- If a user has multiple roles, they'll be directed to the route corresponding to their highest-priority role

### Example Scenarios:

**Scenario 1: User with only `PERIOD_CLOSE` role**

- Navigates to `/` → Redirected to `/period-close-tracking` ✅

**Scenario 2: User with `ADMIN` + `PERIOD_CLOSE` roles**

- Navigates to `/` → Redirected to `/home` (ADMIN has higher priority) ✅

**Scenario 3: User with `EXCEPTION_ADMIN` + `ACCOUNT_RECON` roles**

- Navigates to `/` → Redirected to `/invoice-to-cash` (EXCEPTION_ADMIN has higher priority) ✅

**Scenario 4: User with `CASE_IQ_I2C` role**

- Navigates to `/` → Redirected to `/esp-home` ✅

## Testing

### Manual Testing Steps:

1. **Test with ADMIN role**
   - Access root `/` → Should land on `/home`

2. **Test with PERIOD_CLOSE role**
   - Access root `/` → Should land on `/period-close-tracking`

3. **Test with EXCEPTION_ADMIN or EXCEPTION_READ_ONLY role**
   - Access root `/` → Should land on `/invoice-to-cash`

4. **Test with ACCOUNT_RECON role**
   - Access root `/` → Should land on `/revenue-accounting`

5. **Test with Case IQ roles** (e.g., CASE_IQ_I2C)
   - Access root `/` → Should land on `/esp-home`

6. **Test with Business Insights roles** (e.g., LARGE_DEAL)
   - Access root `/` → Should land on `/business-insights`

7. **Test with multiple roles**
   - Verify that higher priority role takes precedence

### Browser Console Testing:

```javascript
// Check current user roles
console.log(localStorage.getItem("userRoles")); // or wherever roles are stored

// Test navigation
window.location.href = "/";
```

## Future Enhancements

### Possible Improvements:

1. **User Preference Override** - Allow users to set their preferred landing page
2. **Last Visited Route** - Remember and redirect to the last visited route
3. **Role-Based Menu Customization** - Dynamically show/hide menu items based on roles
4. **Multi-tenant Support** - Add tenant-specific routing logic
5. **Analytics** - Track which routes users are being directed to

## Maintenance

### Adding New Roles:

To add a new role-to-route mapping:

1. **Update the guard** (`role-based-redirect.guard.ts`):

   ```typescript
   // Add new role check (maintain priority order)
   if (roles.includes("NEW_ROLE")) {
     return "/new-route";
   }
   ```

2. **Update app.component.ts** (optional, for consistency):

   ```typescript
   // Add same logic to getDefaultRouteForRoles() method
   ```

3. **Update this documentation** - Add the new role to the mapping table

### Changing Route Priorities:

To change the priority of roles, simply reorder the `if` statements in the `getDefaultRouteForRoles()` method. The first matching condition wins.

## Security Considerations

⚠️ **Important Notes:**

- This guard only handles **routing**, not **authorization**
- You should still have **proper backend authorization** checks
- Each route component should verify that the user has permission to access that page
- The guard is a UX convenience, not a security measure

## Troubleshooting

### Issue: User keeps getting redirected to `/home` despite having a specific role

**Solution:**

- Check that the role name matches exactly (case-sensitive)
- Verify `AuthenticationService.getRoles()` returns the expected roles
- Add console logging to debug:
  ```typescript
  const roles = this.authService.getRoles();
  console.log("User roles:", roles);
  ```

### Issue: Infinite redirect loop

**Solution:**

- Ensure the route returned by the guard actually exists in the routing configuration
- Check that the target route doesn't have additional guards causing conflicts

### Issue: Guard not firing

**Solution:**

- Verify the guard is properly added to `app-routing.module.ts`
- Check that the guard is provided in `root` (should be by default with `providedIn: 'root'`)
