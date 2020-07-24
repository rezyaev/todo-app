import produce, { Draft } from "immer";
import { nanoid } from "nanoid";
import React, { useReducer, useState, useEffect } from "react";
import { DeepReadonly } from "ts-essentials";

// APP

export const App: React.FC = () => {
	const [state, dispatch] = useReducer(update, getInitialState());

	useEffect(() => {
		localStorage.setItem("state", JSON.stringify(state));
	}, [state]);

	return (
		<main className="h-full p-4 flex flex-col justify-between">
			<h1 className="font-bold text-2xl leading-none mb-4">Inbox</h1>
			<View state={state} dispatch={dispatch}></View>
		</main>
	);
};

// STATE

enum Status {
	Empty,
	FirstTask,
	NewTask,
	TaskList,
}

interface Task {
	id: string;
	title: string;
	done: boolean;
}

interface Table<T> {
	byId: { [id: string]: T };
	allIds: string[];
}

type State = DeepReadonly<{
	status: Status;
	tasks: Table<Task>;
}>;

const getInitialState = (): State => {
	const savedState = localStorage.getItem("state");

	if (savedState) {
		return JSON.parse(savedState) as State;
	}

	return {
		status: Status.Empty,
		tasks: {
			byId: {},
			allIds: [],
		},
	};
};

// UPDATE

enum ActionType {
	AddTask,
	UpdateTask,
	StartTaskCreation,
	CancelTaskCreation,
	DeleteTask,
}

type Action =
	| { type: ActionType.AddTask; payload: Task }
	| { type: ActionType.UpdateTask; payload: Task }
	| { type: ActionType.StartTaskCreation }
	| { type: ActionType.CancelTaskCreation }
	| { type: ActionType.DeleteTask; payload: string };

const update = produce(
	(state: Draft<State>, action: Action): State => {
		const { tasks } = state;

		switch (action.type) {
			case ActionType.AddTask: {
				const task = action.payload;
				state.status = Status.TaskList;
				state.tasks.byId[task.id] = task;
				state.tasks.allIds.push(task.id);
				return state;
			}

			case ActionType.UpdateTask: {
				const task = action.payload;
				state.tasks.byId[task.id] = task;
				return state;
			}

			case ActionType.StartTaskCreation: {
				state.status = tasks.allIds.length === 0 ? Status.FirstTask : Status.NewTask;
				return state;
			}

			case ActionType.CancelTaskCreation: {
				state.status = tasks.allIds.length === 0 ? Status.Empty : Status.TaskList;
				return state;
			}

			case ActionType.DeleteTask: {
				const id = action.payload;
				state.tasks.allIds = tasks.allIds.filter((taskId) => taskId !== id);
				state.status = state.tasks.allIds.length === 0 ? Status.Empty : Status.TaskList;
				return state;
			}
		}
	}
);

// VIEW

const View: React.FC<{ state: State; dispatch: React.Dispatch<Action> }> = ({
	state,
	dispatch,
}) => {
	const { status, tasks } = state;

	switch (status) {
		case Status.Empty:
			return <AllClearView dispatch={dispatch} />;

		case Status.FirstTask:
			return <TaskCreationForm dispatch={dispatch} />;

		case Status.NewTask:
			return (
				<>
					<TaskList tasks={tasks} dispatch={dispatch} />
					<TaskCreationForm dispatch={dispatch} />
				</>
			);

		case Status.TaskList:
			return (
				<>
					<TaskList tasks={tasks} dispatch={dispatch} />
					<AddTaskButton dispatch={dispatch}></AddTaskButton>
				</>
			);

		default:
			return <h2>There is no such state!</h2>;
	}
};

const AllClearView: React.FC<{ dispatch: React.Dispatch<Action> }> = ({ dispatch }) => {
	return (
		<div className="flex-1 flex flex-col justify-center">
			<div className="flex flex-col items-center">
				<InboxCheckIcon className="w-32 h-32" />
				<h2 className="text-xl dark:text-gray-300 mb-4">All clear</h2>
				<button
					className="block btn btn-primary"
					type="button"
					onClick={() => dispatch({ type: ActionType.StartTaskCreation })}
				>
					Add Task
				</button>
			</div>
		</div>
	);
};

