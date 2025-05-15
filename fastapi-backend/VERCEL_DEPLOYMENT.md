# Vercel Deployment Guide

This guide explains how to deploy the FastAPI backend to Vercel while staying under the 250MB size limit.

## Overview

Vercel has a 250MB size limit for serverless functions. Python applications with dependencies like LangChain and Firebase Admin can easily exceed this limit. This project uses a custom build process to optimize the deployment size.

## How It Works

1. We use a custom build script (`build_vercel.sh`) that:
   - Installs only the minimal required dependencies
   - Removes unnecessary files and components
   - Optimizes the size of large dependencies

2. We use a simplified entry point (`vercel_app.py`) that:
   - Lazy loads components to reduce initial memory usage
   - Provides the same API endpoints as the main application

3. We use a `.vercelignore` file to exclude unnecessary files from the deployment.

## Deployment Steps

1. Make sure your Vercel project is connected to your GitHub repository.

2. Set the following environment variables in your Vercel project:
   - `EXPRESS_BACKEND_URL`: URL of your Express.js backend
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `FIREBASE_AUTH_DISABLED`: Set to "True" if Firebase auth is disabled

3. Deploy your project using the Vercel dashboard or CLI.

## Troubleshooting

If you encounter deployment issues:

1. Check the Vercel build logs for errors.
2. Make sure all required environment variables are set.
3. If you're still hitting the size limit, you may need to further optimize the `build_vercel.sh` script.

## Local Testing

To test the Vercel deployment locally:

1. Install the Vercel CLI: `npm install -g vercel`
2. Run `vercel dev` in the project directory

## Notes

- The `requirements.txt` file is used for local development.
- The `requirements-vercel.txt` file is used for Vercel deployment.
- The `build_vercel.sh` script is executed during the Vercel build process.
- The `vercel_app.py` file is the entry point for the Vercel deployment.
