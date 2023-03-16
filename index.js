const core = require("@actions/core");
const github = require("@actions/github");
const axios = require("axios");

const main = async () => {
    try {
        const jiraTickets = [];
        // `who-to-greet` input defined in action metadata file
        const repo = core.getInput("repo");
        console.log(`Getting latest release from ${repo}`);
        const pat = core.getInput("PAT");
        const releaseToFetch = core.getInput("releaseName");
        
        // Get the list of releases for the repository
        const releasesResponse = await axios.get(
          `https://api.github.com/repos/${repo}/releases`,
          {
            headers: {
              Authorization: `token ${pat}`,
            },
          }
        );

        let release;

        // get the correct release or the latest
        if (releaseToFetch !== 'latest' && releaseToFetch !== '') {
          release = releasesResponse.data.find(rel => rel.name === releaseToFetch);
        } else {
          release = releasesResponse.data[0];
        }
      
        // Extract the PR numbers from the release body
        const prNumbers = [];
        const body = release.body;
        const lines = body.split("\n");
        lines.forEach((line) => {
          const start = "pull/";
          const end = "\r";
          const startCheck = line.split(start)[1];
          if (startCheck) {
            const middle = startCheck.split(end)[0];
      
            if (middle) {
              prNumbers.push(middle);
            }
          }
        });
      
        const addTickets = (lines) => {
          for (let index = 0; index < lines.length; index++) {
            const match = lines[index].match(/\b[A-Z]+-\d+\b/);
            if (match && match.length) {
              if (match[0] && !jiraTickets.find((tc) => tc === match[0])) {
                jiraTickets.push(match[0]);
              }
            }
          }
        };
      
        const getPrs = async () => {
          for (let index = 0; index < prNumbers.length; index++) {
            // Get the PR
            const prResponse = await axios.get(
              `https://api.github.com/repos/${repo}/pulls/${prNumbers[index]}`,
              {
                headers: {
                  Authorization: `token ${pat}`,
                },
              }
            );
            const pr = prResponse.data;
      
            // Extract the JIRA ticket numbers from the PR description
      
            const description = pr.body;
            if (description) {
              const desclines = description.split("\n");
      
              addTickets(desclines);
            }
          }
          console.log(jiraTickets);
        };
      
        await getPrs();
        core.setOutput("jiraTickets", jiraTickets);

      } catch (error) {
        core.setFailed(error.message);
      }      
}

main();