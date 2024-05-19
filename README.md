# CodeCraft - AI Programming Companion

CodeCraft is an AI-powered programming companion that generates code in various languages based on user-specified tasks. It utilizes the Claude model from Anthropic to generate code and provides an interactive experience for users to refine the generated code based on their feedback.

## Features

- Generate code in JavaScript, Python, and Bash
- Execute code in a secure, sandboxed environment using chroot
- Iteratively refine code based on user feedback
- Save the final generated code to a file

## Requirements

- Node.js (version 12+)
- npm
- dotenv
- axios
- readline
- os
- path
- child_process

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/codecraft.git
   ```

2. Install dependencies:
   ```
   cd codecraft
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the project root.
   - Add the following line to the `.env` file, replacing `YOUR_API_KEY` with your Anthropic API key:
     ```
     ANTHROPIC_API_KEY=YOUR_API_KEY
     ```

## Usage

1. Run CodeCraft:
   ```
   node coder.js
   ```

2. Follow the prompts:
   - Enter a programming task.
   - Specify the programming language (js, py, or sh).

3. CodeCraft will generate code based on your task.

4. If the code executes successfully, you can provide feedback to refine it or type "done" if satisfied.

5. If the code fails to execute, CodeCraft will attempt to generate code again (up to 5 attempts).

6. The final code will be saved to `code.<language>` in the project directory.

## Limitations

- Requires an internet connection and a valid Anthropic API key.
- Generated code should be reviewed before use in production.
- Supports a limited set of programming languages.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on the GitHub repository.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- [Anthropic](https://www.anthropic.com/) for providing the Claude model.
- [Node.js](https://nodejs.org/) for the runtime environment.
- All the open-source libraries and dependencies used.
