# GEMINI Project Overview: Task Tracker

## Project Overview

This project is a command-line task tracker application built with TypeScript and Node.js. It follows a functional programming paradigm, heavily utilizing the `fp-ts` library for robust and composable code, and `io-ts` for runtime type safety and validation. The application allows users to manage tasks by adding, updating, deleting, and listing them directly from the command line. Task data is persisted in a local `tasks.json` file.

## Building and Running

### Prerequisites

*   Node.js and pnpm

### Installation

1.  Install dependencies:
    ```bash
    pnpm install
    ```

### Commands

The main entry point for the application is `src/index.ts`. You can use the following `pnpm` scripts to interact with the task tracker:

*   **Run Tests:**
    ```bash
    pnpm test
    ```

*   **Run Application:**
    The `launch` script is used to execute commands.

    *   **Add a task:**
        ```bash
        pnpm launch add "Your new task description"
        ```

    *   **List all tasks:**
        ```bash
        pnpm launch list
        ```

    *   **Update a task's description:**
        ```bash
        pnpm launch update <taskId> "The new description"
        ```

    *   **Mark a task as "in-progress":**
        ```bash
        pnpm launch mark-in-progress <taskId>
        ```

    *   **Mark a task as "done":**
        ```bash
        pnpm launch mark-done <taskId>
        ```

    *   **Delete a task:**
        ```bash
        pnpm launch delete <taskId>
        ```

## Development Conventions

*   **Functional Programming:** The codebase is written in a functional style. This means a preference for pure functions, immutability, and function composition. `fp-ts` is the primary library for achieving this.
*   **Type Safety:** `io-ts` is used for decoding and encoding data, ensuring that all data structures conform to their expected types at runtime. This is especially important for validating data from external sources like the `tasks.json` file.
*   **Modularity:** The code is organized into modules with clear responsibilities:
    *   `fs.ts`: Handles the reading and writing of tasks to the filesystem.
    *   `task-repository.ts`: Contains the core application logic for managing tasks.
    *   `task-service.ts`: Contains the business logic for managing tasks.
    *   `schema.ts`: Defines the data structures and validation rules using `io-ts`.
    *   `presentation.ts`: (Currently minimal) Intended for formatting the output to the console.
    *   `index.ts`: The main entry point that parses command-line arguments and orchestrates the application.
*   **Testing:** Tests are written with `vitest`. The project encourages writing tests for new and existing functionality to maintain code quality.
*   **Linting and Formatting**: The project uses `biome` for linting and formatting. You can use the following scripts:
    *   `pnpm lint`: Lints the code.
    *   `pnpm format`: Formats the code.
    *   `pnpm biome:both`: Lints and formats the code.
