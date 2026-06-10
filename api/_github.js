// Minimal GitHub Contents API client — commits files back to the repo so that
// schools.json / pending.json stay the versioned source of truth and each save
// triggers a Vercel redeploy.

const API = 'https://api.github.com';

function cfg() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'abirdbecker';
  const repo = process.env.GITHUB_REPO || 'bell-to-bell-tracker';
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!token) throw new Error('GITHUB_TOKEN is not configured');
  return { token, owner, repo, branch };
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'bell-to-bell-tracker',
  };
}

export async function getFile(path) {
  const { token, owner, repo, branch } = cfg();
  const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: headers(token),
  });
  if (res.status === 404) return { sha: null, content: null };
  if (!res.ok) throw new Error(`GitHub getFile ${path}: ${res.status}`);
  const json = await res.json();
  return { sha: json.sha, content: Buffer.from(json.content, 'base64').toString('utf8') };
}

export async function putFile(path, contentString, message) {
  const { token, owner, repo, branch } = cfg();
  const { sha } = await getFile(path);
  const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: Buffer.from(contentString, 'utf8').toString('base64'),
      branch,
      ...(sha ? { sha } : {}),
      committer: { name: 'b2b-tracker bot', email: 'noreply@paunplugged.org' },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub putFile ${path}: ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json();
}
