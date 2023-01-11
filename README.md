# Get JIRA tickets from latest github release Action
This action will enable you to get all JIRA tickets out of the latest GitHub release

## Inputs

### `repo`
**Required** The repository where you want to check the latest release from

### `PAT`
**Required** The GitHub Personal Access Token which has read access to the repository's release information

### `releaseName`
The GitHub Release's name that you want to grab the tickets from.
**Default** latest

## Outputs

### `jiraTickets`
An array of all jiraTickets that are mentioned in the latest GitHub release

