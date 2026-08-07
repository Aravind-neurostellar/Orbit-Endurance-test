# Git Command Instructions for Mac Terminal

Since Git is not yet initialized in this folder, follow these steps to initialize Git, commit your code files, link it to your remote repository, and push it successfully.

### Step 1: Open the Terminal and Navigate
Ensure your terminal is in the project directory. If not, open Terminal and run:
```bash
cd "/Users/dell/Code projects/Orbit - Endurance test"
```

### Step 2: Initialize Git
Initialize a local Git repository in this folder:
```bash
git init
```

### Step 3: Add Files to Staging
Add all the project files (index.html, styles.css, app.js, GoogleAppsScript.gs) to the staging area:
```bash
git add .
```

To ignore log files or temporary files (like `server_output.log`), you can create a `.gitignore` file. Let's create one by running:
```bash
echo "server_output.log" > .gitignore
git add .gitignore
```

### Step 4: Make Your First Commit
Commit the staged files with a descriptive message:
```bash
git commit -m "feat: initial commit of SART2 and N-Back suite with Google Sheets integration"
```

### Step 5: Configure the Main Branch
GitHub and GitLab use `main` as the default branch name. Rename the default branch:
```bash
git branch -M main
```

### Step 6: Link to Your Remote Repository
Link your local repository to the online repository. **Replace `YOUR_REPOSITORY_URL`** with your actual Git repository URL (e.g., `https://github.com/username/repo-name.git` or ssh version):
```bash
git remote add origin YOUR_REPOSITORY_URL
```

### Step 7: Push the Code Online
Push your files to the origin remote:
```bash
git push -u origin main
```

---

## Troubleshooting Mac Terminal Permissions
If you get a SSH permission error, ensure your SSH key is added:
```bash
ssh-add -K ~/.ssh/id_ed25519
```
If you need to switch origin URL from HTTPS to SSH (or vice versa):
```bash
git remote set-url origin git@github.com:username/repo-name.git
```
