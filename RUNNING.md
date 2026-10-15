# Keep the project running

The local website runs as the `raditya-landing-page.service` user service. It does not depend on Codex or an open terminal, and automatically restarts if the server exits unexpectedly.

Automatic startup is enabled. User lingering is also enabled, so the service starts at boot and continues running after logout.

Open http://127.0.0.1:8000/ in a browser. Source edits appear after refreshing the page.

## Service controls

```bash
systemctl --user status raditya-landing-page.service
systemctl --user restart raditya-landing-page.service
systemctl --user stop raditya-landing-page.service
journalctl --user -u raditya-landing-page.service -n 50 --no-pager
```

To disable automatic startup:

```bash
systemctl --user disable --now raditya-landing-page.service
```

The service definition is in `ops/raditya-landing-page.service` and installed in `~/.config/systemd/user/`. If the project directory moves, update that installed file and run `systemctl --user daemon-reload`, then restart the service.

The server is accessible only on this computer. The computer must be powered on and awake; public 24/7 availability requires deployment to a hosting service.
