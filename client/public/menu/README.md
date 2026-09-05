# Menu photos

Drop dish images in this folder (JPG/PNG/WebP), then point a menu item at one
in `db/menu_images.sql` with a root-relative path:

```sql
UPDATE menu_item SET image_url = '/menu/beef-suya.jpg'
  WHERE restaurant_id = 1 AND name = 'Beef Suya';
```

Apply it with `npm run db:images`.

Files here are served at `/menu/<filename>` in dev and are copied into the
production build, so the same path works once deployed. Keep them reasonably
small (a card shows them at ~600×240) — 100–300 KB each is plenty.
