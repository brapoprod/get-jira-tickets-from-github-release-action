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
      
        // Get the list of releases for the repository
        const releasesResponse = await axios.get(
          `https://api.github.com/repos/${repo}/releases`,
          {
            headers: {
              Authorization: `token ${pat}`,
            },
          }
        );
      
        // Find the latest release
        const latestRelease = releasesResponse.data[0];
      
        // Extract the PR numbers from the release body
        const prNumbers = [];
        const body = latestRelease.body;
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
      
        const getJiraQuery = (tickets) => {
          const replaceString = "$TO_REPLACE";
          const baseUrl = `https://support.chili-publish.com/issues/?jql=(project%20%3D%20WRS%20or%20project%20%3D%20EDT%20or%20project%20%3D%20GRAFX)%20and%20key%20in%20(${replaceString})`;
      
          let ticketString = "";
      
          for (let index = 0; index < tickets.length; index++) {
            const ticket = tickets[index];
            if (index !== 0) ticketString += "%2C";
            ticketString += ticket;
          }
      
          return baseUrl.replace(replaceString, ticketString);
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
      
        getPrs().then((res) => {
          return;
        }).finally(fin => {
          core.setOutput("jiraTickets", jiraTickets);
        });
      
        // Get the JSON webhook payload for the event that triggered the workflow
        const payload = JSON.stringify(github.context.payload, undefined, 2);
        console.log(`The event payload: ${payload}`);
      } catch (error) {
        core.setFailed(error.message);
      }      
}

main();