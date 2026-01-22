import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface Project {
	id: string;
	name: string;
	content: string;
	createdAt: number;
	updatedAt: number;
}

interface MarkdownEditorDB extends DBSchema {
	projects: {
		key: string;
		value: Project;
		indexes: { 'by-updated': number };
	};
}

const DB_NAME = 'markdown-editor';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MarkdownEditorDB>> | null = null;

function getDB(): Promise<IDBPDatabase<MarkdownEditorDB>> {
	if (!dbPromise) {
		dbPromise = openDB<MarkdownEditorDB>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				const store = db.createObjectStore('projects', { keyPath: 'id' });
				store.createIndex('by-updated', 'updatedAt');
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
