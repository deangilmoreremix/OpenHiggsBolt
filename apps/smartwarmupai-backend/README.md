# SmartWarmupAI backend on Beam (API + mail worker + event consumer in one pod)

The Beam pod runs Postgres, Redis and NATS on 127.0.0.1 and the API. The mail worker (connects mailboxes, sends, syncs, warms up) and the
event consumer need those same services, so they run in this pod too (`RUN_WORKER=0` starts the API alone, as before).

## Build inputs
- `src/`: the upstream server sources (`apps/warmbly-server` of remix-new-editor, commit in `src/UPSTREAM.md`). Not committed (about 50 MB).
  Copy that folder here as `src/`.
- `Dockerfile.beam`: multi-stage build. Go stage compiles `backend migrate warmblyctl worker consumer` (CGO-free); runtime stage is Debian 12
  with Postgres 16, Redis, NATS 2.15 and tini.
- `entrypoint.sh`: the original boot script plus starting the consumer and worker once the API reports healthy.
- `env.sh`: upstream's published development defaults. Real keys come from Beam secrets and always win.

## Deploy (scale to zero, never always-on)
Run from this folder. Same name, disk and secrets as the existing deployment, so it becomes the next version of `smartwarmupai-backend`:

```bash
beam deploy --dockerfile Dockerfile.beam --name smartwarmupai-backend --port 8080 --cpu 2 --memory 6Gi --cpu-tier performance \
  --disk smartwarmupai-data:/data:20Gi --env SSO_AUTO_PROVISION=true \
  --secrets KMS_LOCAL_MASTER_KEY,CREDENTIALS_ENCRYPTION_KEY,AUTH_SECRET,PORTAL_EDGE_TOKEN,INTERNAL_API_TOKEN,STUDIO_ORIGINS,APP_URL,CLERK_ISSUER,CLERK_SECRET_KEY,CLERK_AUTHORIZED_PARTIES \
  --scale-to-zero --min-replicas 0 --max-replicas 1 --keep-warm-seconds 600
```

Roll back with `beam deployment start <previous version id>`; data on the `/data` disk is untouched by a new version.

## Limit
Scale-to-zero wakes the pod on an HTTP request only. The worker does outbound work (IMAP, scheduled sends, warmup), so it runs only while
the pod is awake (`--keep-warm-seconds`). Fine for testing; for real warmup the pod must stay up.
