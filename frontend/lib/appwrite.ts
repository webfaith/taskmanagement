import { Client, Account, Databases } from 'appwrite';

export const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
export const isAppwriteConfigured = Boolean(endpoint && projectId);

if (endpoint) {
    client.setEndpoint(endpoint);
}

if (projectId) {
    client.setProject(projectId);
}

export const account = new Account(client);
export const databases = new Databases(client);
