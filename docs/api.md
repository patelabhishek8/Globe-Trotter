# GlobeTrotter — REST API Documentation

Base URL: `/api`

## Authentication & Profiles
- `POST /api/auth/register` — Register a new user account
- `POST /api/auth/login` — Authenticate user and issue JWT bearer token
- `GET /api/auth/me` — Retrieve current authenticated user profile
- `PUT /api/auth/profile` — Update user profile details and travel preferences
- `PUT /api/auth/change-password` — Update account password

## Trips & Itinerary Builder
- `GET /api/trips` — List trips for current user (filters: status, search)
- `POST /api/trips` — Create a new multi-city trip
- `GET /api/trips/{id}` — Fetch complete trip with stops, day activities, and expenses
- `PUT /api/trips/{id}` — Update trip metadata (title, dates, budget, travel style)
- `DELETE /api/trips/{id}` — Delete trip and cascaded itinerary records
- `POST /api/trips/{id}/duplicate` — Clone trip into user account

## Stops & Day Scheduling
- `POST /api/trips/{id}/stops` — Add destination stop to trip route
- `PUT /api/trips/{id}/stops/{stop_id}` — Edit stop details
- `DELETE /api/trips/{id}/stops/{stop_id}` — Remove stop
- `POST /api/trips/{id}/stops/reorder` — Reorder stops sequence
- `POST /api/trips/{id}/activities` — Schedule activity to a specific date & time slot
- `PUT /api/trips/{id}/activities/{act_id}` — Update scheduled activity
- `DELETE /api/trips/{id}/activities/{act_id}` — Remove scheduled activity
- `GET /api/trips/{id}/conflicts` — Check for time-slot overlap warnings

## Budget & Expenses
- `GET /api/trips/{id}/budget` — Dynamic calculated breakdown, category percentages, daily costs, and overbudget status
- `POST /api/trips/{id}/expenses` — Record custom expense
- `DELETE /api/trips/{id}/expenses/{exp_id}` — Remove expense

## Community & Public Sharing
- `POST /api/trips/{id}/share` — Toggle public share link on/off
- `GET /api/community` — Fetch curated community trips feed
- `GET /api/community/shared/{token}` — Public read-only trip details
- `POST /api/community/shared/{token}/copy` — One-click clone public trip into user account

## Discovery & Curation
- `GET /api/cities` — Search & filter 30+ Indian destinations by region, budget, popularity
- `GET /api/cities/{id}` — Detailed city profile with associated activities
- `GET /api/activities` — Search & filter authentic things to do by category, duration, cost
- `GET /api/recommendations` — Rule-based smart recommendations with matched reasons

## Favorites & Notifications
- `GET /api/favorites` — Retrieve saved cities, activities, and trips
- `POST /api/favorites` — Add item to favorites
- `DELETE /api/favorites/{id}` — Remove item from favorites
- `GET /api/notifications` — Fetch user travel alerts and reminders
- `PUT /api/notifications/{id}/read` — Mark notification as read
- `PUT /api/notifications/read-all` — Mark all notifications as read

## Admin Control Center
- `GET /api/admin/metrics` — KPI platform metrics and monthly growth charts
- `GET /api/admin/users` — View user directory
- `POST / PUT / DELETE /api/admin/cities` — City content management
- `POST / PUT / DELETE /api/admin/activities` — Activity content management
