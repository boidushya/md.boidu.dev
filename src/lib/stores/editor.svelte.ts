import {
	getAllProjects,
	getProject,
	saveProject,
	deleteProject,
	createProject,
	type Project
} from '$lib/db/projects';

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

	private saveTimeout: ReturnType<typeof setTimeout> | null = null;

	async init() {
		this.projects = await getAllProjects();
		if (this.projects.length > 0) {
			await this.loadProject(this.projects[0].id);
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
