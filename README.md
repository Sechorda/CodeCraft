CodeCraft - AI Programming Companion#
CodeCraft is an AI-powered programming companion that helps users generate code in various programming languages based on their specified tasks. It utilizes the Claude model from Anthropic to generate code and provides an interactive experience for users to refine the generated code based on their feedback.
Features

Generate code in JavaScript (js), Python (py), and Bash (sh) based on user-specified tasks
Execute the generated code in a secure, sandboxed environment using chroot
Iteratively refine the generated code based on user feedback
Save the final generated code to a file

Requirements

Node.js (version 12 or above)
npm (Node Package Manager)
dotenv (for managing environment variables)
axios (for making HTTP requests to the Anthropic API)
readline (for user input/output)
os (for accessing operating system functionality)
path (for working with file paths)
child_process (for executing shell commands)

Setup

Clone the repository:
Copy codegit clone https://github.com/yourusername/codecraft.git

Install the dependencies:
Copy codecd codecraft
npm install

Set up the environment variables:

Create a .env file in the project root directory.
Add the following line to the .env file, replacing YOUR_API_KEY with your actual Anthropic API key:
Copy codeANTHROPIC_API_KEY=YOUR_API_KEY




Usage

Run the CodeCraft program:
Copy codenode coder.js

Follow the prompts:

Enter a programming task when prompted.
Specify the programming language (js, py, or sh).


CodeCraft will generate code based on your task and display it.
If the generated code executes successfully, you can provide feedback to refine it further or type "done" if you are satisfied with the code.
If the generated code fails to execute, CodeCraft will attempt to generate code again (up to a maximum of 5 attempts).
Once you are satisfied with the code or reach the maximum attempts, the final code will be saved to a file named code.<language> in the project directory.

Limitations

CodeCraft relies on the Anthropic API for code generation, so an internet connection and a valid API key are required.
The generated code is executed in a sandboxed environment using chroot, but it's still important to review and validate the code before using it in production.
CodeCraft supports a limited set of programming languages (JavaScript, Python, and Bash) at the moment.

Contributing
Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request on the GitHub repository.
License
This project is licensed under the MIT License.
Acknowledgements

Anthropic for providing the Claude model used for code generation.
Node.js for the runtime environment.
All the open-source libraries and dependencies used in this project.
