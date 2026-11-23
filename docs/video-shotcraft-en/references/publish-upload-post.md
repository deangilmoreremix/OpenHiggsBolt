# Publishing to social platforms: final cut → TikTok / Instagram / YouTube / LinkedIn / X …

Publish the delivered MP4 in one go to TikTok, Instagram (Reels or Stories), YouTube (including Shorts),
LinkedIn, Facebook, X, Threads, Pinterest and Bluesky, either immediately or scheduled.
The script is `publish/upload_post.py`; it works through the [Upload-Post](https://upload-post.com) API
and uses only the Python standard library (no venv / pip needed).

**When to trigger**: only run this when the user **actively asks** to publish the final cut to social platforms (e.g. "post it to
TikTok and YouTube for me"). It is not a 4th recommendation beyond the delivery wrap-up 1-2-3; do not promote it proactively.
Publishing is a public and hard-to-undo operation, so **you must first have the user confirm the copy and the list of platforms** before actually publishing.

> **Note**: Upload-Post is a third-party hosted service. The free tier allows 10 uploads per month and covers all of the platforms above except
> TikTok (TikTok requires a paid tier). This workflow only goes online when the user has configured their own API key.

## 1. One-time setup (done by the user)

1. Sign up at https://upload-post.com, create a profile, and connect the social accounts you want to post to to this profile.
2. Create an API key in the dashboard.
3. Set the environment variables (or put them in the user's own shell config):

```bash
export UPLOAD_POST_API_KEY=...
export UPLOAD_POST_USER=<profile name>
```

If these two variables are missing, tell the user the three steps above, stop and wait; do not attempt to publish.

## 2. Choosing the file and preparing the copy

- **File**: use the delivered final cut. Videos with BGM come in two versions (with BGM / without BGM); by default publish
  the **version with BGM**; if the user asks otherwise, do what the user says.
- **Aspect ratio**: TikTok, Reels and Shorts need vertical 9:16. When the final cut is horizontal 16:9, tell the user truthfully
  (these platforms will add black bars or crop), and suggest posting to YouTube / LinkedIn / X / Facebook instead, or rendering a separate
  vertical version.
- **Copy `--title`**: on TikTok / Instagram / X / Threads this is the post body, so write it as social copy
  (one hook line + 2–4 hashtags), not as a YouTube title. When YouTube is included, ≤100 characters.
  If in item 1 of the delivery wrap-up the user agreed to @ the author, put that line in the copy.
- **Long description `--description`**: used by YouTube / LinkedIn / Facebook / Pinterest.
- **AI disclosure `--ai-generated`**: ask the user whether to label the content as AI-generated. The final cut is rendered by the Agent in code,
  and generally does not count as "realistic synthetic imagery", so by default it is not labeled; when AI-generated visuals or AI voice-over were used, labeling is recommended.

Put together "copy + description + platform list + schedule (if any) + privacy settings per platform" for the user,
and only move on to the next step **after getting explicit confirmation**.

## 3. Dry-run first (does not publish)

```bash
python3 publish/upload_post.py --video out/promo.mp4 --title "<copy>" \
  --description "<long description>" --platforms tiktok,instagram,youtube --dry-run --json-out
```

Check the output: `authOk` is `true`; a non-empty `missingPlatforms` means those platforms are not connected to the profile
and will be skipped — tell the user to connect them in the dashboard, or remove them from the list.

## 4. Publishing

Remove `--dry-run` and run again. The script waits for each platform's result (by default up to 10 minutes) and outputs a link or an error per platform.

- **Run each publish command only once.** Whether it's a timeout, a network drop, an error or `status: "unknown"`, **do not
  rerun the publish command** — rerunning generates a new request_id and the same video will be published twice. You can only query:
  `python3 publish/upload_post.py --status <requestId> --json-out`
- How the script tells them apart: only **400 / 401 / 403 / 422** (explicit rejection before the server accepts the request) count as failure; in that case
  nothing has been sent, and you can publish again after fixing the parameters. 5xx, gateway errors, timeouts, network drops, and 2xx without valid
  JSON all count as "uncertain" — the video may already have been accepted. The script automatically queries with the same request_id: if found, it
  continues as normal; if it still can't confirm, it outputs `status: "unknown"` (exit code 2), `requestId` and
  `statusCommand`, with `doNotRerun: true`.
- The script prints the `request_id` and the corresponding `--status` command to stderr **before sending**. If the process is
  interrupted midway, use this command to query; do not rerun the publish.
- Scheduled publishing (`--schedule 2026-10-01T09:00:00 --timezone Asia/Shanghai`) returns
  `jobId` + `requestId` and `statusCommand` immediately. Scheduled jobs are queried by **`jobId`**:
  `python3 publish/upload_post.py --status <jobId> --json-out` (the `statusCommand` in the output
  is exactly this command).

## 5. Reporting to the user

One line per platform: the link, or the reason.

| Platform result | Meaning |
|---|---|
| `completed` + `url` | Published. Private posts have no public link: YouTube still gives a link viewable by the owner; other platforms give `postId` + `note` |
| `skipped` | The profile isn't connected to this platform; not posted |
| `failed` / `retryable` | `error` is the reason given by the platform (e.g. account authorization expired — reconnect in the dashboard); `retryable` will be retried automatically by the server |
| TikTok `inbox: true` | TikTok put the video in the drafts inbox; the user needs to tap publish in the TikTok app |
| Overall `status: "unknown"` | It can't be confirmed whether it was accepted. Tell the user the `requestId` verbatim and query later with `statusCommand`; **do not rerun the publish command** |

## 6. Parameter quick reference

| Parameter | Description |
|---|---|
| `--video` / `--title` | Final-cut path / copy shared across all platforms |
| `--description` / `--description-file` | Long description |
| `--platforms` | `tiktok,instagram,youtube,linkedin,facebook,x,threads,pinterest,bluesky` (aliases `twitter` `reels` `shorts`) |
| `--user` | Profile name, defaults to `$UPLOAD_POST_USER` |
| `--schedule` + `--timezone` | Scheduled publishing (≤365 days), IANA time zone, defaults to UTC |
| `--first-comment` | Automatically post a first comment after publishing |
| `--ai-generated` | AI-generated content disclosure (TikTok / Instagram / YouTube / X) |
| `--thumbnail` | Custom cover (YouTube, LinkedIn) |
| `--youtube-privacy` | `private` (default) / `unlisted` / `public` |
| `--tags` | YouTube tags, comma-separated |
| `--tiktok-privacy` / `--tiktok-draft` | TikTok privacy (defaults to the account setting) / save as draft only |
| `--instagram-story` | Post Stories instead of Reels |
| `--facebook-page-id` / `--linkedin-page-id` | Specify the Facebook page / publish as a LinkedIn company page |
| `--pinterest-board` | Required for Pinterest |
| `--status ID` | Query an earlier publish: request_id for immediate publishing, job_id for scheduled publishing |
| `--dry-run` / `--json-out` | Validate only, don't publish / output one line of JSON |

Error types (`errorType`): `auth` (key missing or wrong), `validation` (bad parameters, or none of the selected platforms is connected),
`forbidden` (plan doesn't support it, e.g. TikTok on the free tier), `quota` (rate or plan limit), `http` (network / server).

Offline unit tests: `python3 -m unittest publish/test_upload_post.py -v`
