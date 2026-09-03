import { Octokit } from '@octokit/rest'

const token = process.env.GITHUB_TOKEN || ''

export const octokit = new Octokit({
  auth: token ? `token ${token}` : undefined,
  userAgent: 'OpenHiggsBolt',
})

export type GitHubIssue = {
  number: number
  title: string
  state: string
  url: string
  created_at: string
}

export type GitHubRepo = {
  owner: string
  repo: string
}

export async function listIssues({ owner, repo }: GitHubRepo, state = 'open') {
  const { data } = await octokit.issues.listForRepo({
    owner,
    repo,
    state,
    per_page: 100,
  })

  return data.map((issue) => ({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    url: issue.html_url,
    created_at: issue.created_at,
  })) as GitHubIssue[]
}

export async function createIssue({ owner, repo }: GitHubRepo, params: { title: string; body?: string; labels?: string[] }) {
  const { data } = await octokit.issues.create({
    owner,
    repo,
    title: params.title,
    body: params.body,
    labels: params.labels,
  })

  return {
    number: data.number,
    title: data.title,
    state: data.state,
    url: data.html_url,
    created_at: data.created_at,
  } as GitHubIssue
}
