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

## Troubleshooting Git 403 Forbidden Errors on Mac

A `403 Forbidden` error on push means GitHub is rejecting your credentials—either because passwords are no longer supported over HTTPS, or because macOS Keychain is using a cached password from another GitHub account. Here are the 3 ways to fix it:

### Method A: Switch to SSH (Recommended)
SSH keys bypass password prompts and Keychain caching issues entirely. If you have SSH keys set up in GitHub:

1. Update your remote URL to use SSH:
   ```bash
   git remote set-url origin git@github.com:Aravind-neurostellar/Orbit-Endurance-test.git
   ```
2. Push again:
   ```bash
   git push -u origin main
   ```
*(If you get a permission error, ensure your SSH agent is running and keys are loaded: `ssh-add -K ~/.ssh/id_ed25519` or `id_rsa`).*

---

### Method B: Embed your GitHub Personal Access Token (PAT)
GitHub disabled password authentication for HTTPS in 2021. You must use a Personal Access Token (PAT) as your password.

1. Generate a token:
   - Go to [GitHub Token Settings](https://github.com/settings/tokens).
   - Click **Generate new token (classic)**.
   - Set a name (e.g. "Mac Push") and select the **repo** scope (access to repositories).
   - Click **Generate token** and copy it immediately.
2. Update your remote URL to embed this token:
   ```bash
   git remote set-url origin https://YOUR_TOKEN_HERE@github.com/Aravind-neurostellar/Orbit-Endurance-test.git
   ```
   *(Replace `YOUR_TOKEN_HERE` with the copied token).*
3. Push again:
   ```bash
   git push -u origin main
   ```

---

### Method C: Clear macOS Keychain Credentials
If your Mac is trying to push using cached credentials from a different GitHub account:

1. Open **Keychain Access** (Press `Cmd + Space` to open Spotlight, type "Keychain Access", and hit enter).
2. Search for `github.com` in the top-right search bar.
3. Locate the entry of kind "Internet Password" for `github.com` and **Delete** it.
4. Go back to terminal and push:
   ```bash
   git push -u origin main
   ```
5. Terminal will ask for your Username and Password. Enter your GitHub username, and for the password, **paste your Personal Access Token (PAT)**.

