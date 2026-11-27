---
title: Tablet Launcher (Fully Kiosk)
category: Systems
order: 20
description: The Mermug header injected into Fully Kiosk's app launcher on the Android tablets, and how to install or change it.
---

# Tablet Launcher (Fully Kiosk)

The Android tablets run **Fully Kiosk Browser** with its Universal Launcher
as the start screen. A custom header is injected at the top of the launcher:
the Mermug logo and name on the mermug.com orange bar, the current time,
today's sunrise and sunset, and a topographic-map background behind the app
icons. The app icons are Fully's own; the header doesn't list or configure
them, so adding or removing an app in Fully needs no change here.

## Files

Paste the **whole file** into Fully. Open the raw link, select all, copy.

| File | For | Raw copy |
|---|---|---|
| `launcher-header.html` | Larger tablet [confirm which] | [raw](https://raw.githubusercontent.com/zackphillips/mermug-ships-docs/main/config/fully/launcher-header.html) |
| `launcher-header-compact.html` | Samsung Galaxy Tab Active3, 8" | [raw](https://raw.githubusercontent.com/zackphillips/mermug-ships-docs/main/config/fully/launcher-header-compact.html) |
| `viewport-check.html` | One-off: shows the screen size in CSS pixels | [raw](https://raw.githubusercontent.com/zackphillips/mermug-ships-docs/main/config/fully/viewport-check.html) |

Source: [`config/fully/`](https://github.com/zackphillips/mermug-ships-docs/tree/main/config/fully).

## Install or update

1. In Fully, open **Settings → Universal Launcher → Inject HTML Code in
   Launcher**.
2. Replace the field's contents with the file. Don't append to old code.
3. Reload the launcher (Fully menu → Reload, or force-stop and reopen Fully).
   The header shows only after a reload.

If the screen goes blank or nothing changes, paste
`<style>body{border-top:40px solid red}</style>` alone. A red band means
injection works and the problem is in the file; no band means Fully isn't
showing the launcher (check **Show Launcher on Start**, or set the Start URL
to `fully://launcher`).

## Sizes

| | Full-size | Compact (Tab Active3) |
|---|---|---|
| Bar height | 136 px | 80 px landscape, 72 px portrait |
| Logo | 96 px | 60 px / 50 px |
| "Mermug" | ~38 px | 28 px / 22 px |
| Clock | ~38 px | 30 px |

The Tab Active3 panel is 1920×1200 at about 283 ppi. At Samsung's default
display scaling that is 960×600 CSS pixels, or 1097×686 if Screen zoom is
turned down; the compact header was checked at both, in both orientations.
To confirm a tablet's real size, inject `viewport-check.html` for a moment:
it shows a single line such as `CSS 960 x 600 @2x = 1920 x 1200 px`.

## How it works

Fully's launcher **applies injected CSS but does not run JavaScript**: not
`<script>` tags, not inline handlers. The header is built around that.

- **Bar, logo and name**: pure CSS, a `body::before` block.
- **Clock and sunrise/sunset**: a small page embedded as a base64
  `data:text/html` iframe, positioned over the right side of the bar.
  Scripts inside the iframe do run. It computes sunrise and sunset on the
  tablet (no network) for a fixed position in San Francisco
  (37.807, −122.447), accurate to about a minute anywhere in the Bay.
- **Logo**: loaded from
  `https://zackphillips.github.io/data/vessel/logo.png` (`mermug.com/...`
  redirects to a page, not the image), with a 4 KB copy embedded as a
  fallback for when there's no internet.
- **Background**: the topo wallpaper from cdn.shopify.com
  (NOMAD "Topo" wallpaper), set on `html` with `!important` so it overrides
  Fully's Launcher Background Color. Offline it falls back to navy
  `#0c1520`.
- **Fonts and colors** follow mermug.com: Inter, orange `#b85010`.

The header contains no Signal K address; the app tiles carry their own URLs
(next section).

### Changing it

- **Colors, sizes, text**: edit the `<style>` block at the top of the file.
- **Clock or sun position**: the iframe's code is base64 inside
  `src="data:text/html;base64,…"`. Decode it, edit (`LAT`/`LON` are near the
  top of the script), re-encode, and paste back:
  `echo '<base64>' | base64 -d > clock.html`, then
  `base64 -w0 clock.html`.
- **Launcher markup**, if you need to target the icons: each tile is a
  `div.app` (installed app) or `div.bookmark` (web link) containing an `<a>`
  and a `div.appIcon` / `div.bookmarkIcon`. Rearranging the icon grid with
  CSS (a hex layout was tried) didn't take on the tablet; the layout is left
  to Fully. Set icon size with Fully's own **Launcher Icon Size**.

## App tiles

Web-app tiles in Fully should use the hostname with HTTPS and no port, so
the same tile works aboard and over the VPN. See
[signalk.mermug.com](remote-access.md#signalkmermugcom-one-address-aboard-and-remote).

| App | URL |
|---|---|
| Freeboard-SK | `https://signalk.mermug.com/@signalk/freeboard-sk/` |
| KIP | `https://signalk.mermug.com/@mxtommy/kip/` |
| Signal K admin | `https://signalk.mermug.com/admin/` |

- Don't use `:3000` URLs: they bypass the HTTPS proxy and fail remotely.
- Don't use `10.0.1.1`: aboard, it hairpins out through AstroWarp and needs
  internet, and the certificate doesn't match an IP.
- On each tablet, **Settings → Network → Private DNS** must be **Off** or
  **Automatic**. A named private DNS provider bypasses the router, so the
  tablet gets the remote address while aboard.

## If it goes wrong

- **Header missing, apps shown as normal**: Fully wasn't reloaded, or the
  field holds old code. Clear it and paste the file again.
- **Orange bar but no clock**: JavaScript is off for web content in Fully
  (Web Content Settings → Enable JavaScript).
- **No logo or plain navy background**: no internet; the embedded logo
  fallback should still show. Expected at sea.
- **Tiles fail aboard but work remotely**: Private DNS (above), or the
  router's DNS override is missing; see
  [Remote Access](remote-access.md#signalkmermugcom-one-address-aboard-and-remote).
