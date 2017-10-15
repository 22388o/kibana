const inquirer = require('inquirer');
const ora = require('ora');
const path = require('path');
const prompts = require('./prompts');
const { withSpinner } = require('./utils');
const github = require('./github');
const constants = require('./constants');
const { getConfigFilePath, getRepoPath } = require('./env');

const {
  resetAndPullMaster,
  cherrypick,
  createAndCheckoutBranch,
  push,
  repoExists,
  setupRepo
} = require('./git');

const service = {};
service.doBackportVersion = ({
  owner,
  repoName,
  commit,
  reference,
  version,
  username
}) => {
  const backportBranchName = getBackportBranchName(version, reference);

  return withSpinner(
    resetAndPullMaster(owner, repoName).then(() =>
      createAndCheckoutBranch(owner, repoName, version, backportBranchName)
    ),
    'Pulling latest changes'
  )
    .then(() => cherrypickAndPrompt(owner, repoName, commit.sha))
    .then(() =>
      withSpinner(
        push(owner, repoName, username, backportBranchName),
        `Pushing branch ${username}:${backportBranchName}`
      )
    )
    .then(() => {
      const payload = getPullRequestPayload(
        commit.message,
        version,
        reference,
        username
      );
      return withSpinner(
        github.createPullRequest(owner, repoName, payload),
        'Creating pull request'
      );
    });
};

service.getReference = (owner, repoName, commitSha) => {
  return github
    .getPullRequestByCommit(owner, repoName, commitSha)
    .then(pullRequest => {
      if (pullRequest) {
        return { type: 'pullRequest', value: pullRequest };
      }

      return { type: 'commit', value: commitSha.slice(0, 7) };
    });
};

service.getRepoInfo = (repositories, cwd) => {
  return Promise.resolve()
    .then(() => {
      const fullRepoNames = repositories.map(repo => repo.name);
      const currentFullRepoName = getCurrentFullRepoName(fullRepoNames, cwd);
      if (currentFullRepoName) {
        console.log(`Repository: ${currentFullRepoName}`);
        return currentFullRepoName;
      }
      return inquirer
        .prompt([prompts.listFullRepositoryName(fullRepoNames)])
        .then(({ fullRepoName }) => fullRepoName);
    })
    .then(fullRepoName => {
      const [owner, repoName] = fullRepoName.split('/');
      return { owner, repoName };
    });
};

service.maybeSetupRepo = (owner, repoName, username) => {
  return repoExists(owner, repoName).then(exists => {
    if (!exists) {
      return withSpinner(
        setupRepo(owner, repoName, username),
        'Cloning repository (may take a few minutes the first time)'
      );
    }
  });
};

service.getCommit = (owner, repoName, username) => {
  const spinner = ora('Loading commits...').start();
  return github
    .getCommits(owner, repoName, username)
    .then(commits => {
      spinner.stop();
      return inquirer.prompt([prompts.listCommits(commits)]);
    })
    .then(({ commit }) => commit);
};

service.getVersion = (owner, repoName, repositories) => {
  const versions = getVersions(owner, repoName, repositories);
  return inquirer
    .prompt([prompts.listVersions(versions)])
    .then(({ version }) => version);
};

service.handleErrors = e => {
  switch (e.message) {
    case constants.INVALID_CONFIG:
      console.log(
        `Welcome to the Backport CLI tool! Update this config to proceed: ${getConfigFilePath()}`
      );
      break;

    case constants.GITHUB_ERROR:
      console.error(JSON.stringify(e.details, null, 4));
      break;

    case constants.CHERRYPICK_CONFLICT_NOT_HANDLED:
      console.error('Merge conflict was not resolved', e.details);
      break;

    default:
      console.error(e);
  }
};

service.getReferenceValue = reference => {
  return reference.type === 'pullRequest'
    ? `pull request #${reference.value}`
    : `commit ${reference.value}`;
};

function getVersions(owner, repoName, repositories) {
  return repositories.find(repo => repo.name === `${owner}/${repoName}`)
    .versions;
}

function isCherrypickConflict(e) {
  return e.cmd.includes('git cherry-pick');
}

function cherrypickAndPrompt(owner, repoName, sha) {
  return withSpinner(
    cherrypick(owner, repoName, sha),
    'Cherry-picking commit',
    `Cherry-picking failed. Please resolve conflicts in: ${getRepoPath(
      owner,
      repoName
    )}`
  ).catch(e => {
    if (!isCherrypickConflict(e)) {
      throw e;
    }

    return inquirer
      .prompt([prompts.confirmConflictResolved()])
      .then(({ isConflictResolved }) => {
        if (!isConflictResolved) {
          const error = new Error(constants.CHERRYPICK_CONFLICT_NOT_HANDLED);
          error.details = e.message;
          throw error;
        }
      });
  });
}

function getBackportBranchName(version, reference) {
  const refValue = getReferenceValueShort(reference);
  return `backport/${version}/${refValue}`;
}

function getReferenceValueShort(reference) {
  return reference.type === 'pullRequest'
    ? `pr-${reference.value}`
    : `commit-${reference.value}`;
}

function getCurrentFullRepoName(fullRepoNames, cwd) {
  const currentDir = path.basename(cwd);
  return fullRepoNames.find(name => name.endsWith(`/${currentDir}`));
}

function getPullRequestPayload(commitMessage, version, reference, username) {
  const backportBranchName = getBackportBranchName(version, reference);
  const refValue = service.getReferenceValue(reference);

  return {
    title: `[Backport] ${commitMessage}`,
    body: `Backports ${refValue} to ${version}`,
    head: `${username}:${backportBranchName}`,
    base: `${version}`
  };
}

module.exports = service;
