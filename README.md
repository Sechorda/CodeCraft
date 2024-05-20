# AI Coding Assistant

The AI Coding Assistant is a command-line tool that leverages the power of AI to assist with generating and modifying code. It provides an interactive interface for users to specify programming tasks or modifications, and utilizes the Anthropic API to generate code based on the user's input.

## Features

- Generate new code snippets based on user-specified programming tasks
- Modify existing codebases based on user-provided instructions
- Support for multiple programming languages (JavaScript, Python, Shell)
- Interactive feedback loop for iterative code refinement
- Secure execution of generated code in a chroot environment
- Integration with the Anthropic API for AI-powered code generation

## Prerequisites

Before running the AI Coding Assistant, make sure you have the following:

- Node.js installed on your system
- An Anthropic API key (This will cost money based on usage)

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/sechorda/ai-coding-assistant.git
   ```

2. Navigate to the project directory:

   ```
   cd ai-coding-assistant
   ```

3. Install the required dependencies:

   ```
   npm install
   ```

4. Set the `ANTHROPIC_API_KEY` environment variable with your Anthropic API key. You can create a `.env` file in the project root and add the following line:

   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

## Usage

To start the AI Coding Assistant, run the following command:

```
node coder.js
```

The program will prompt you to choose between generating new code or modifying existing code.

### Generating New Code

1. Enter `new` when prompted for the task type.
2. Provide a programming task or description of the code you want to generate.
3. Specify the programming language (js/py/sh).
4. The assistant will generate code based on your input and display it.
5. You can provide feedback on the generated code or type `done` if satisfied.
6. The assistant will refine the code based on your feedback until you are satisfied.
7. The final code will be saved to a file with the appropriate extension.

### Modifying Existing Code

1. Enter `modify` when prompted for the task type.
2. The assistant will use the current directory as the project directory.
3. Provide a description of the modifications you want to make to the existing codebase.
4. The assistant will analyze the codebase and make the necessary modifications based on your request.
5. The modified code will be displayed for each affected file.
6. The modified files will be updated with the new code.

## Security

The AI Coding Assistant prioritizes security by executing the generated code in a chroot environment. This isolated environment prevents the code from accessing or modifying files outside the designated directory. The chroot directory is created in a temporary location and removed after code execution.

## Limitations

- The AI Coding Assistant relies on the Anthropic API for code generation, so the quality and accuracy of the generated code may vary.
- The tool supports a limited set of programming languages (JavaScript, Python, Shell) at the moment.
- The tool may not handle complex codebases or advanced programming concepts effectively.

## Contributing

Contributions to the AI Coding Assistant are welcome! If you encounter any issues or have suggestions for improvements, please open an issue or submit a pull request on the GitHub repository.

## License

The AI Coding Assistant is open-source software licensed under the [MIT License](LICENSE).
