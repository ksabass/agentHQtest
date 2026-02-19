'use strict';

const express = require('express');
const { createGitHubClient, getRepoContext } = require('../githubClient');

const router = express.Router();

/**
 * GET /issues
 * List issues for the configured repository.
 * Query params: state (open|closed|all), labels, per_page, page
 */
router.get('/', async (req, res) => {
  try {
    const octokit = createGitHubClient();
    const { owner, repo } = getRepoContext();
    const { state = 'open', labels, per_page = 30, page = 1 } = req.query;

    const { data } = await octokit.issues.listForRepo({
      owner,
      repo,
      state,
      labels,
      per_page: Number(per_page),
      page: Number(page),
    });

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/**
 * POST /issues
 * Create a new issue.
 * Body: { title (required), body, labels, assignees }
 */
router.post('/', async (req, res) => {
  try {
    const { title, body, labels, assignees } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'title is required' });
    }

    const octokit = createGitHubClient();
    const { owner, repo } = getRepoContext();

    const { data } = await octokit.issues.create({
      owner,
      repo,
      title: title.trim(),
      body,
      labels,
      assignees,
    });

    res.status(201).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/**
 * GET /issues/:number
 * Get a single issue by its number.
 */
router.get('/:number', async (req, res) => {
  try {
    const issue_number = parseInt(req.params.number, 10);
    if (isNaN(issue_number) || issue_number < 1) {
      return res.status(400).json({ error: 'Invalid issue number' });
    }

    const octokit = createGitHubClient();
    const { owner, repo } = getRepoContext();

    const { data } = await octokit.issues.get({ owner, repo, issue_number });
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/**
 * PATCH /issues/:number
 * Update an existing issue.
 * Body: { title, body, state (open|closed), labels, assignees }
 */
router.patch('/:number', async (req, res) => {
  try {
    const issue_number = parseInt(req.params.number, 10);
    if (isNaN(issue_number) || issue_number < 1) {
      return res.status(400).json({ error: 'Invalid issue number' });
    }

    const { title, body, state, labels, assignees } = req.body;

    if (state && !['open', 'closed'].includes(state)) {
      return res.status(400).json({ error: 'state must be "open" or "closed"' });
    }

    const octokit = createGitHubClient();
    const { owner, repo } = getRepoContext();

    const { data } = await octokit.issues.update({
      owner,
      repo,
      issue_number,
      title,
      body,
      state,
      labels,
      assignees,
    });

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/**
 * POST /issues/:number/close
 * Close an issue by setting its state to "closed".
 */
router.post('/:number/close', async (req, res) => {
  try {
    const issue_number = parseInt(req.params.number, 10);
    if (isNaN(issue_number) || issue_number < 1) {
      return res.status(400).json({ error: 'Invalid issue number' });
    }

    const octokit = createGitHubClient();
    const { owner, repo } = getRepoContext();

    const { data } = await octokit.issues.update({
      owner,
      repo,
      issue_number,
      state: 'closed',
    });

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
