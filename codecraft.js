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

async function executeCode(code, language) {
  const filename = `temp.${language}`;
  const chrootDir = path.join(os.tmpdir(), 'chroot-sandycode');

  // Create the chroot directory if it doesn't exist
  if (!fs.existsSync(chrootDir)) {
    fs.mkdirSync(chrootDir);
  }

  // Write the code file inside the chroot directory
  const chrootFilename = `${chrootDir}/${filename}`;
  fs.writeFileSync(chrootFilename, code);

  try {
    let output;
    if (language === 'js') {
      output = child_process.execSync(`unshare -r -m sh -c "cd ${chrootDir} && node ${filename}"`, { stdio: 'pipe' }).toString();
    } else if (language === 'py') {
      output = child_process.execSync(`unshare -r -m sh -c "cd ${chrootDir} && python3 ${filename}"`, { stdio: 'pipe' }).toString();
    } else if (language === 'sh') {
      output = child_process.execSync(`unshare -r -m sh -c "cd ${chrootDir} && bash ${filename}"`, { stdio: 'pipe' }).toString();
    }
    return null;
  } catch (error) {
    const errorMessage = error.stderr.toString().trim();
    return errorMessage;
  } finally {
    // Remove the code file from the chroot directory
    fs.unlinkSync(chrootFilename);
    
    // Remove the chroot directory and its contents
    fs.rmSync(chrootDir, { recursive: true });
  }
}

async function main() {
  console.log('\n┌────────────────────────────────┐');
  console.log('│ Welcome to AI Coding Assistant │');
  console.log('└────────────────────────────────┘');

  const userPrompt = await prompt('Please enter a programming task or type "exit" to quit');
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

    error = await executeCode(code, language);
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

  while (true) {
    const feedback = await prompt('Please provide feedback on the code or type "done" if satisfied');
    if (feedback.toLowerCase() === 'done') {
      console.log('\n✅ Code accepted.\n');
      break;
    }

    code = await generateCode(`Refine the following ${language} code based on this feedback: ${feedback}\n\n${code}\n\nOnly return the updated code.`);
    console.log(`\n✨ Updated code:\n${code}\n`);

    error = await executeCode(code, language);
    if (error) {
      console.log(`\n❌ Execution failed`);
      console.log(`Error details: ${error}\n`);
    } else {
      console.log('\n✅ Code executed successfully!\n');
    }
  }

  const filename = `code.${language}`;
  fs.writeFileSync(filename, code);
  console.log(`\n📝 Code saved to ${filename}\n`);

  rl.close();
}

main();
