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
import { copyFailed, copyText } from '$lib/share/clipboard';
import { isTouch } from '$lib/utils/platform';
import { toast } from 'svelte-sonner';

export type ViewMode = 'split' | 'editor' | 'preview';
export type SaveStatus = 'saved' | 'saving' | 'unsaved';

const NARROW_QUERY = '(max-width: 720px)';

function byRecent(projects: Project[]): Project[] {
	return [...projects].sort((a, b) => b.updatedAt - a.updatedAt);
}

function extractTitle(content: string): string {
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
	isNarrow = $state(false);
	effectiveViewMode = $derived<ViewMode>(
		this.isNarrow && this.viewMode === 'split' ? 'editor' : this.viewMode
	);

	private saveTimeout: ReturnType<typeof setTimeout> | null = null;

	async init() {
		const narrow = matchMedia(NARROW_QUERY);
		this.isNarrow = narrow.matches;
		narrow.addEventListener('change', (e) => {
			this.isNarrow = e.matches;
			if (e.matches) this.sidebarOpen = false;
		});

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

	share(): Promise<void> {
		if (this.sharing || !this.content.trim()) return Promise.resolve();
		this.sharing = true;
		const link = this.resolveShareLink();
		const copied = copyText(link.then((l) => l.url));
		return this.reportShare(link, copied);
	}

	private async resolveShareLink(): Promise<{ url: string; title: string; reused: boolean }> {
		await this.flushSave();
		const title = this.currentProject?.name ?? 'Untitled';
		const contentHash = await hashPayload(this.content, title);

		const existing = this.shares.find((s) => s.contentHash === contentHash);
		if (existing) return { url: existing.url, title, reused: true };

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
		return { url, title, reused: false };
	}

	private async reportShare(
		link: Promise<{ url: string; title: string; reused: boolean }>,
		copied: Promise<void>
	): Promise<void> {
		const [linkResult, copyResult] = await Promise.allSettled([link, copied]);
		this.sharing = false;

		if (linkResult.status === 'rejected') {
			const err = linkResult.reason;
			if (err instanceof ShareTooLarge) {
				toast.error('Document is too large to share (10 MB max)');
			} else {
				toast.error('Sharing failed, see console');
				console.error(err);
			}
			return;
		}

		const { url, title, reused } = linkResult.value;
		if (copyResult.status === 'rejected') {
			copyFailed(url, 'share link');
			return;
		}

		const nativeShare =
			isTouch() && 'share' in navigator
				? { action: { label: 'Share…', onClick: () => navigator.share({ url, title }) } }
				: {};
		if (reused) {
			toast('Share link copied', {
				description: 'This exact content was already shared',
				...nativeShare
			});
		} else {
			toast.success('Share link copied', nativeShare);
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

	async removeProject(id: string): Promise<Project | undefined> {
		if (this.currentProject?.id === id) await this.flushSave();
		const removed = await getProject(id);
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
		return removed;
	}

	async restoreProject(project: Project) {
		await this.flushSave();
		const restored = { ...project, updatedAt: Date.now() };
		await saveProject(restored);
		this.projects = byRecent([restored, ...this.projects]);
		await this.loadProject(restored.id);
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

		this.projects = byRecent(this.projects.map((p) => (p.id === updated.id ? updated : p)));
		this.saveStatus = 'saved';
	}

	setViewMode(mode: ViewMode) {
		this.viewMode = mode;
	}

	toggleSidebar() {
		this.sidebarOpen = !this.sidebarOpen;
	}

	async importFile(file: File): Promise<void> {
		const content = await file.text();
		const fromHeading = extractTitle(content);
		const name = fromHeading !== 'Untitled' ? fromHeading : file.name.replace(/\.(md|markdown|txt)$/i, '');
		await this.flushSave();
		await this.createFromContent(name, content);
	}

	async createFromContent(title: string, content: string): Promise<void> {
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
