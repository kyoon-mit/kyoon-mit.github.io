// The site's repository on GitHub, through the REST API with the owner's
// token. A publish is one commit made with the Git data API, so a post and
// its images land together.
const API = 'https://api.github.com';

export class GitHubError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const encodePath = p => p.split('/').map(encodeURIComponent).join('/');

export function decodeBase64(b64) {
  return new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), c => c.charCodeAt(0)));
}

export class GitHub {
  constructor(token, repo, branch) {
    this.token = token;
    this.repo = repo;
    this.branch = branch;
    this.blobs = new Map();
  }

  // A request that hangs is given up after a while (longer for uploads), so a
  // publish never stays locked for good.
  async req(method, path, body, seconds = method === 'POST' ? 120 : 30) {
    const stop = new AbortController();
    const timer = setTimeout(() => stop.abort(), seconds * 1000);
    let r, text;
    try {
      r = await fetch(API + path, {
        method, cache: 'no-store', signal: stop.signal,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body ? {'Content-Type': 'application/json'} : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      // the answer is read within the time limit too
      text = r.status === 204 ? '' : await r.text();
    } catch (e) {
      throw new GitHubError(0, stop.signal.aborted ? 'GitHub did not answer in time; try again.' : 'Could not reach GitHub; check the connection.');
    } finally {
      clearTimeout(timer);
    }
    if (r.status === 204) return null;
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      // a cut-off answer is never taken for an empty one
      if (r.ok) throw new GitHubError(0, 'GitHub sent an answer that could not be read; try again.');
    }
    if (!r.ok) throw new GitHubError(r.status, (data && data.message) || r.statusText);
    if (data === null) throw new GitHubError(0, 'GitHub sent an empty answer; try again.');
    return data;
  }

  user() { return this.req('GET', '/user'); }
  repoInfo() { return this.req('GET', `/repos/${this.repo}`); }

  // the branch's newest commit and its tree
  async head() {
    const ref = await this.req('GET', `/repos/${this.repo}/git/ref/heads/${encodeURIComponent(this.branch)}`);
    const commit = await this.req('GET', `/repos/${this.repo}/git/commits/${ref.object.sha}`);
    return {sha: ref.object.sha, tree: commit.tree.sha};
  }

  // every file in the repository at ref (a branch, commit or tree), in one request
  async files(ref = this.branch) {
    const t = await this.req('GET', `/repos/${this.repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`);
    if (t.truncated) throw new GitHubError(0, 'the repository is too large to list in one request');
    return t.tree.filter(e => e.type === 'blob');
  }

  // files in a folder (none if it does not exist)
  async dir(path, ref = this.branch) {
    try {
      const d = await this.req('GET', `/repos/${this.repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`);
      return Array.isArray(d) ? d : [];
    } catch (e) {
      if (e.status === 404) return [];
      throw e;
    }
  }

  // a file's blob sha, or null if it is not there
  async fileSha(path, ref = this.branch) {
    try {
      const d = await this.req('GET', `/repos/${this.repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`);
      return Array.isArray(d) ? null : d.sha;
    } catch (e) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  // text of a blob; blobs never change, so each is fetched once
  blobText(sha) {
    if (!this.blobs.has(sha)) {
      const p = this.req('GET', `/repos/${this.repo}/git/blobs/${sha}`).then(b => decodeBase64(b.content));
      p.catch(() => this.blobs.delete(sha));
      this.blobs.set(sha, p);
    }
    return this.blobs.get(sha);
  }

  // One commit on the branch: files [{path, text} or {path, base64}] and
  // paths to delete. With base (a head from head()), it builds on that head
  // and fails if the branch moved since, so checks made on it still hold;
  // without, it builds on the newest head and retries when the branch moved.
  async commit(message, files, deletes = [], {base = null} = {}) {
    for (const f of files) {
      if (f.sha) continue;
      const body = f.base64 != null ? {content: f.base64, encoding: 'base64'} : {content: f.text, encoding: 'utf-8'};
      f.sha = (await this.req('POST', `/repos/${this.repo}/git/blobs`, body)).sha;
    }
    for (let attempt = 0; ; attempt++) {
      const head = base || await this.head();
      const tree = await this.req('POST', `/repos/${this.repo}/git/trees`, {
        base_tree: head.tree,
        tree: [
          ...files.map(f => ({path: f.path, mode: '100644', type: 'blob', sha: f.sha})),
          ...deletes.map(p => ({path: p, mode: '100644', type: 'blob', sha: null})),
        ],
      });
      const commit = await this.req('POST', `/repos/${this.repo}/git/commits`, {message, tree: tree.sha, parents: [head.sha]});
      try {
        await this.req('PATCH', `/repos/${this.repo}/git/refs/heads/${encodeURIComponent(this.branch)}`, {sha: commit.sha, force: false});
        return {commit: commit.sha, shas: Object.fromEntries(files.map(f => [f.path, f.sha]))};
      } catch (e) {
        // someone else changed the branch meanwhile: build on their commit
        if (base || e.status !== 422 || !/fast.forward/i.test(e.message) || attempt >= 2) throw e;
      }
    }
  }
}
