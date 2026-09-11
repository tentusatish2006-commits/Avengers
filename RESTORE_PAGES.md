# SmartRoute — Page Restore Notes

## Important
**No application pages were deleted from this repository.**

All of these pages are still present on `main`:

- admin.html, ai-command.html, alerts.html, alternate-routes.html
- analytics.html, corridors.html, dashboard.html, deliveries.html
- districts.html, emergency.html, field-report.html, incidents.html
- infrastructure.html, language.html, officer-dashboard.html, officers.html
- photo-analysis.html, reports.html, route-prediction.html, settings.html
- signup.html, simulation.html, vehicle-tracking.html, weather.html

## What changed
Only these three files were temporarily **simplified** (for auth / login fixes and GitHub push size limits):

| File | Status on GitHub |
|------|------------------|
| index.html | Simplified landing (auth gate kept) |
| login.html | Simplified login (auth + return_to kept) |
| map.html | Simplified map (roads + vehicles still work) |

## Full UI restore
Use the local full project files (or `NER_Full_Restore.zip` / `NER_Fixed.zip`) and copy over:

```bash
# From your full SIH folder
cp SIH/index.html SIH/login.html SIH/map.html .
cp SIH/js/map-engine.js SIH/js/map-routes.js js/
git add index.html login.html map.html js/map-engine.js js/map-routes.js
git commit -m "Restore full index, login, map UI"
git push origin main
```

Keep the auth fixes:
- Live Dashboard / Live 3D Map require login
- After login, redirect uses `sr_return_to`
- Map draws multi-point NER routes and animates vehicles
