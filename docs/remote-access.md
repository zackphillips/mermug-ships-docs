---
title: Remote Access (VPN)
category: Systems
order: 15
description: Reach the boat's network from off the boat with AstroWarp, and the signalk.mermug.com address that works both aboard and remote.
---

# Remote Access (VPN)

The Pi and the boat's onboard network aren't reachable from the open
internet. You need to be on the boat's Wi-Fi, or connected in over the
VPN. One hostname, `signalk.mermug.com`, reaches the Pi either way.

## VPN: AstroWarp

We use [AstroWarp](https://www.astrowarp.net/download) for remote access
to the boat's network.

- [ ] Download and install the AstroWarp app on your device from
  <https://www.astrowarp.net/download>.
- [ ] Ask Zack for the **share link**, and paste it into the setup wizard
  when prompted.
- [ ] Connect. Once the VPN is active, the boat's network is reachable as
  if you were aboard.

**We're on the free plan, which allows only two devices connected at
once.** If you can't connect, someone else is probably already on. Check
with Zack before assuming something is broken, and disconnect when you're
done so the slot is free for the next person.

## signalk.mermug.com: one address aboard and remote

Use `signalk.mermug.com` for everything: browser, Signal K apps, Fully
tiles, SSH. It resolves to a different address depending on where you are:

| Where you are | Name resolves to | Answered by |
|---|---|---|
| Aboard, on the boat Wi-Fi | `192.168.8.50` (the Pi) | DNS override on the boat router |
| Remote, AstroWarp connected | `10.0.1.1` (AstroWarp's address for the Pi) | Public DNS record |

Aboard, the name works with **no internet**: the router answers it locally.

### Addresses to use

| What | Address |
|---|---|
| Signal K, Freeboard, KIP, admin | `https://signalk.mermug.com/` (no port) |
| SSH | `ssh pi@signalk.mermug.com` |

HTTPS is served by nginx on the Pi with a real certificate; see
[SignalK Configuration: HTTPS Proxy & Certificate](signalk.md#https-proxy-certificate).
`http://` redirects to `https://`. Avoid `:3000` (bypasses the proxy, fails
remotely) and raw `10.0.1.1` (aboard it detours through AstroWarp and the
certificate won't match).

`10.0.1.1` still works for SSH, RealVNC and VS Code when you're on
AstroWarp: `ssh pi@10.0.1.1`.

### How it's set up

- **Public record** (Squarespace Domains → mermug.com → DNS, nameservers
  `ns-cloud-c*.googledomains.com`): `A signalk → 10.0.1.1`.
- **Boat router** (GL.iNet Slate [model —], LAN `192.168.8.1`): a dnsmasq
  hostname record `signalk.mermug.com → 192.168.8.50`. Added in LuCI
  (GL admin → System → Advanced Settings) under **Network → DHCP and DNS →
  Hostnames**. The same thing over SSH:
  ```sh
  uci add dhcp domain
  uci set dhcp.@domain[-1].name='signalk.mermug.com'
  uci set dhcp.@domain[-1].ip='192.168.8.50'
  uci commit dhcp && /etc/init.d/dnsmasq restart
  ```
- **The Pi** has a DHCP reservation for `192.168.8.50` [confirm it's set in
  the Slate's Clients page], so the override stays valid.
- **ACME challenge record**: `CNAME _acme-challenge.signalk →
  <account>.auth.acme-dns.io`, used only for certificate renewal.

If the Pi's LAN address ever changes, update the Slate record. If
AstroWarp's address for the Pi changes, update the public record.

### Devices

- **Android tablets and phones**: Settings → Network → Private DNS must be
  **Off** or **Automatic**. A named provider (e.g. `dns.google`) bypasses
  the router and gets the remote address while aboard.
- **iPhone**: if Safari fails but other apps work, turn off iCloud Private
  Relay for that network (Settings → Wi-Fi → ⓘ → Limit IP Address
  Tracking). Signal K apps need **Local Network** permission to work aboard
  (Settings → Privacy & Security → Local Network).
- After switching between boat Wi-Fi and cellular, a device can hold the
  old answer briefly. Toggle Wi-Fi or Airplane mode.

## Remote desktop and editing

- **RealVNC**: [RealVNC](https://www.realvnc.com/en/) views and controls the
  Pi's desktop directly, same as sitting at the nav station.
- **VS Code Remote-SSH**: connect to `pi@signalk.mermug.com` (or
  `pi@10.0.1.1`). Useful for editing code or this repo on the Pi.

**Note**: Claude Code is installed on the Pi, under Zack's personal
account (see [Systems → Raspberry Pi](systems.md#raspberry-pi)).

## Testing

**Aboard** (on the Pi or any boat device):

```sh
getent hosts signalk.mermug.com                  # 192.168.8.50
curl -s https://signalk.mermug.com/signalk | head -c 150
```

**Remote**, laptop on AstroWarp (PowerShell):

```powershell
nslookup signalk.mermug.com                      # 10.0.1.1
Test-NetConnection signalk.mermug.com -Port 443  # TcpTestSucceeded : True
curl.exe https://signalk.mermug.com/signalk
```

**Remote**, phone on cellular with AstroWarp connected: open
`https://signalk.mermug.com/signalk` in the browser; Signal K's JSON means
it works.

Disconnect AstroWarp and repeat the remote test: it should fail. If it
still connects, something on your local network also answers at
`10.0.1.1` (a common default subnet), and you're not reaching the boat.

On the Pi, `echo $SSH_CLIENT` shows where an SSH session came from: a
`192.168.8.x` address is local, anything else (e.g. `10.9.x.x`) came in
over AstroWarp.

## If it goes wrong

- **Can't connect to AstroWarp at all**: confirm you have the current share
  link from Zack; links can be rotated.
- **"Connection refused" on the free plan**: check whether two devices are
  already connected, and disconnect one.
- **AstroWarp connects but nothing responds**: the Pi may be down or off the
  boat's network. See
  [Debugging → SignalK server not responding](debugging.md#signalk-server-not-responding).
- **Name fails remotely but `nslookup signalk.mermug.com 1.1.1.1` works**:
  your local router's DNS rebinding protection is dropping the private
  answer. Add an exception for `mermug.com` there.
- **Name returns `10.0.1.1` aboard**: the device isn't using the Slate for
  DNS (Private DNS, Private Relay), or the Slate record is missing. On the
  Slate, a VPN client's separate dnsmasq instance can reset local settings
  when the tunnel restarts; check with `uci show dhcp`.
- **Certificate warning**: see
  [HTTPS Proxy & Certificate](signalk.md#https-proxy-certificate).
