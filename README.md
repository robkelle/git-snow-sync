# Github ServiceNow Sync

Optimize your ServiceNow experience by using git-sync a tool that enables you to run scheduled backups of your in progress update sets.
This tool creates a scheduled job and UI Action button displayed in your update set table. The only thing required is that you configure your Github information.
A detailed setup is provided below under the deployment section.

## Getting Started

These instructions will get you a copy of the project up and running on your own ServiceNow instance.
See deployment for notes on how to deploy the project on a live system.

### Prerequisites

```
ServiceNow Instance (Istanbul or above)
Github (Private repository recommended)
```

### Installing

A step by step series of examples that tell you how to get a development environment up and running

1.) Upload update set:

```
Import XML GITSYNC_UISCRIPT_v0.0.1.xml into the sys_update_set table
```

2.) Modify UI Action "Github Sync" to add your personal or team specific github information. The following is going to change:
Github username,
Github repository name,
directory name where recovered update sets will be backed up,
Github bearer token (this needs to be generated in Github [Read More](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)),
Github email. Example code that needs to be changed is provided below, which is also located in gitAutoSync.js.

```
const GIT_USER_NAME = 'TestUser';
const GIT_REPO_NAME = 'git-snow-sync';
const GIT_PATH_NAME = 'log';
const TOKEN = '';
const URI = 'https://api.github.com/repos/' + GIT_USER_NAME + '/' + GIT_REPO_NAME + '/contents/' + GIT_PATH_NAME + '/';
const FULL = 'ServiceNow sync';
const EMAIL = 'TestUser@gmail.com';
```

3.) Modify gitAutoSync.js same constant values mentioned above and then copy paste script to a scheduled job.
Schedule how frequent you want these files backed up and you should be finished configuring your Github Sync tool in ServiceNow!

## Authors

* **Rob Keller** - *Initial work* - [Profile](https://github.com/robkelle)

See also the list of [contributors](https://github.com/robkelle/git-snow-sync/graphs/contributors) who participated in this project.

## License

This project is licensed under the free License - see the [LICENSE.md](LICENSE.md) file for details
