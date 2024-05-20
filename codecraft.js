require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const child_process = require('child_process');
const readline = require('readline');
const os = require('os');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-3-opus-20240229';
const MAX_TOKENS = 1024;
const MAX_ATTEMPTS = 5;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(`\n${question}\n> `, (answer) => {
      resolve(answer);
    });
  });
}

async function generateCode(prompt) {
  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    }, {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
    });

    if (response.data && response.data.content && response.data.content.length > 0) {
      const content = response.data.content[0];
      if (content.type === 'text') {
        return content.text;
      } else {
        console.error('\n❌ Unexpected content type:', content.type);
        throw new Error(`Unexpected content type: ${content.type}`);
      }
    } else {
      console.error('\n❌ Unexpected API response format:', response.data);
      throw new Error(`Unexpected API response format: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('\n❌ Generation failed');
    console.error('Error details:', error.message);
    throw new Error(`Generation failed: ${error.message}`);
  }
}

async function executeCode(code, filePath) {
  const chrootDir = path.join(os.tmpdir(), 'chroot-sandycode');

  // Create the chroot directory if it doesn't exist
  if (!fs.existsSync(chrootDir)) {
    fs.mkdirSync(chrootDir);
  }

  // Write the code file inside the chroot directory
  const chrootFilePath = path.join(chrootDir, filePath);
  await fs.promises.mkdir(path.dirname(chrootFilePath), { recursive: true });
  await fs.promises.writeFile(chrootFilePath, code);

  try {
    let output;
    const fileExtension = path.extname(filePath);
    if (fileExtension === '.js') {
      output = child_process.execSync(`unshare -r -m sh -c "cd ${chrootDir} && node ${filePath}"`, { stdio: 'pipe' }).toString();
    } else if (fileExtension === '.py') {
      output = child_process.execSync(`unshare -r -m sh -c "cd ${chrootDir} && python3 ${filePath}"`, { stdio: 'pipe' }).toString();
    } else if (fileExtension === '.sh') {
      output = child_process.execSync(`unshare -r -m sh -c "cd ${chrootDir} && bash ${filePath}"`, { stdio: 'pipe' }).toString();
    }
    return null;
  } catch (error) {
    const errorMessage = error.stderr.toString().trim();
    return errorMessage;
  } finally {
    // Remove the code file from the chroot directory
    await fs.promises.unlink(chrootFilePath);
    
    // Remove the chroot directory and its contents
    await fs.promises.rm(chrootDir, { recursive: true });
  }
}

async function compileProjectDirectory(projectDir) {
  const validExtensions = ['.js', '.py', '.sh'];
  let combinedCode = '';

  async function processFile(filePath) {
    if (validExtensions.includes(path.extname(filePath))) {
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      combinedCode += `--- File: ${filePath} ---\n${fileContent}\n\n`;
    }
  }

  async function processDirectory(dirPath) {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        await processDirectory(fullPath);
      } else if (entry.isFile() && entry.name !== 'package.json' && entry.name !== 'package-lock.json') {
        await processFile(fullPath);
      }
    }
  }

  await processDirectory(projectDir);
  return combinedCode;
}

async function main() {
  console.log('\n┌────────────────────────────────┐');
  console.log('│ Welcome to AI Coding Assistant │');
  console.log('└────────────────────────────────┘');

  const taskType = await prompt('Enter "new" to generate new code or "modify" to modify existing code');

  let userPrompt;
  let combinedCode;

  if (taskType.toLowerCase() === 'new') {
    userPrompt = await prompt('Please enter a programming task or type "exit" to quit');
    if (userPrompt.toLowerCase() === 'exit') {
      console.log('\n👋 Goodbye!');
      rl.close();
      return;
    }

    const language = await prompt('Please specify the programming language (js/py/sh)');
    if (!['js', 'py', 'sh'].includes(language)) {
      console.log('\n❌ Unsupported language. Please choose from js, py, or sh.');
      rl.close();
      return;
    }

    const filename = `code.${language}`;

    let attempts = 0;
    let code;
    let error;

    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      try {
        code = await generateCode(`Write a ${language} script to ${userPrompt}. Return only the code without any formatting or explanations.`);
        console.log(`\n✨ Generated code (attempt ${attempts}):\n${code}\n`);
      } catch (error) {
        console.error('\n❌ Generation failed');
        console.error('Error details:', error.message);
        continue;
      }

      error = await executeCode(code, filename);
      if (!error) {
        console.log('\n✅ Code executed successfully!\n');
        break;
      }
      console.log(`\n❌ Execution failed (attempt ${attempts})`);
      console.log(`Error details: ${error}\n`);
    }

    if (attempts === MAX_ATTEMPTS) {
      console.log('\n❌ Failed to generate working code after maximum attempts.');
      rl.close();
      return;
    }

    let feedbackAttempts = 0;

    while (true) {
      const feedback = await prompt('Please provide feedback on the code or type "done" if satisfied');
      if (feedback.toLowerCase() === 'done') {
        console.log('\n✅ Code accepted.\n');
        break;
      }

      feedbackAttempts++;
      code = await generateCode(`Refine the following ${language} code based on this feedback: ${feedback}\n\n${code}\n\nOnly return the updated code without any explanations or introductory sentences.`);
      console.log(`\n✨ Updated code (feedback attempt ${feedbackAttempts}):\n${code}\n`);

      error = await executeCode(code, filename);
      if (error) {
        console.log(`\n❌ Execution failed (feedback attempt ${feedbackAttempts})`);
        console.log(`Error details: ${error}\n`);

        // Provide the error details to the AI model for generating better code
        code = await generateCode(`The previous code attempt failed with the following error:\n${error}\n\nPlease fix the code based on the error and the original feedback: ${feedback}\n\n${code}\n\nOnly return the updated code without any explanations or introductory sentences.`);
        console.log(`\n✨ Updated code (feedback attempt ${feedbackAttempts} - fix):\n${code}\n`);

        // Execute the updated code again
        error = await executeCode(code, filename);
        if (error) {
          console.log(`\n❌ Execution failed (feedback attempt ${feedbackAttempts} - fix)`);
          console.log(`Error details: ${error}\n`);
        } else {
          console.log('\n✅ Code executed successfully!\n');
        }
      } else {
        console.log('\n✅ Code executed successfully!\n');
      }
    }

    fs.writeFileSync(filename, code);
    console.log(`\n📝 Code saved to ${filename}\n`);
  } else if (taskType.toLowerCase() === 'modify') {
    const currentDir = process.cwd();
    console.log(`\n📂 Using current directory as the project directory: ${currentDir}`);
    combinedCode = await compileProjectDirectory(currentDir);
    
    userPrompt = await prompt('Please describe the modifications you want to make to the existing codebase using plain English');

    let attempts = 0;
    let modifiedCode;

    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      modifiedCode = await generateCode(`Analyze the following codebase and make the necessary modifications based on this request: ${userPrompt}\n\n${combinedCode}\n\nDetermine the files and code sections that need to be modified to fulfill the request. Only modify the code in the affected files and sections. For each modified file, return the updated code wrapped in a code block with the file path as follows:\n\n--- File: path/to/file.js ---\nmodified code here\n\nDo not include any explanations, comments, or statements other than the modified code. If no changes are needed in a file, do not include it in the response. Preserve the original code structure and only make the necessary modifications.`);

      let modifiedFilesRegex = /--- File: (.*) ---\n([\s\S]*?)(?=\n--- File: |\n*$)/g;
      let modifiedFileMatch;
      let allFilesExecutedSuccessfully = true;

      while ((modifiedFileMatch = modifiedFilesRegex.exec(modifiedCode)) !== null) {
        const [, filePath, modifiedFileCode] = modifiedFileMatch;
        console.log(`\n✨ Modified code for ${filePath}:\n${modifiedFileCode}\n`);
        
        // Execute the modified code and check for errors
        const error = await executeCode(modifiedFileCode, filePath);
        if (error) {
          console.log(`\n❌ Execution failed for ${filePath}`);
          console.log(`Error details: ${error}\n`);
          allFilesExecutedSuccessfully = false;
          break;
        }
      }

      if (allFilesExecutedSuccessfully) {
        break;
      }
    }

    if (attempts === MAX_ATTEMPTS) {
      console.log('\n❌ Failed to generate working modified code after maximum attempts.');
      rl.close();
      return;
    }

    // Write the successfully executed modified code to the files
    modifiedFilesRegex = /--- File: (.*) ---\n([\s\S]*?)(?=\n--- File: |\n*$)/g;
    while ((modifiedFileMatch = modifiedFilesRegex.exec(modifiedCode)) !== null) {
      const [, filePath, modifiedFileCode] = modifiedFileMatch;
      await fs.promises.writeFile(filePath, modifiedFileCode);
    }

    console.log('\n✅ Modified files updated successfully!\n');
  } else {
    console.log('\n❌ Invalid task type. Please enter "new" or "modify".');
    rl.close();
    return;
  }

  rl.close();
}

main();
