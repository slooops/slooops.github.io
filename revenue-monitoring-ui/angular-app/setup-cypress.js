const fs = require("fs");
const path = require("path");

// List of folders to create
const folders = [
  "cypress",
  "cypress/e2e",
  "cypress/support",
  "cypress/fixtures",
];

// List of files to create
const files = [
  { path: "cypress/e2e/example.cy.ts", content: "" },
  { path: "cypress/support/e2e.ts", content: "" },
  { path: "cypress/fixtures/example.json", content: "" },
];

// Helper function to create folders
const createFolders = () => {
  folders.forEach((folder) => {
    const folderPath = path.join(__dirname, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created folder: ${folderPath}`);
    }
  });
};

// Helper function to create files
const createFiles = () => {
  files.forEach(({ path: filePath, content }) => {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, content, "utf8");
      console.log(`Created file: ${fullPath}`);
    }
  });
};

// Main function to set up Cypress folders and files
const setupCypress = () => {
  try {
    createFolders();
    createFiles();
    console.log("Cypress setup complete!");
  } catch (error) {
    console.error("Error setting up Cypress:", error);
  }
};

// Run the setup
setupCypress();