const InboxCheckIcon: React.FC<{ className: string }> = ({ className }) => (
	<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<path
			className="fill-current dark:text-gray-500"
			d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2zm0 2v10h2a2 2 0 0 1 2 2c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h2V5H5z"
		/>
		<path
			className="fill-current dark:text-gray-500"
			d="M11 11.59l3.3-3.3a1 1 0 0 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-2-2a1 1 0 0 1 1.4-1.42l1.3 1.3z"
		/>
	</svg>
);

const TaskCreationForm: React.FC<{ dispatch: React.Dispatch<Action> }> = ({ dispatch }) => {
	const [newTaskTitle, setNewTaskTitle] = useState<string>("");

	return (
		<form className="mb-8">
			<input
				className="w-full input"
				type="text"
				placeholder="Buy a new laptop"
				aria-label="Create a new task"
				onChange={(event) => setNewTaskTitle(event.target.value)}
			/>
			<div className="flex justify-between">
				<button
					className="block btn btn-tertiary"
					type="button"
					onClick={() => dispatch({ type: ActionType.CancelTaskCreation })}
				>
					Cancel
				</button>
				<button
					className="block btn btn-primary"
					type="submit"
					disabled={!newTaskTitle}
					onClick={() =>
						dispatch({
							type: ActionType.AddTask,
							payload: { id: nanoid(), title: newTaskTitle, done: false },
						})
					}
				>
					Add task
				</button>
			</div>
		</form>
	);
};

const TaskList: React.FC<{ tasks: State["tasks"]; dispatch: React.Dispatch<Action> }> = ({
	tasks,
	dispatch,
}) => {
	return (
		<ul className="flex-1">
			{tasks.allIds.map((id) => (
				<TaskListItem key={id} task={tasks.byId[id]} dispatch={dispatch}></TaskListItem>
			))}
		</ul>
	);
};

const TaskListItem: React.FC<{ task: Task; dispatch: React.Dispatch<Action> }> = ({
	task,
	dispatch,
}) => {
	const { id, title, done } = task;

	const updateTask = (event: React.FormEvent<HTMLLabelElement | HTMLInputElement>) => {
		event.stopPropagation();
		return dispatch({ type: ActionType.UpdateTask, payload: { ...task, done: !done } });
	};

	return (
		<li className="relative border-b border-gray-300 dark:border-gray-800" key={id}>
			<label
				className={`flex items-center py-2 text-gray-800 dark:text-gray-400 ${
					done && "line-through"
				}`}
				onChange={updateTask}
			>
				<input
					className="form-checkbox text-red-600 border-none dark:bg-gray-700 rounded-full mr-2"
					type="checkbox"
					checked={done}
					onChange={updateTask}
				/>
				{title}
			</label>

			{done && (
				<button
					className="absolute inset-y-0 right-0"
					type="button"
					onClick={() => dispatch({ type: ActionType.DeleteTask, payload: id })}
				>
					<TrashIcon className="w-6 h-6"></TrashIcon>
				</button>
			)}
		</li>
	);
};

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
		<path
			className="fill-current dark:text-gray-600"
			d="M5 5h14l-.89 15.12a2 2 0 0 1-2 1.88H7.9a2 2 0 0 1-2-1.88L5 5zm5 5a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-1-1zm4 0a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-1-1z"
		/>
		<path
			className="fill-current dark:text-gray-700"
			d="M8.59 4l1.7-1.7A1 1 0 0 1 11 2h2a1 1 0 0 1 .7.3L15.42 4H19a1 1 0 0 1 0 2H5a1 1 0 1 1 0-2h3.59z"
		/>
	</svg>
);

const AddTaskButton: React.FC<{ dispatch: React.Dispatch<Action> }> = ({ dispatch }) => (
	<button
		className="fixed bottom-0 right-0 mr-6 mb-6 btn btn-primary btn-rounded"
		type="button"
		onClick={() => dispatch({ type: ActionType.StartTaskCreation })}
	>
		<AddIcon className="w-12 h-12"></AddIcon>
	</button>
);

const AddIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
		<path
			className="fill-current text-red-200"
			fillRule="evenodd"
			d="M17 11a1 1 0 0 1 0 2h-4v4a1 1 0 0 1-2 0v-4H7a1 1 0 0 1 0-2h4V7a1 1 0 0 1 2 0v4h4z"
		/>
	</svg>
);
