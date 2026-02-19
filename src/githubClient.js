'use strict';

const { Octokit } = require('@octokit/rest');

/**
 * Creates an authenticated Octokit client.
 * Throws if required environment variables are missing.
 */
function createGitHubClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }
  return new Octokit({ auth: token });
}

/**
 * Returns the owner and repo from environment variables.
 * Throws if either is missing.
 */
function getRepoContext() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!owner || !repo) {
    throw new Error('GITHUB_OWNER and GITHUB_REPO environment variables are required');
  }
  return { owner, repo };
}

module.exports = { createGitHubClient, getRepoContext };
