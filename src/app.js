'use strict';

const express = require('express');
const issuesRouter = require('./routes/issues');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/issues', issuesRouter);

module.exports = app;
