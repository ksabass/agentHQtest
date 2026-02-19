'use strict';

const request = require('supertest');

// Mock the githubClient module before requiring the app
jest.mock('../src/githubClient', () => ({
  createGitHubClient: jest.fn(),
  getRepoContext: jest.fn(() => ({ owner: 'testowner', repo: 'testrepo' })),
}));

const { createGitHubClient } = require('../src/githubClient');
const app = require('../src/app');

const mockOctokit = {
  issues: {
    listForRepo: jest.fn(),
    create: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  createGitHubClient.mockReturnValue(mockOctokit);
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /issues', () => {
  it('returns list of issues', async () => {
    const issues = [{ number: 1, title: 'Test issue' }];
    mockOctokit.issues.listForRepo.mockResolvedValue({ data: issues });

    const res = await request(app).get('/issues');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(issues);
    expect(mockOctokit.issues.listForRepo).toHaveBeenCalledWith({
      owner: 'testowner',
      repo: 'testrepo',
      state: 'open',
      labels: undefined,
      per_page: 30,
      page: 1,
    });
  });

  it('passes query params to GitHub API', async () => {
    mockOctokit.issues.listForRepo.mockResolvedValue({ data: [] });

    await request(app).get('/issues?state=closed&labels=bug&per_page=10&page=2');
    expect(mockOctokit.issues.listForRepo).toHaveBeenCalledWith({
      owner: 'testowner',
      repo: 'testrepo',
      state: 'closed',
      labels: 'bug',
      per_page: 10,
      page: 2,
    });
  });

  it('returns 500 when GitHub API fails', async () => {
    mockOctokit.issues.listForRepo.mockRejectedValue(new Error('API error'));

    const res = await request(app).get('/issues');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'API error' });
  });
});

describe('POST /issues', () => {
  it('creates a new issue and returns 201', async () => {
    const newIssue = { number: 2, title: 'New issue', body: 'Details' };
    mockOctokit.issues.create.mockResolvedValue({ data: newIssue });

    const res = await request(app)
      .post('/issues')
      .send({ title: 'New issue', body: 'Details' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(newIssue);
    expect(mockOctokit.issues.create).toHaveBeenCalledWith({
      owner: 'testowner',
      repo: 'testrepo',
      title: 'New issue',
      body: 'Details',
      labels: undefined,
      assignees: undefined,
    });
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/issues').send({ body: 'No title' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title is required' });
  });

  it('returns 400 when title is empty string', async () => {
    const res = await request(app).post('/issues').send({ title: '   ' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title is required' });
  });
});

describe('GET /issues/:number', () => {
  it('returns a single issue', async () => {
    const issue = { number: 1, title: 'Test issue' };
    mockOctokit.issues.get.mockResolvedValue({ data: issue });

    const res = await request(app).get('/issues/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(issue);
    expect(mockOctokit.issues.get).toHaveBeenCalledWith({
      owner: 'testowner',
      repo: 'testrepo',
      issue_number: 1,
    });
  });

  it('returns 400 for non-numeric issue number', async () => {
    const res = await request(app).get('/issues/abc');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid issue number' });
  });

  it('returns 404 when issue not found', async () => {
    const err = new Error('Not Found');
    err.status = 404;
    mockOctokit.issues.get.mockRejectedValue(err);

    const res = await request(app).get('/issues/999');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not Found' });
  });
});

describe('PATCH /issues/:number', () => {
  it('updates an issue', async () => {
    const updated = { number: 1, title: 'Updated', state: 'open' };
    mockOctokit.issues.update.mockResolvedValue({ data: updated });

    const res = await request(app)
      .patch('/issues/1')
      .send({ title: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });

  it('returns 400 for invalid state value', async () => {
    const res = await request(app)
      .patch('/issues/1')
      .send({ state: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'state must be "open" or "closed"' });
  });

  it('returns 400 for non-numeric issue number', async () => {
    const res = await request(app).patch('/issues/abc').send({ title: 'x' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid issue number' });
  });
});

describe('POST /issues/:number/close', () => {
  it('closes an issue', async () => {
    const closed = { number: 1, title: 'Test', state: 'closed' };
    mockOctokit.issues.update.mockResolvedValue({ data: closed });

    const res = await request(app).post('/issues/1/close');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(closed);
    expect(mockOctokit.issues.update).toHaveBeenCalledWith({
      owner: 'testowner',
      repo: 'testrepo',
      issue_number: 1,
      state: 'closed',
    });
  });

  it('returns 400 for non-numeric issue number', async () => {
    const res = await request(app).post('/issues/abc/close');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid issue number' });
  });
});
