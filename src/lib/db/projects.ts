import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface Project {
	id: string;
	name: string;
	content: string;
	createdAt: number;
	updatedAt: number;
}

export interface ShareRecord {
	shareId: string;
	projectId: string | null;
	title: string;
	createdAt: number;
	keyB64: string;
	url: string;
	contentHash?: string;
}

interface MarkdownEditorDB extends DBSchema {
	projects: {
		key: string;
		value: Project;
		indexes: { 'by-updated': number };
	};
	shares: {
		key: string;
		value: ShareRecord;
		indexes: { 'by-created': number };
	};
}

const DB_NAME = 'markdown-editor';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<MarkdownEditorDB>> | null = null;

function getDB(): Promise<IDBPDatabase<MarkdownEditorDB>> {
	if (!dbPromise) {
		dbPromise = openDB<MarkdownEditorDB>(DB_NAME, DB_VERSION, {
			upgrade(db, oldVersion) {
				if (oldVersion < 1) {
					const projects = db.createObjectStore('projects', { keyPath: 'id' });
					projects.createIndex('by-updated', 'updatedAt');
				}
				if (oldVersion < 2) {
					const shares = db.createObjectStore('shares', { keyPath: 'shareId' });
					shares.createIndex('by-created', 'createdAt');
				}
			}
		});
	}
	return dbPromise;
}

export async function getAllProjects(): Promise<Project[]> {
	const db = await getDB();
	const projects = await db.getAll('projects');
	return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(id: string): Promise<Project | undefined> {
	const db = await getDB();
	return db.get('projects', id);
}

export async function saveProject(project: Project): Promise<void> {
	const db = await getDB();
	await db.put('projects', {
		...project,
		updatedAt: Date.now()
	});
}

export async function deleteProject(id: string): Promise<void> {
	const db = await getDB();
	await db.delete('projects', id);
}

export async function createProject(name: string): Promise<Project> {
	const db = await getDB();
	const now = Date.now();
	const project: Project = {
		id: crypto.randomUUID(),
		name,
		content: '',
		createdAt: now,
		updatedAt: now
	};
	await db.put('projects', project);
	return project;
}

export async function saveShare(record: ShareRecord): Promise<void> {
	const db = await getDB();
	await db.put('shares', record);
}

export async function getAllShares(): Promise<ShareRecord[]> {
	const db = await getDB();
	const shares = await db.getAll('shares');
	return shares.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteShare(shareId: string): Promise<void> {
	const db = await getDB();
	await db.delete('shares', shareId);
}
