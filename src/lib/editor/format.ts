import { EditorSelection, type Line, type StateCommand } from '@codemirror/state';
import type { KeyBinding } from '@codemirror/view';
import { shortcuts } from '$lib/shortcuts';

function toggleWrap(mark: string): StateCommand {
	const n = mark.length;
	return ({ state, dispatch }) => {
		const tr = state.changeByRange((range) => {
			const outside =
				state.sliceDoc(Math.max(0, range.from - n), range.from) === mark &&
				state.sliceDoc(range.to, range.to + n) === mark;
			if (outside) {
				return {
					changes: [
						{ from: range.from - n, to: range.from },
						{ from: range.to, to: range.to + n }
					],
					range: EditorSelection.range(range.from - n, range.to - n)
				};
			}
			const text = state.sliceDoc(range.from, range.to);
			if (text.length >= n * 2 && text.startsWith(mark) && text.endsWith(mark)) {
				return {
					changes: { from: range.from, to: range.to, insert: text.slice(n, -n) },
					range: EditorSelection.range(range.from, range.to - n * 2)
				};
			}
			return {
				changes: [
					{ from: range.from, insert: mark },
					{ from: range.to, insert: mark }
				],
				range: EditorSelection.range(range.from + n, range.to + n)
			};
		});
		dispatch(state.update(tr, { scrollIntoView: true, userEvent: 'input' }));
		return true;
	};
}

function toggleLinePrefix(pattern: RegExp, prefix: (index: number) => string): StateCommand {
	return ({ state, dispatch }) => {
		const lines: Line[] = [];
		for (const range of state.selection.ranges) {
			const last = state.doc.lineAt(range.to).number;
			for (let n = state.doc.lineAt(range.from).number; n <= last; n++) {
				if (!lines.some((line) => line.number === n)) lines.push(state.doc.line(n));
			}
		}
		const remove = lines.every((line) => pattern.test(line.text));
		const changes = lines.map((line, i) =>
			remove
				? { from: line.from, to: line.from + (line.text.match(pattern)?.[0].length ?? 0) }
				: { from: line.from, insert: prefix(i) }
		);
		dispatch(state.update({ changes, scrollIntoView: true, userEvent: 'input' }));
		return true;
	};
}

const insertLink: StateCommand = ({ state, dispatch }) => {
	const tr = state.changeByRange((range) => {
		const insert = `[${state.sliceDoc(range.from, range.to)}]()`;
		const cursor = range.empty ? range.from + 1 : range.from + insert.length - 1;
		return {
			changes: { from: range.from, to: range.to, insert },
			range: EditorSelection.cursor(cursor)
		};
	});
	dispatch(state.update(tr, { scrollIntoView: true, userEvent: 'input' }));
	return true;
};

export const formatKeymap: KeyBinding[] = [
	{ key: shortcuts.bold.combo, run: toggleWrap('**') },
	{ key: shortcuts.italic.combo, run: toggleWrap('_') },
	{ key: shortcuts.code.combo, run: toggleWrap('`') },
	{ key: shortcuts.strike.combo, run: toggleWrap('~~') },
	{ key: shortcuts.link.combo, run: insertLink },
	{ key: shortcuts.quote.combo, run: toggleLinePrefix(/^> ?/, () => '> ') },
	{ key: shortcuts.orderedList.combo, run: toggleLinePrefix(/^\d+\. /, (i) => `${i + 1}. `) },
	{ key: shortcuts.bulletList.combo, run: toggleLinePrefix(/^[-*+] /, () => '- ') }
];
