import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERNAME = 'Miguel-Galrito';
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.warn('⚠️ GITHUB_TOKEN not found. Make sure it is set for real data. Using mock data for now if running locally without token.');
}

const GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';

const queryPinned = `
{
  user(login: "${USERNAME}") {
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name
          description
          url
          stargazerCount
          forkCount
          primaryLanguage {
            name
            color
          }
          repositoryTopics(first: 5) {
            nodes {
              topic {
                name
              }
            }
          }
          languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
            edges {
              size
              node {
                name
              }
            }
            totalSize
          }
        }
      }
    }
  }
}
`;

const queryRecent = `
{
  user(login: "${USERNAME}") {
    repositories(first: 10, orderBy: {field: UPDATED_AT, direction: DESC}, isFork: false) {
      nodes {
        name
        description
        url
        stargazerCount
        forkCount
        primaryLanguage {
          name
          color
        }
        repositoryTopics(first: 5) {
          nodes {
            topic {
              name
            }
          }
        }
        languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
          edges {
            size
            node {
              name
            }
          }
          totalSize
        }
      }
    }
  }
}
`;

async function fetchGitHub(query) {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function processRepos(reposData) {
  return reposData.map(repo => {
    // Process languages into percentages
    const languages = repo.languages?.edges.map(edge => ({
      name: edge.node.name,
      percentage: repo.languages.totalSize > 0 
        ? Math.round((edge.size / repo.languages.totalSize) * 100) 
        : 0
    })) || [];

    return {
      name: repo.name,
      description: repo.description || 'No description provided.',
      url: repo.url,
      stars: repo.stargazerCount,
      forks: repo.forkCount,
      primaryLanguage: repo.primaryLanguage?.name || 'Unknown',
      topics: repo.repositoryTopics?.nodes.map(n => n.topic.name) || [],
      languages
    };
  });
}

async function run() {
  const publicDir = path.join(__dirname, '../public/data');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const outFile = path.join(publicDir, 'repos.json');

  if (!TOKEN) {
    // Write some dummy data if no token
    const dummy = [
      {
        name: "Aerospace-Telemetry",
        description: "Real-time telemetry processing engine for orbital mechanics.",
        url: "#",
        stars: 42,
        forks: 5,
        primaryLanguage: "C++",
        topics: ["aerospace", "systems", "cpp"],
        languages: [{name: "C++", percentage: 80}, {name: "CMake", percentage: 20}]
      },
      {
        name: "AI-Pathfinder",
        description: "Neural network pathfinding for autonomous drones.",
        url: "#",
        stars: 128,
        forks: 12,
        primaryLanguage: "Python",
        topics: ["ai", "machine-learning", "robotics"],
        languages: [{name: "Python", percentage: 95}, {name: "Jupyter Notebook", percentage: 5}]
      },
      {
        name: "Web-Dashboard",
        description: "Frontend interface for drone control.",
        url: "#",
        stars: 15,
        forks: 2,
        primaryLanguage: "TypeScript",
        topics: ["web", "react", "dashboard"],
        languages: [{name: "TypeScript", percentage: 70}, {name: "CSS", percentage: 30}]
      },
      {
        name: "Rust-Core",
        description: "High performance systems core.",
        url: "#",
        stars: 88,
        forks: 10,
        primaryLanguage: "Rust",
        topics: ["systems", "rust"],
        languages: [{name: "Rust", percentage: 100}]
      }
    ];
    fs.writeFileSync(outFile, JSON.stringify(dummy, null, 2));
    console.log('Written dummy data to', outFile);
    return;
  }

  try {
    console.log('Fetching pinned repositories...');
    let data = await fetchGitHub(queryPinned);
    let repos = data.data?.user?.pinnedItems?.nodes || [];

    if (repos.length === 0) {
      console.log('No pinned repos found, fetching recent ones...');
      data = await fetchGitHub(queryRecent);
      repos = data.data?.user?.repositories?.nodes || [];
    }

    const processed = processRepos(repos);
    fs.writeFileSync(outFile, JSON.stringify(processed, null, 2));
    console.log(`Successfully wrote ${processed.length} repositories to ${outFile}`);

  } catch (error) {
    console.error('Error fetching repos:', error);
    process.exit(1);
  }
}

run();
