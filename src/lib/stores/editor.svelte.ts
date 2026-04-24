import {
	getAllProjects,
	getProject,
	saveProject,
	deleteProject,
	createProject,
	getAllShares,
	saveShare,
	deleteShare,
	type Project,
	type ShareRecord
} from '$lib/db/projects';
import { createShare, hashPayload, ShareTooLarge } from '$lib/share/service';
import { toast } from 'svelte-sonner';

export type ViewMode = 'split' | 'editor' | 'preview';
export type SaveStatus = 'saved' | 'saving' | 'unsaved';

function extractTitle(content: string): string {
	// Match the first heading (h1-h6)
	const match = content.match(/^#{1,6}\s+(.+)$/m);
	if (match) {
		return match[1].trim();
	}
	return 'Untitled';
}

class EditorState {
	content = $state('');
	viewMode = $state<ViewMode>('split');
	currentProject = $state<Project | null>(null);
	projects = $state<Project[]>([]);
	saveStatus = $state<SaveStatus>('saved');
	sidebarOpen = $state(false);
	shares = $state<ShareRecord[]>([]);
	sharesOpen = $state(true);
	sharing = $state(false);

	private saveTimeout: ReturnType<typeof setTimeout> | null = null;

	async init() {
		const [projects, shares] = await Promise.all([getAllProjects(), getAllShares()]);
		this.projects = projects;
		this.shares = shares;
		if (this.projects.length > 0) {
			await this.loadProject(this.projects[0].id);
		}
	}

	addShare(record: ShareRecord) {
		this.shares = [record, ...this.shares];
	}

	async forgetShare(shareId: string): Promise<void> {
		await deleteShare(shareId);
		this.shares = this.shares.filter((s) => s.shareId !== shareId);
	}

	toggleShares() {
		this.sharesOpen = !this.sharesOpen;
	}

	async share(): Promise<void> {
		if (this.sharing) return;
		if (!this.content.trim()) return;
		this.sharing = true;
		try {
			await this.flushSave();
			const title = this.currentProject?.name ?? 'Untitled';
			const contentHash = await hashPayload(this.content, title);

			const existing = this.shares.find((s) => s.contentHash === contentHash);
			if (existing) {
				await navigator.clipboard.writeText(existing.url);
				toast('Reused existing share link', {
					description: 'This exact content was already shared'
				});
				return;
			}

			const payload = { content: this.content, title, createdAt: Date.now() };
			const { id, keyB64, url } = await createShare(payload);
			const record: ShareRecord = {
				shareId: id,
				projectId: this.currentProject?.id ?? null,
				title: payload.title,
				createdAt: payload.createdAt,
				keyB64,
				url,
				contentHash
			};
			await saveShare(record);
			this.addShare(record);
			await navigator.clipboard.writeText(url);
			toast.success('Share link copied to clipboard');
		} catch (err) {
			if (err instanceof ShareTooLarge) {
				toast.error('Document is too large to share (10 MB max)');
			} else {
				toast.error('Sharing failed — see console');
				console.error(err);
			}
		} finally {
			this.sharing = false;
		}
	}

	async loadProject(id: string) {
		const project = await getProject(id);
		if (project) {
			this.currentProject = project;
			this.content = project.content;
			this.saveStatus = 'saved';
		}
	}

	async newProject(name: string) {
		const project = await createProject(name);
		this.projects = [project, ...this.projects];
		this.currentProject = project;
		this.content = '';
		this.saveStatus = 'saved';
	}

	async removeProject(id: string) {
		await deleteProject(id);
		this.projects = this.projects.filter((p) => p.id !== id);
		if (this.currentProject?.id === id) {
			if (this.projects.length > 0) {
				await this.loadProject(this.projects[0].id);
			} else {
				this.currentProject = null;
				this.content = '';
			}
		}
	}

	updateContent(newContent: string) {
		this.content = newContent;
		this.saveStatus = 'unsaved';
		this.debouncedSave();
	}

	private debouncedSave() {
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
		}
		this.saveTimeout = setTimeout(() => {
			this.save();
		}, 500);
	}

	async flushSave(): Promise<void> {
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
			this.saveTimeout = null;
		}
		if (this.saveStatus !== 'saved') {
			await this.save();
		}
	}

	async save() {
		// Auto-create a project if none exists
		if (!this.currentProject) {
			if (!this.content.trim()) return; // Don't create empty projects
			const title = extractTitle(this.content);
			const project = await createProject(title);
			this.projects = [project, ...this.projects];
			this.currentProject = project;
		}

		this.saveStatus = 'saving';

		// Auto-update name if still "Untitled" and a title can be extracted
		let name = this.currentProject.name;
		if (name === 'Untitled') {
			const extracted = extractTitle(this.content);
			if (extracted !== 'Untitled') {
				name = extracted;
			}
		}

		const updated: Project = {
			...this.currentProject,
			name,
			content: this.content,
			updatedAt: Date.now()
		};
		await saveProject(updated);
		this.currentProject = updated;

		// Update in projects list
		this.projects = this.projects.map((p) => (p.id === updated.id ? updated : p));
		this.saveStatus = 'saved';
	}

	setViewMode(mode: ViewMode) {
		this.viewMode = mode;
	}

	toggleSidebar() {
		this.sidebarOpen = !this.sidebarOpen;
	}

	async forkFromShare(title: string, content: string): Promise<void> {
		const project = await createProject(title);
		const updated: Project = { ...project, content, updatedAt: Date.now() };
		await saveProject(updated);
		this.projects = [updated, ...this.projects];
		this.currentProject = updated;
		this.content = content;
		this.saveStatus = 'saved';
	}

	async renameProject(newName: string) {
		if (!this.currentProject) return;

		const updated: Project = {
			...this.currentProject,
			name: newName,
			updatedAt: Date.now()
		};
		await saveProject(updated);
		this.currentProject = updated;
		this.projects = this.projects.map((p) => (p.id === updated.id ? updated : p));
	}
}

export const editorState = new EditorState();
