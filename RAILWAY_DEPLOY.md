# Railway Deployment Guide

This guide will help you deploy your Discord bot to Railway.

## Prerequisites

1. A GitHub account
2. A Railway account (sign up at https://railway.app)
3. Your Discord bot token and client ID from the [Discord Developer Portal](https://discord.com/developers/applications)

## Step 1: Push Your Code to GitHub

1. If you haven't already, initialize a git repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub and push your code:
   ```bash
   git remote add origin <your-github-repo-url>
   git branch -M main
   git push -u origin main
   ```

## Step 2: Create a Railway Project

1. Go to https://railway.app and sign in with GitHub
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect it's a Node.js project

## Step 3: Configure Environment Variables

In your Railway project dashboard:

1. Go to your service → **Variables** tab
2. Add the following **required** environment variables:

   | Variable | Description | Example |
   |----------|-------------|---------|
   | `TOKEN` | Your Discord bot token | `your-bot-token-here` |
   | `CLIENT_ID` | Your Discord bot client ID | `123456789012345678` |
   | `OWNER_ID` | Your Discord user ID | `123456789012345678` |
   | `SERVER` | Environment type | `prod` (or `dev` for development) |

3. **Optional** environment variables (add if needed):
   - `DEV_TOKEN` - Development bot token (if using `SERVER=dev`)
   - `DATABASE_URL` - Database connection string (if using a database)
   - Any other variables your bot requires

## Step 4: Deploy

1. Railway will automatically start building and deploying your bot
2. Watch the build logs in the Railway dashboard
3. Once deployed, check the logs to ensure your bot started successfully
4. Your bot should now be online on Discord!

## Step 5: Verify Deployment

1. Check the Railway logs for any errors
2. Look for the "Bot started successfully" message in the logs
3. Test your bot in Discord with `/ping` or `/help`

## Troubleshooting

### Bot not starting?
- Check the Railway logs for errors
- Verify all required environment variables are set
- Ensure `SERVER` is set to either `prod` or `dev`

### Build fails?
- Check that `package.json` is in the root directory
- Verify Node.js version compatibility (Railway uses Node 18+ by default)
- Check build logs for specific error messages

### Bot disconnects?
- Railway free tier may have resource limits
- Check Railway usage in the dashboard
- Consider upgrading if you hit limits

## Railway Free Tier Limits

- $5/month credit (usually enough for a small Discord bot)
- 512MB RAM
- 1GB disk space
- Always-on (no sleep)

## Updating Your Bot

1. Push changes to your GitHub repository
2. Railway will automatically detect changes and redeploy
3. Monitor the deployment logs

## Additional Notes

- Railway automatically handles HTTPS
- Your bot will restart automatically if it crashes
- Logs are available in the Railway dashboard
- You can set up custom domains if needed (paid feature)

## Support

If you encounter issues:
1. Check Railway logs
2. Check Discord bot logs in Railway
3. Verify all environment variables are correct
4. Ensure your bot has proper permissions in Discord

