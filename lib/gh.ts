import { spawn } from 'node:child_process'

const GH_BIN = 'gh'

export type GitHubCliResult = {
  stdout: string
  stderr: string
  exitCode: number
}

async function runGh(args: string[], opts: { cwd?: string; env?: Record<string, string | undefined> } = {}) {
  const { cwd, env } = opts
  const mergedEnv = { ...process.env, ...env }

  return new Promise<GitHubCliResult>((resolve) => {
    const child = spawn(GH_BIN, args, { cwd, env: mergedEnv, stdio: ['ignore', 'pipe', 'pipe'] })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('close', (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code ?? 0,
      })
    })
  })
}

export async function ghIssueList(owner: string, repo: string, state = 'open') {
  return runGh(['issue', 'list', `--repo=${owner}/${repo}`, `--state=${state}`, '--json=number,title,state,url,createdAt', '--limit=100'])
}

export async function ghIssueCreate(owner: string, repo: string, params: { title: string; body?: string; labels?: string[] }) {
  const args = ['issue', 'create', `--repo=${owner}/${repo}`, '--title', params.title]

  if (params.body) {
    args.push('--body', params.body)
  }

  if (params.labels?.length) {
    args.push('--label', params.labels.join(','))
  }

  return runGh(args)
}

export async function ghAuthStatus() {
  return runGh(['auth', 'status'])
}
