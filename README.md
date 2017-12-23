# Github ServiceNow Sync

Optimize your ServiceNow experience by using git-sync a tool that enables you to run scheduled backups of your in progress update sets.
This tool creates a scheduled job and UI Action button displayed in your update set table. The only thing required is that you configure your Github information.
A detailed setup is provided below under the deployment section.

## Getting Started

These instructions will get you a copy of the project up and running on your own ServiceNow instance.
See deployment for notes on how to deploy the project on a live system.

### Prerequisites

```
ServiceNow Istanbul or above
Github
```

### Installing

A step by step series of examples that tell you how to get a development environment up and running

Upload update set:

```
Import XML GITSYNC.xml into the sys_update_set table
```

Modify script include to add your personal or team specific github information

```
const GIT_USER_NAME = ''; // Github username
const GIT_REPO_NAME = ''; // Github repository name
const GIT_PATH_NAME = ''; // Directory name where recovered in progress update sets will be back up into
const TOKEN = ''; // Github bearer token, this needs to be generated on the github side of things [Documentation](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)
const EMAIL = ''; // Github email
```

## Deployment

Add additional notes about how to deploy this on a live system

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags).

## Authors

* **Rob Keller** - *Initial work* - [Profile](https://github.com/robkelle)

See also the list of [contributors](https://github.com/robkelle/git-snow-sync/graphs/contributors) who participated in this project.

## License

This project is licensed under the free License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* CloudPires LLC
